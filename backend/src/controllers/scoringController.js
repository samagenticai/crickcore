import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import Ball from "../models/Ball.js";
import Player from "../models/Player.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { formatOvers, calcRunRate } from "../utils/liveScore.js";
import { buildInningsScorecard, buildFirstInningsScorecard } from "../utils/scorecard.js";
import { assertBowlerWithinLimit } from "../utils/bowlingLimits.js";
import {
  assertNotConsecutiveOverBowler,
  markOverBreakPending,
  clearOverBreakPending,
  syncOverBreakState,
} from "../utils/bowlingRotation.js";
import { resolveFixtures } from "./tournamentController.js";
import { finalizeTournamentIfComplete } from "../utils/tournamentStatus.js";
import { notifyMatchCompleted } from "../utils/notificationEvents.js";
import {
  buildResultSummary,
  calcTarget,
  determineMatchResult,
  enrichChaseMetrics,
  isInningsOver,
  resetForSecondInnings,
  resolveMaxOvers,
  resolveTarget,
  snapshotFirstInnings,
} from "../utils/scoringInnings.js";
import { recalculateTournamentStandings } from "../services/pointsTableService.js";
import { assertFirstInningsMatchesToss } from "../utils/toss.js";
import {
  setUmpiresAvailable,
  extractMatchUmpireIds,
} from "../utils/umpireMatchStatus.js";

const assertLiveMatch = async (matchId, userId) => {
  const match = await Match.findById(matchId)
    .populate("teamA teamB tossWinner", "name logo")
    .populate("teamAPlayingXI teamBPlayingXI", "name jerseyNumber role")
    .populate("umpires", "fullName umpireType city status")
    .populate("scorer", "fullName phone email status profilePhoto")
    .populate({
      path: "tournament",
      select: "tournamentName overs sponsors",
      populate: {
        path: "sponsors",
        select: "sponsorName companyName sponsorType logo website status",
      },
    });

  if (!match) throw new ApiError(404, "Match not found");

  const tournament = await Tournament.findOne({
    _id: match.tournament._id || match.tournament,
    createdBy: userId,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (match.status !== "Live") {
    throw new ApiError(400, "Scoring is only available for live matches");
  }

  return { match, tournament };
};

const getPlayingXI = (match, teamId) => {
  const id = String(teamId);
  if (id === String(match.teamA._id || match.teamA)) return match.teamAPlayingXI || [];
  if (id === String(match.teamB._id || match.teamB)) return match.teamBPlayingXI || [];
  return [];
};

const validatePlayerInXI = (match, teamId, playerId, label) => {
  const xi = getPlayingXI(match, teamId);
  const found = xi.some((p) => String(p._id || p) === String(playerId));
  if (!found) throw new ApiError(400, `${label} must be from the team's Playing XI`);
};

const BOWLER_ROLES = new Set(["Bowler", "All-Rounder"]);

const validateBowlerRole = async (playerId, label = "Bowler") => {
  const player = await Player.findById(playerId).select("role name");
  if (!player) throw new ApiError(400, `${label} not found`);
  if (!BOWLER_ROLES.has(player.role)) {
    throw new ApiError(
      400,
      `${player.name} cannot bowl — only Bowler or All-Rounder can be selected as ${label.toLowerCase()}`
    );
  }
  return player;
};

const getMaxBalls = (match, tournament) => resolveMaxOvers({ ...match, tournament }) * 6;

const getChasingTeamId = (match, ls) => {
  const firstBat = String(ls.firstInnings?.battingTeam);
  const teamAId = String(match.teamA._id || match.teamA);
  return firstBat === teamAId
    ? String(match.teamB._id || match.teamB)
    : teamAId;
};

const lockFirstInnings = (ls) => {
  const snapshot = snapshotFirstInnings(ls);
  ls.firstInnings = {
    runs: snapshot.runs,
    wickets: snapshot.wickets,
    legalBalls: snapshot.legalBalls,
    overs: snapshot.overs,
    battingTeam: snapshot.battingTeam,
  };
  ls.target = calcTarget(ls.firstInnings.runs);
};

const prepareSecondInnings = (match, ls) => {
  const firstBatId = String(ls.firstInnings?.battingTeam);
  const teamAId = String(match.teamA._id || match.teamA);
  const chasingId =
    firstBatId === teamAId
      ? String(match.teamB._id || match.teamB)
      : teamAId;

  ls.inningsNumber = 2;
  ls.battingTeam = chasingId;
  ls.bowlingTeam = firstBatId;
  ls.striker = null;
  ls.nonStriker = null;
  ls.bowler = null;
  ls.totalRuns = 0;
  ls.wickets = 0;
  ls.legalBalls = 0;
  ls.wides = 0;
  ls.noBalls = 0;
  ls.byes = 0;
  ls.legByes = 0;
  ls.inningsLocked = false;
  ls.awaitingSecondInnings = true;
  ls.isInitialized = false;
  ls.overBreakPending = false;
  ls.lastOverBowler = null;
};

const endFirstAndPrepareSecond = (match, ls) => {
  lockFirstInnings(ls);
  prepareSecondInnings(match, ls);
};

const finalizeLiveMatch = async (match, result) => {
  if (result.winner) {
    match.winner = result.winner;
  } else {
    match.winner = null;
  }
  match.status = "Completed";
  match.resultType = result.resultType;
  match.resultMargin = result.margin ?? 0;
  match.resultSummary = buildResultSummary(
    match,
    result.winner,
    result.resultType,
    result.margin
  );

  if (match.liveScore) {
    match.liveScore.inningsLocked = true;
  }

  match.markModified("liveScore");
  await match.save();

  const tournamentId = match.tournament._id || match.tournament;
  const tournamentDoc = await Tournament.findById(tournamentId).select(
    "createdBy tournamentName status"
  );

  const umpireIds = extractMatchUmpireIds(match);
  if (umpireIds.length > 0 && tournamentDoc?.createdBy) {
    await setUmpiresAvailable(umpireIds, tournamentDoc.createdBy);
  }

  await recalculateTournamentStandings(tournamentId, { Team, Match });
  await resolveFixtures(tournamentId);
  await finalizeTournamentIfComplete(tournamentId);

  if (tournamentDoc?.createdBy) {
    notifyMatchCompleted(tournamentDoc.createdBy, match, tournamentDoc).catch((err) =>
      console.error("[notification]", err.message)
    );
  }

  return match;
};

const buildLiveScorePayload = (match, ls, extras = {}) => {
  const maxOvers = resolveMaxOvers(match);
  const chase = enrichChaseMetrics(ls, maxOvers);
  const firstInnings = ls.firstInnings
    ? {
        ...(ls.firstInnings?.toObject?.() || ls.firstInnings),
        overs: formatOvers(ls.firstInnings.legalBalls || 0),
      }
    : null;

  return {
    ...(match.liveScore?.toObject?.() || match.liveScore || {}),
    ...extras,
    ...chase,
    target: resolveTarget(ls),
    firstInnings,
    overs: formatOvers((ls.legalBalls) || 0),
    runRate: calcRunRate(ls.totalRuns || 0, ls.legalBalls || 0),
  };
};

const populateScoreState = async (match) => {
  const ls = match.liveScore || {};
  const inningsNumber = ls.inningsNumber || 1;

  const [striker, nonStriker, bowler] = await Promise.all([
    ls.striker ? Player.findById(ls.striker).select("name jerseyNumber role") : null,
    ls.nonStriker ? Player.findById(ls.nonStriker).select("name jerseyNumber role") : null,
    ls.bowler ? Player.findById(ls.bowler).select("name jerseyNumber role") : null,
  ]);

  const recentBallFilter = { match: match._id };
  if (ls.isInitialized && inningsNumber) {
    recentBallFilter.inningsNumber = inningsNumber;
  } else if (ls.awaitingSecondInnings) {
    recentBallFilter.inningsNumber = 1;
  }

  const recentBalls = await Ball.find(recentBallFilter)
    .sort({ sequence: -1 })
    .limit(12)
    .populate("dismissedPlayer newBatsman", "name");

  const allBalls = await Ball.find({ match: match._id, inningsNumber })
    .sort({ sequence: 1 })
    .populate("dismissedPlayer", "name");

  const dismissed = await Ball.find({
    match: match._id,
    inningsNumber,
    type: "wicket",
    dismissedPlayer: { $ne: null },
  }).distinct("dismissedPlayer");

  let scorecard = { batting: [], bowling: [] };
  if (ls.isInitialized) {
    scorecard = buildInningsScorecard(allBalls, match, { ...ls, dismissedPlayers: dismissed });
  } else if (ls.awaitingSecondInnings) {
    scorecard = await buildFirstInningsScorecard(match, ls);
  }

  return {
    match: {
      _id: match._id,
      status: match.status,
      overs: match.overs,
      teamA: match.teamA,
      teamB: match.teamB,
      teamAPlayingXI: match.teamAPlayingXI,
      teamBPlayingXI: match.teamBPlayingXI,
      tournament: match.tournament,
      winner: match.winner,
      resultSummary: match.resultSummary,
      resultType: match.resultType,
      resultMargin: match.resultMargin,
      tossWinner: match.tossWinner,
      tossDecision: match.tossDecision,
      umpires: match.umpires || [],
      umpireNames: match.umpireNames || [],
      liveScore: buildLiveScorePayload(match, ls, { striker, nonStriker, bowler }),
    },
    liveScore: {
      ...buildLiveScorePayload(match, ls, { striker, nonStriker, bowler }),
      dismissedPlayers: dismissed,
    },
    recentBalls: recentBalls.reverse(),
    scorecard,
  };
};

export const getLiveMatches = asyncHandler(async (req, res) => {
  const tournaments = await Tournament.find({
    createdBy: req.user._id,
    isDeleted: false,
  }).select("_id tournamentName");

  const tournamentIds = tournaments.map((t) => t._id);
  if (tournamentIds.length === 0) {
    return res.json({ success: true, data: [], count: 0 });
  }

  const matches = await Match.find({
    tournament: { $in: tournamentIds },
    status: "Live",
  })
    .populate("teamA teamB tossWinner", "name logo city")
    .populate("umpires", "fullName umpireType city status")
    .populate("scorer", "fullName phone email status profilePhoto")
    .populate({
      path: "tournament",
      select: "tournamentName sponsors",
      populate: {
        path: "sponsors",
        select: "sponsorName companyName sponsorType logo website status",
      },
    })
    .sort({ startedAt: -1, matchNumber: 1 });

  const enriched = matches.map((m) => {
    const ls = m.liveScore || {};
    const maxOvers = resolveMaxOvers(m);
    const chase = enrichChaseMetrics(ls, maxOvers);
    return {
      ...m.toObject(),
      liveScore: {
        ...ls,
        ...chase,
        target: resolveTarget(ls),
        overs: formatOvers(ls.legalBalls || 0),
        runRate: calcRunRate(ls.totalRuns || 0, ls.legalBalls || 0),
      },
    };
  });

  res.json({ success: true, data: enriched, count: enriched.length });
});

export const getMatchScore = asyncHandler(async (req, res) => {
  const { match, tournament } = await assertLiveMatch(req.params.matchId, req.user._id);
  const data = await populateScoreState(match);
  res.json({ success: true, data });
});

export const initMatchScoring = asyncHandler(async (req, res) => {
  const { battingTeamId, strikerId, nonStrikerId, bowlerId } = req.body;
  const { match, tournament } = await assertLiveMatch(req.params.matchId, req.user._id);
  const ls = match.liveScore || {};
  const isSecondInnings = Boolean(ls.awaitingSecondInnings);

  if (!isSecondInnings && ls.isInitialized) {
    throw new ApiError(400, "Scoring is already initialized for this match");
  }

  if (isSecondInnings && ls.firstInnings?.runs == null) {
    throw new ApiError(400, "First innings must be completed before starting the second innings");
  }

  if (!battingTeamId || !strikerId || !nonStrikerId || !bowlerId) {
    throw new ApiError(400, "battingTeamId, strikerId, nonStrikerId, and bowlerId are required");
  }

  const teamAId = String(match.teamA._id || match.teamA);
  const teamBId = String(match.teamB._id || match.teamB);
  const battingId = String(battingTeamId);

  if (![teamAId, teamBId].includes(battingId)) {
    throw new ApiError(400, "battingTeamId must be one of the match teams");
  }

  const bowlingId = battingId === teamAId ? teamBId : teamAId;

  if (isSecondInnings) {
    const chasingId = getChasingTeamId(match, match.liveScore);
    if (battingId !== chasingId) {
      throw new ApiError(400, "Second innings batting team must be the chasing side");
    }
  } else {
    assertFirstInningsMatchesToss(match, battingId);
  }

  if (String(strikerId) === String(nonStrikerId)) {
    throw new ApiError(400, "Striker and non-striker must be different players");
  }

  validatePlayerInXI(match, battingId, strikerId, "Striker");
  validatePlayerInXI(match, battingId, nonStrikerId, "Non-striker");
  validatePlayerInXI(match, bowlingId, bowlerId, "Bowler");
  await validateBowlerRole(bowlerId);

  if (isSecondInnings) {
    resetForSecondInnings(match.liveScore, battingId, bowlingId);
    await assertBowlerWithinLimit(match, tournament, match.liveScore, bowlerId);
    match.liveScore.striker = strikerId;
    match.liveScore.nonStriker = nonStrikerId;
    match.liveScore.bowler = bowlerId;
  } else {
    await assertBowlerWithinLimit(match, tournament, match.liveScore, bowlerId);
    match.liveScore = {
      inningsNumber: 1,
      battingTeam: battingId,
      bowlingTeam: bowlingId,
      striker: strikerId,
      nonStriker: nonStrikerId,
      bowler: bowlerId,
      totalRuns: 0,
      wickets: 0,
      legalBalls: 0,
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      isInitialized: true,
      inningsLocked: false,
      awaitingSecondInnings: false,
      overBreakPending: false,
      lastOverBowler: null,
      target: null,
      firstInnings: {
        runs: null,
        wickets: null,
        legalBalls: null,
        battingTeam: null,
      },
    };
  }

  match.markModified("liveScore");
  await match.save();
  const data = await populateScoreState(match);
  res.json({
    success: true,
    message: isSecondInnings ? "Second innings started" : "Scoring initialized",
    data,
  });
});

export const endInnings = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  if (!matchId || !String(matchId).match(/^[a-f\d]{24}$/i)) {
    throw new ApiError(400, "Invalid match ID");
  }

  const { match } = await assertLiveMatch(matchId, req.user._id);
  const ls = match.liveScore;

  if (!ls?.isInitialized) {
    throw new ApiError(400, "No active innings — scoring is not initialized");
  }
  if (ls.inningsLocked) {
    throw new ApiError(400, "This innings is already locked");
  }
  if ((ls.inningsNumber || 1) >= 2 && ls.isInitialized) {
    throw new ApiError(400, "Second innings has already started");
  }
  if (ls.awaitingSecondInnings || ls.firstInnings?.runs != null) {
    throw new ApiError(400, "First innings has already ended — complete second innings setup to continue");
  }
  if ((ls.inningsNumber || 1) !== 1) {
    throw new ApiError(400, "Only the first innings can be ended manually");
  }

  endFirstAndPrepareSecond(match, ls);
  match.markModified("liveScore");
  await match.save();

  const data = await populateScoreState(match);
  res.status(200).json({
    success: true,
    message: "First innings ended — second innings ready for setup",
    data: {
      ...data,
      inningsComplete: true,
      awaitingSecondInnings: true,
    },
  });
});

export const recordBall = asyncHandler(async (req, res) => {
  const { type, runs = 0, dismissedPlayerId, newBatsmanId, newBowlerId, dismissalType } = req.body;
  const { match, tournament } = await assertLiveMatch(req.params.matchId, req.user._id);

  const ls = match.liveScore;
  if (!ls?.isInitialized) {
    throw new ApiError(400, "Initialize scoring before recording balls");
  }
  if (ls.inningsLocked) {
    throw new ApiError(400, "This innings is locked — no more balls can be recorded");
  }

  const validTypes = ["runs", "wide", "no_ball", "bye", "leg_bye", "wicket"];
  if (!validTypes.includes(type)) {
    throw new ApiError(400, `Invalid ball type. Must be one of: ${validTypes.join(", ")}`);
  }

  const maxBalls = getMaxBalls(match, tournament);
  if (ls.legalBalls >= maxBalls) {
    throw new ApiError(400, "Innings over — maximum overs reached");
  }
  if (ls.wickets >= 10) {
    throw new ApiError(400, "Innings over — all out");
  }

  syncOverBreakState(ls);

  if (ls.overBreakPending && !newBowlerId) {
    throw new ApiError(400, "Select a new bowler before starting the next over");
  }

  let runsScored = 0;
  let extras = 0;
  let batsmanRuns = 0;
  let isLegal = true;
  let rotateStrike = false;

  if (type === "runs") {
    const runValues = [0, 1, 2, 3, 4, 6];
    const r = Number(runs);
    if (!runValues.includes(r)) {
      throw new ApiError(400, "Runs must be 0, 1, 2, 3, 4, or 6");
    }
    runsScored = r;
    batsmanRuns = r;
    rotateStrike = r % 2 === 1;
  } else if (type === "wide") {
    const extra = Math.max(0, Number(runs) || 0);
    extras = 1 + extra;
    runsScored = extras;
    ls.wides += extras;
    isLegal = false;
    rotateStrike = extra % 2 === 1;
  } else if (type === "no_ball") {
    const batRuns = Math.max(0, Number(runs) || 0);
    extras = 1;
    runsScored = 1 + batRuns;
    batsmanRuns = batRuns;
    ls.noBalls += 1;
    isLegal = false;
    rotateStrike = batRuns % 2 === 1;
  } else if (type === "bye") {
    const r = Math.max(1, Number(runs) || 1);
    runsScored = r;
    ls.byes += r;
    rotateStrike = r % 2 === 1;
  } else if (type === "leg_bye") {
    const r = Math.max(1, Number(runs) || 1);
    runsScored = r;
    ls.legByes += r;
    rotateStrike = r % 2 === 1;
  } else if (type === "wicket") {
    if (!dismissedPlayerId || !newBatsmanId) {
      throw new ApiError(400, "dismissedPlayerId and newBatsmanId are required for a wicket");
    }
    const strikerId = String(ls.striker);
    const nonStrikerId = String(ls.nonStriker);
    const dismissedId = String(dismissedPlayerId);

    if (![strikerId, nonStrikerId].includes(dismissedId)) {
      throw new ApiError(400, "Dismissed player must be the striker or non-striker");
    }
    if (dismissedId === String(newBatsmanId)) {
      throw new ApiError(400, "New batsman cannot be the dismissed player");
    }

    validatePlayerInXI(match, ls.battingTeam, newBatsmanId, "New batsman");

    const alreadyOut = await Ball.find({
      match: match._id,
      inningsNumber: ls.inningsNumber,
      type: "wicket",
      dismissedPlayer: newBatsmanId,
    });
    if (alreadyOut.length > 0) {
      throw new ApiError(400, "New batsman is already dismissed");
    }
    if ([strikerId, nonStrikerId].includes(String(newBatsmanId))) {
      throw new ApiError(400, "New batsman is already at the crease");
    }

    ls.wickets += 1;
    if (dismissedId === strikerId) {
      ls.striker = newBatsmanId;
    } else {
      ls.nonStriker = newBatsmanId;
    }
  }

  if (isLegal) {
    ls.legalBalls += 1;
    if (ls.legalBalls % 6 === 0) {
      rotateStrike = true;
    }
  }

  if (type !== "wicket") {
    ls.totalRuns += runsScored;
  }

  if (rotateStrike && type !== "wicket") {
    const temp = ls.striker;
    ls.striker = ls.nonStriker;
    ls.nonStriker = temp;
  }

  if (newBowlerId) {
    validatePlayerInXI(match, ls.bowlingTeam, newBowlerId, "Bowler");
    await validateBowlerRole(newBowlerId);
    await assertBowlerWithinLimit(match, tournament, ls, newBowlerId);
    assertNotConsecutiveOverBowler(ls, newBowlerId);
    ls.bowler = newBowlerId;
    clearOverBreakPending(ls);
  }

  const lastBall = await Ball.findOne({ match: match._id }).sort({ sequence: -1 });
  const sequence = (lastBall?.sequence || 0) + 1;
  const legalBallsBefore = isLegal ? ls.legalBalls - 1 : ls.legalBalls;
  const overNumber = Math.floor(legalBallsBefore / 6);
  const ballInOver = isLegal ? (legalBallsBefore % 6) + 1 : (legalBallsBefore % 6) || 6;

  const ball = await Ball.create({
    match: match._id,
    tournament: tournament._id,
    inningsNumber: ls.inningsNumber,
    sequence,
    overNumber,
    ballInOver,
    isLegal,
    type,
    runs: runsScored,
    extras,
    batsmanRuns,
    totalRuns: ls.totalRuns,
    wickets: ls.wickets,
    legalBalls: ls.legalBalls,
    striker: ls.striker,
    nonStriker: ls.nonStriker,
    bowler: ls.bowler,
    dismissedPlayer: type === "wicket" ? dismissedPlayerId : null,
    newBatsman: type === "wicket" ? newBatsmanId : null,
    dismissalType: type === "wicket" ? dismissalType || "Out" : null,
    createdBy: req.user._id,
  });

  match.markModified("liveScore");

  let inningsComplete = false;
  let awaitingSecondInnings = false;
  let matchComplete = false;

  if ((ls.inningsNumber || 1) === 1 && isInningsOver(ls, maxBalls)) {
    endFirstAndPrepareSecond(match, ls);
    inningsComplete = true;
    awaitingSecondInnings = true;
  } else if (ls.inningsNumber === 2) {
    const result = determineMatchResult(match, ls, maxBalls);
    if (result) {
      await finalizeLiveMatch(match, result);
      matchComplete = true;
    }
  }

  await match.save();

  if (
    isLegal &&
    ls.legalBalls % 6 === 0 &&
    !inningsComplete &&
    !matchComplete &&
    ls.legalBalls < maxBalls
  ) {
    markOverBreakPending(ls);
    match.markModified("liveScore");
    await match.save();
  }

  const needsBowlerChange =
    !inningsComplete &&
    !matchComplete &&
    isLegal &&
    ls.overBreakPending &&
    ls.legalBalls < maxBalls;

  const data = await populateScoreState(match);
  res.status(201).json({
    success: true,
    message: matchComplete
      ? "Match completed"
      : inningsComplete
        ? "First innings complete"
        : "Ball recorded",
    data: {
      ...data,
      ball,
      needsBowlerChange,
      inningsComplete,
      awaitingSecondInnings,
      matchComplete,
    },
  });
});

export const updateBowler = asyncHandler(async (req, res) => {
  const { bowlerId } = req.body;
  const { match, tournament } = await assertLiveMatch(req.params.matchId, req.user._id);

  if (!match.liveScore?.isInitialized) {
    throw new ApiError(400, "Scoring is not initialized");
  }
  if (match.liveScore.inningsLocked) {
    throw new ApiError(400, "This innings is locked");
  }
  if (!bowlerId) throw new ApiError(400, "bowlerId is required");

  syncOverBreakState(match.liveScore);

  validatePlayerInXI(match, match.liveScore.bowlingTeam, bowlerId, "Bowler");
  await validateBowlerRole(bowlerId);
  await assertBowlerWithinLimit(match, tournament, match.liveScore, bowlerId);
  assertNotConsecutiveOverBowler(match.liveScore, bowlerId);
  match.liveScore.bowler = bowlerId;
  clearOverBreakPending(match.liveScore);
  match.markModified("liveScore");
  await match.save();

  const data = await populateScoreState(match);
  res.json({ success: true, message: "Bowler updated", data });
});
