import Player from "../models/Player.js";
import Ball from "../models/Ball.js";
import { buildInningsScorecard, buildFirstInningsScorecard } from "./scorecard.js";
import { enrichChaseMetrics, resolveTarget, resolveMaxOvers } from "./scoringInnings.js";

export const formatOvers = (legalBalls = 0) =>
  `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

export const calcRunRate = (runs = 0, legalBalls = 0) => {
  if (!legalBalls) return 0;
  return Math.round((runs / (legalBalls / 6)) * 100) / 100;
};

export const formatBallLabel = (ball) => {
  if (!ball) return null;
  if (ball.type === "wicket") return "W";
  if (ball.type === "wide") return ball.runs > 1 ? `Wd+${ball.runs - 1}` : "Wd";
  if (ball.type === "no_ball") return ball.batsmanRuns ? `Nb+${ball.batsmanRuns}` : "Nb";
  if (ball.type === "bye") return `B${ball.runs}`;
  if (ball.type === "leg_bye") return `Lb${ball.runs}`;
  return String(ball.runs);
};

const playerFields = "name jerseyNumber role photo";

const buildEnrichedLiveScore = (match, ls, playerData = {}) => {
  const maxOvers = resolveMaxOvers(match);
  const chase = enrichChaseMetrics(ls, maxOvers);
  const firstInnings = ls.firstInnings?.runs != null
    ? {
        ...(ls.firstInnings?.toObject?.() || ls.firstInnings),
        overs: formatOvers(ls.firstInnings.legalBalls || 0),
      }
    : null;

  return {
    ...ls,
    ...chase,
    target: resolveTarget(ls),
    ...playerData,
    firstInnings,
    overs: formatOvers(ls.legalBalls || 0),
    runRate: calcRunRate(ls.totalRuns || 0, ls.legalBalls || 0),
  };
};

export const enrichMatchLiveScore = async (matchDoc) => {
  const match = matchDoc?.toObject ? matchDoc.toObject() : { ...matchDoc };
  const ls = match.liveScore || {};
  const hasScoringActivity =
    ls.isInitialized || ls.awaitingSecondInnings || ls.firstInnings?.runs != null;

  if (!hasScoringActivity) {
    return {
      ...match,
      liveScore: { ...ls, isInitialized: false },
      lastBall: null,
      recentBalls: [],
      lastWicket: null,
      scorecard: { batting: [], bowling: [] },
    };
  }

  const inningsNumber = ls.inningsNumber || 1;

  if (ls.awaitingSecondInnings && !ls.isInitialized) {
    const [recentBallsRaw, firstInningsScorecard] = await Promise.all([
      Ball.find({ match: match._id, inningsNumber: 1 }).sort({ sequence: -1 }).limit(12),
      buildFirstInningsScorecard(match, ls),
    ]);

    const recentBalls = recentBallsRaw.reverse().map((ball) => ({
      _id: ball._id,
      type: ball.type,
      runs: ball.runs,
      batsmanRuns: ball.batsmanRuns,
      sequence: ball.sequence,
      label: formatBallLabel(ball),
      isLegal: ball.isLegal,
      overNumber: ball.overNumber,
    }));

    return {
      ...match,
      liveScore: buildEnrichedLiveScore(match, { ...ls, inningsNumber: 2 }),
      lastBall: recentBalls[recentBalls.length - 1] || null,
      recentBalls,
      lastWicket: null,
      scorecard: firstInningsScorecard,
    };
  }

  const recentBallFilter = { match: match._id };
  if (ls.isInitialized && inningsNumber) {
    recentBallFilter.inningsNumber = inningsNumber;
  }

  const [striker, nonStriker, bowler, lastBall, recentBallsRaw, lastWicketBall, allBalls, dismissed] =
    await Promise.all([
      ls.striker ? Player.findById(ls.striker).select(playerFields) : null,
      ls.nonStriker ? Player.findById(ls.nonStriker).select(playerFields) : null,
      ls.bowler ? Player.findById(ls.bowler).select(playerFields) : null,
      Ball.findOne({ match: match._id, ...(ls.isInitialized && inningsNumber ? { inningsNumber } : {}) }).sort({ sequence: -1 }),
      Ball.find(recentBallFilter).sort({ sequence: -1 }).limit(12),
      Ball.findOne({ match: match._id, inningsNumber, type: "wicket" })
        .sort({ sequence: -1 })
        .populate("dismissedPlayer", "name"),
      Ball.find({ match: match._id, inningsNumber }).sort({ sequence: 1 }),
      Ball.find({
        match: match._id,
        inningsNumber,
        type: "wicket",
        dismissedPlayer: { $ne: null },
      }).distinct("dismissedPlayer"),
    ]);

  const recentBalls = recentBallsRaw.reverse().map((ball) => ({
    _id: ball._id,
    type: ball.type,
    runs: ball.runs,
    batsmanRuns: ball.batsmanRuns,
    sequence: ball.sequence,
    label: formatBallLabel(ball),
    isLegal: ball.isLegal,
    overNumber: ball.overNumber,
  }));

  const scorecard = ls.isInitialized
    ? buildInningsScorecard(allBalls, match, { ...ls, dismissedPlayers: dismissed })
    : { batting: [], bowling: [] };

  let matchResult = null;
  if (match.status === "Completed") {
    const allMatchBalls = await Ball.find({ match: match._id }).sort({ sequence: 1 });
    const { buildMatchResult } = await import("./matchResult.js");
    matchResult = buildMatchResult(match, allMatchBalls);
  }

  return {
    ...match,
    liveScore: buildEnrichedLiveScore(match, ls, { striker, nonStriker, bowler }),
    lastBall: lastBall
      ? {
          _id: lastBall._id,
          type: lastBall.type,
          runs: lastBall.runs,
          sequence: lastBall.sequence,
          label: formatBallLabel(lastBall),
        }
      : null,
    recentBalls: matchResult?.ballHistory?.slice(-12) || recentBalls,
    lastWicket: lastWicketBall
      ? {
          playerName: lastWicketBall.dismissedPlayer?.name || "Batsman",
          dismissalType: lastWicketBall.dismissalType || "Out",
          label: formatBallLabel(lastWicketBall),
        }
      : null,
    scorecard: matchResult?.innings?.[matchResult.innings.length - 1]?.scorecard || scorecard,
    matchResult,
  };
};

export const enrichMatchesLiveScore = async (matches) =>
  Promise.all(matches.map((m) => enrichMatchLiveScore(m)));
