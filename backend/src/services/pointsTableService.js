import mongoose from "mongoose";
import Team from "../models/Team.js";
import Match from "../models/Match.js";
import Tournament from "../models/Tournament.js";
import { ensureTournamentTeamLinks, loadTournamentTeams } from "../utils/tournamentTeams.js";
import {
  isGroupStageType,
  isHybridType,
  isKnockoutType,
} from "../constants/tournamentTypes.js";

/** In-flight recalculations — one write at a time per tournament. */
const inflightRecalc = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isWriteConflictError = (err) => {
  const msg = err?.message || "";
  return (
    err?.code === 112 ||
    err?.codeName === "WriteConflict" ||
    msg.includes("Write conflict") ||
    msg.includes("write conflict")
  );
};

/** Retry transient MongoDB write conflicts (common under concurrent standings updates). */
const withWriteConflictRetry = async (label, fn, { maxAttempts = 5, baseDelayMs = 40 } = {}) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isWriteConflictError(err) || attempt === maxAttempts) throw err;
      const delay = baseDelayMs * attempt + Math.floor(Math.random() * 30);
      console.warn(
        `[standings] Write conflict during ${label} (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }
};

const normalizeRecalcOptions = (third) => {
  if (typeof third === "number") return { depth: third, force: false };
  if (third && typeof third === "object") {
    return { depth: third.depth ?? 0, force: Boolean(third.force) };
  }
  return { depth: 0, force: false };
};

/** Net run rate from cumulative legal-ball totals (overs = legalBalls / 6). */
export const calcNetRunRate = (stats = {}) => {
  const oversFaced = (stats.oversFaced || 0) / 6;
  const oversBowled = (stats.oversBowled || 0) / 6;
  const runRate = oversFaced > 0 ? (stats.runsScored || 0) / oversFaced : 0;
  const concedeRate = oversBowled > 0 ? (stats.runsConceded || 0) / oversBowled : 0;
  return Math.round((runRate - concedeRate) * 1000) / 1000;
};

export const emptyTeamStats = () => ({
  played: 0,
  won: 0,
  lost: 0,
  tied: 0,
  noResult: 0,
  points: 0,
  runsScored: 0,
  oversFaced: 0,
  runsConceded: 0,
  oversBowled: 0,
  netRunRate: 0,
});

/** Format legal balls as cricket overs (e.g. 119 → "19.5"). */
export const ballsToOversDisplay = (balls = 0) => {
  const b = Math.max(0, Number(balls) || 0);
  const whole = Math.floor(b / 6);
  const rem = b % 6;
  return rem === 0 ? String(whole) : `${whole}.${rem}`;
};

export const extractMatchInningsTotals = (match) => {
  const ls = match.liveScore || {};
  const totals = [];
  const firstBat = ls.firstInnings?.battingTeam ? String(ls.firstInnings.battingTeam) : null;

  if (ls.firstInnings?.runs != null && firstBat) {
    totals.push({
      teamId: firstBat,
      runs: ls.firstInnings.runs ?? 0,
      legalBalls: ls.firstInnings.legalBalls ?? 0,
    });
  }

  const currentBat = ls.battingTeam ? String(ls.battingTeam) : null;
  const inningsNum = ls.inningsNumber ?? 1;
  const hasSecondInnings =
    inningsNum >= 2 ||
    (firstBat && currentBat && currentBat !== firstBat && (ls.isInitialized || match.status === "Completed"));

  if (hasSecondInnings && currentBat) {
    totals.push({
      teamId: currentBat,
      runs: ls.totalRuns ?? 0,
      legalBalls: ls.legalBalls ?? 0,
    });
  } else if (!firstBat && ls.isInitialized && currentBat) {
    totals.push({
      teamId: currentBat,
      runs: ls.totalRuns ?? 0,
      legalBalls: ls.legalBalls ?? 0,
    });
  }

  return totals;
};

const applyInningsToNrr = (innings, teamAId, teamBId, rowA, rowB) => {
  if (!innings.length) return;

  for (const inn of innings) {
    const row = inn.teamId === teamAId ? rowA : inn.teamId === teamBId ? rowB : null;
    if (row) {
      row.runsScored += inn.runs;
      row.oversFaced += inn.legalBalls;
    }
  }

  for (const inn of innings) {
    const batRow = inn.teamId === teamAId ? rowA : inn.teamId === teamBId ? rowB : null;
    const bowlRow = inn.teamId === teamAId ? rowB : inn.teamId === teamBId ? rowA : null;
    if (batRow && bowlRow) {
      bowlRow.runsConceded += inn.runs;
      bowlRow.oversBowled += inn.legalBalls;
    }
  }
};

const teamRefId = (team) => {
  if (!team) return null;
  return String(team._id || team);
};

const finishedMatchFilter = (tournamentId) => ({
  tournament: tournamentId,
  status: { $in: ["Completed", "Cancelled"] },
  teamA: { $ne: null },
  teamB: { $ne: null },
});

/** Each finished match should increment played once for each competing team. */
const countFinishedMatchesWithTeams = (MatchModel, tournamentId) =>
  MatchModel.countDocuments(finishedMatchFilter(tournamentId));

const sumPersistedMatchesPlayed = async (TeamModel, tournamentId) => {
  const tid = mongoose.Types.ObjectId.isValid(String(tournamentId))
    ? new mongoose.Types.ObjectId(String(tournamentId))
    : tournamentId;

  const result = await TeamModel.aggregate([
    { $match: { tournament: tid } },
    {
      $group: {
        _id: null,
        played: { $sum: { $ifNull: ["$stats.played", 0] } },
        points: { $sum: { $ifNull: ["$stats.points", 0] } },
      },
    },
  ]);

  return {
    played: result[0]?.played ?? 0,
    points: result[0]?.points ?? 0,
  };
};

/** Detect when persisted stats do not reflect completed match history (legacy data). */
export const standingsStatsMismatch = async (
  tournamentId,
  { Team: TeamModel = Team, Match: MatchModel = Match } = {}
) => {
  await ensureTournamentTeamLinks(tournamentId, { Team: TeamModel, Match: MatchModel });

  const [finishedCount, totals] = await Promise.all([
    countFinishedMatchesWithTeams(MatchModel, tournamentId),
    sumPersistedMatchesPlayed(TeamModel, tournamentId),
  ]);

  if (finishedCount === 0) return false;

  const expectedPlayed = finishedCount * 2;
  if (totals.played < expectedPlayed) {
    console.warn(
      `[standings] Stats mismatch for tournament ${tournamentId}: ` +
        `persisted played=${totals.played}, expected>=${expectedPlayed} ` +
        `from ${finishedCount} finished match(es), total points=${totals.points}`
    );
    return true;
  }

  return false;
};

const loadTeamsForStandingsRecalc = async (
  tournamentId,
  { Team: TeamModel = Team, Match: MatchModel = Match } = {}
) => {
  await ensureTournamentTeamLinks(tournamentId, { Team: TeamModel, Match: MatchModel });

  const matches = await MatchModel.find(finishedMatchFilter(tournamentId))
    .select("teamA teamB winner status liveScore resultType resultSummary updatedAt")
    .lean();

  const matchTeamIds = new Set();
  for (const match of matches) {
    const aId = teamRefId(match.teamA);
    const bId = teamRefId(match.teamB);
    if (aId) matchTeamIds.add(aId);
    if (bId) matchTeamIds.add(bId);
  }

  const teamLookup = {
    $or: [{ tournament: tournamentId }, ...(matchTeamIds.size ? [{ _id: { $in: [...matchTeamIds] } }] : [])],
  };

  const teams = await TeamModel.find(teamLookup);

  const teamMap = new Map();
  for (const team of teams) {
    if (String(team.tournament || "") !== String(tournamentId)) {
      team.tournament = tournamentId;
    }
    teamMap.set(String(team._id), team);
  }

  const linkedIds = [...teamMap.keys()];
  if (linkedIds.length > 0) {
    await TeamModel.updateMany({ _id: { $in: linkedIds } }, { $set: { tournament: tournamentId } });
    await Tournament.findByIdAndUpdate(tournamentId, { teams: linkedIds });
  }

  for (const team of teamMap.values()) {
    team.stats = emptyTeamStats();
  }

  return { teams: [...teamMap.values()], matches, teamMap };
};

const isMatchTied = (match) =>
  match.resultType === "tie" ||
  (match.status === "Completed" && !match.winner && match.resultSummary?.toLowerCase().includes("tied"));

export const applyMatchToTeamStats = (match, rowA, rowB) => {
  if (!rowA || !rowB) return;

  const aId = teamRefId(match.teamA);
  const bId = teamRefId(match.teamB);
  if (!aId || !bId) return;

  if (match.status === "Cancelled") {
    rowA.played += 1;
    rowB.played += 1;
    rowA.noResult += 1;
    rowB.noResult += 1;
    rowA.points += 1;
    rowB.points += 1;
    return;
  }

  if (match.status !== "Completed") return;

  rowA.played += 1;
  rowB.played += 1;

  const winnerId = teamRefId(match.winner);

  if (winnerId === aId || winnerId === bId) {
    const winRow = winnerId === aId ? rowA : rowB;
    const loseRow = winnerId === aId ? rowB : rowA;
    winRow.won += 1;
    winRow.points += 2;
    loseRow.lost += 1;
  } else if (isMatchTied(match)) {
    rowA.tied += 1;
    rowB.tied += 1;
    rowA.points += 1;
    rowB.points += 1;
  } else {
    rowA.noResult += 1;
    rowB.noResult += 1;
    rowA.points += 1;
    rowB.points += 1;
  }

  applyInningsToNrr(extractMatchInningsTotals(match), aId, bId, rowA, rowB);
};

export const sortStandingsRows = (rows) =>
  [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      (b.netRunRate ?? 0) - (a.netRunRate ?? 0) ||
      b.won - a.won ||
      a.name.localeCompare(b.name)
  );

export const getQualifyingSpots = (tournamentType, teamCount) => {
  if (isKnockoutType(tournamentType)) return 0;
  if (isGroupStageType(tournamentType) || isHybridType(tournamentType)) {
    const numGroups = teamCount >= 8 ? 4 : teamCount >= 4 ? 2 : 1;
    return numGroups * 2;
  }
  if (teamCount >= 4) return 4;
  if (teamCount >= 2) return 2;
  return 0;
};

const formatStandingsRow = (team, position) => {
  const stats = { ...emptyTeamStats(), ...(team.stats || {}) };
  return {
    position,
    teamId: String(team._id),
    name: team.name,
    shortName: team.shortName || "",
    logo: team.logo || "",
    city: team.city || "",
    played: stats.played,
    won: stats.won,
    lost: stats.lost,
    tied: stats.tied ?? 0,
    noResult: stats.noResult,
    points: stats.points,
    netRunRate: stats.netRunRate,
    runsScored: stats.runsScored,
    oversFaced: stats.oversFaced,
    oversFacedDisplay: ballsToOversDisplay(stats.oversFaced),
    runsConceded: stats.runsConceded,
    oversBowled: stats.oversBowled,
    oversBowledDisplay: ballsToOversDisplay(stats.oversBowled),
  };
};

/** True when persisted standings may be out of date vs completed matches. */
export const needsStandingsRecalc = async (tournamentId, { Team: TeamModel = Team, Match: MatchModel = Match } = {}) => {
  await ensureTournamentTeamLinks(tournamentId, { Team: TeamModel, Match: MatchModel });

  const [tournament, latestMatch, teamCount, completedCount] = await Promise.all([
    Tournament.findById(tournamentId).select("standingsUpdatedAt").lean(),
    MatchModel.findOne({
      tournament: tournamentId,
      status: { $in: ["Completed", "Cancelled"] },
    })
      .sort({ updatedAt: -1 })
      .select("updatedAt")
      .lean(),
    TeamModel.countDocuments({ tournament: tournamentId }),
    MatchModel.countDocuments({
      tournament: tournamentId,
      status: { $in: ["Completed", "Cancelled"] },
    }),
  ]);

  if (!tournament) return false;
  if (teamCount === 0) {
    if (completedCount > 0) {
      console.warn(
        `[standings] Tournament ${tournamentId} has ${completedCount} finished match(es) but no linked teams — sync team links`
      );
      return true;
    }
    return false;
  }
  if (!tournament.standingsUpdatedAt) return true;
  if (latestMatch?.updatedAt && latestMatch.updatedAt > tournament.standingsUpdatedAt) {
    return true;
  }
  if (await standingsStatsMismatch(tournamentId, { Team: TeamModel, Match: MatchModel })) {
    return true;
  }
  return false;
};

const applyCompletedMatchesToTeams = (matches, teamMap, tournamentId) => {
  let applied = 0;
  let skipped = 0;

  for (const match of matches) {
    const aId = teamRefId(match.teamA);
    const bId = teamRefId(match.teamB);

    if (!aId || !bId) {
      skipped += 1;
      console.warn(
        `[standings] Skipping match ${match._id} in tournament ${tournamentId}: missing teamA/teamB`
      );
      continue;
    }

    if (!teamMap.has(aId) || !teamMap.has(bId)) {
      skipped += 1;
      console.warn(
        `[standings] Skipping match ${match._id} in tournament ${tournamentId}: team(s) not linked (${aId}, ${bId})`
      );
      continue;
    }

    applyMatchToTeamStats(match, teamMap.get(aId), teamMap.get(bId));
    applied += 1;
  }

  console.log(
    `[standings] Tournament ${tournamentId}: applied ${applied} match(es), skipped ${skipped}`
  );
};

const persistStandingsRecalc = async (
  tournamentId,
  { Team: TeamModel = Team, Match: MatchModel = Match } = {}
) => {
  const { teams, matches, teamMap } = await loadTeamsForStandingsRecalc(tournamentId, {
    Team: TeamModel,
    Match: MatchModel,
  });

  applyCompletedMatchesToTeams(matches, teamMap, tournamentId);

  for (const team of teams) {
    team.stats.netRunRate = calcNetRunRate(team.stats);
  }

  const now = new Date();
  const bulkOps = teams.map((team) => ({
    updateOne: {
      filter: { _id: team._id },
      update: {
        $set: {
          stats: team.stats,
          tournament: tournamentId,
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await TeamModel.bulkWrite(bulkOps, { ordered: true });
  }
  await Tournament.findByIdAndUpdate(tournamentId, { standingsUpdatedAt: now });

  return teams;
};

const performRecalculate = async (tournamentId, deps = {}) =>
  withWriteConflictRetry(`standings recalc ${tournamentId}`, () =>
    persistStandingsRecalc(tournamentId, deps)
  );

/**
 * Force a full rebuild from every completed/cancelled match in the tournament.
 * Uses the same per-tournament queue as normal recalculation (no concurrent writes).
 */
export const rebuildTournamentStandings = async (tournamentId, deps = {}) => {
  console.log(`[standings] Rebuild requested for tournament ${tournamentId}`);
  await recalculateTournamentStandings(tournamentId, deps, { force: true });
  if (await standingsStatsMismatch(tournamentId, deps)) {
    console.warn(
      `[standings] Rebuild finished but stats still mismatch tournament ${tournamentId} — check team links`
    );
  }
};

/**
 * Full rebuild of tournament standings. Concurrent calls for the same tournament
 * share one in-flight operation, then re-run once if data changed during the write.
 */
export const recalculateTournamentStandings = async (tournamentId, deps = {}, third = 0) => {
  const { depth, force } = normalizeRecalcOptions(third);
  const key = String(tournamentId);

  if (inflightRecalc.has(key)) {
    await inflightRecalc.get(key);
    if (force) {
      // fall through — caller requested an explicit rebuild after the in-flight write
    } else if (depth < 2 && (await needsStandingsRecalc(tournamentId, deps))) {
      return recalculateTournamentStandings(tournamentId, deps, { depth: depth + 1 });
    } else {
      return;
    }
  }

  const promise = performRecalculate(tournamentId, deps).finally(() => {
    inflightRecalc.delete(key);
  });

  inflightRecalc.set(key, promise);
  await promise;

  if (!force && depth < 2 && (await needsStandingsRecalc(tournamentId, deps))) {
    return recalculateTournamentStandings(tournamentId, deps, { depth: depth + 1 });
  }
};

/**
 * Read standings from persisted team stats. Optionally force a recalculation first.
 */
export const getTournamentStandings = async (
  tournamentId,
  { recalculate = false, Team: TeamModel = Team, Match: MatchModel = Match } = {}
) => {
  const deps = { Team: TeamModel, Match: MatchModel };
  const stale = recalculate || (await needsStandingsRecalc(tournamentId, deps));

  if (stale) {
    await recalculateTournamentStandings(tournamentId, deps, { force: recalculate });
  } else if (!recalculate && (await standingsStatsMismatch(tournamentId, deps))) {
    await recalculateTournamentStandings(tournamentId, deps, { force: true });
  }

  const tournament = await Tournament.findById(tournamentId)
    .select("tournamentName tournamentType standingsUpdatedAt numberOfTeams")
    .lean();

  if (!tournament) return null;

  const teams = await loadTournamentTeams(tournamentId, { Team: TeamModel, Match: MatchModel });
  const sorted = sortStandingsRows(
    teams.map((t) => {
      const plain = t.toObject ? t.toObject() : t;
      const stats = plain.stats || emptyTeamStats();
      return {
        teamId: String(plain._id),
        name: plain.name,
        netRunRate: stats.netRunRate ?? calcNetRunRate(stats),
        points: stats.points ?? 0,
        won: stats.won ?? 0,
        _team: plain,
      };
    })
  );

  const rows = sorted.map((entry, index) => formatStandingsRow(entry._team, index + 1));
  const qualifyingSpots = getQualifyingSpots(tournament.tournamentType, rows.length);

  return {
    tournamentId: String(tournamentId),
    tournamentName: tournament.tournamentName,
    tournamentType: tournament.tournamentType,
    updatedAt: tournament.standingsUpdatedAt || null,
    qualifyingSpots,
    rows,
    count: rows.length,
  };
};

export { loadTournamentTeams, ensureTournamentTeamLinks };
