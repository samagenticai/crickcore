import Match from "../models/Match.js";
import Ball from "../models/Ball.js";
import { ApiError } from "../utils/helpers.js";
import { buildMatchResult, groupBallsByOver } from "../utils/matchResult.js";
import { formatBallLabel, formatOvers } from "../utils/liveScore.js";
import { formatTossResult } from "../utils/toss.js";

const populateMatchQuery = (query) =>
  query
    .populate("teamA teamB winner tossWinner", "name logo city shortName")
    .populate("venue", "venueName groundAddress city state country")
    .populate({
      path: "tournament",
      select: "tournamentName createdBy isPublic isDeleted isArchived isStorageArchived",
    });

const buildFallOfWickets = (inningsBalls = []) => {
  let runs = 0;
  let wicket = 0;
  const rows = [];

  for (const ball of inningsBalls) {
    runs += ball.runs || 0;
    if (ball.type === "wicket") {
      wicket += 1;
      const legalToBall = inningsBalls
        .filter((b) => b.sequence <= ball.sequence && b.isLegal)
        .length;
      rows.push({
        wicket,
        score: runs,
        overs: formatOvers(legalToBall),
        batsman: ball.dismissedPlayer?.name || null,
      });
    }
  }

  return rows;
};

const enrichInningsWithFow = (innings = [], allBalls = []) =>
  innings.map((inn) => ({
    ...inn,
    fallOfWickets: buildFallOfWickets(
      allBalls.filter((b) => (b.inningsNumber || 1) === inn.inningsNumber)
    ),
  }));

const formatMatchInfo = (match) => {
  const tournament = match.tournament;
  const venue = match.venue;

  return {
    _id: match._id,
    matchNumber: match.matchNumber,
    status: match.status,
    round: match.round,
    scheduledDate: match.scheduledDate,
    matchTime: match.matchTime,
    resultSummary: match.resultSummary,
    resultType: match.resultType,
    resultMargin: match.resultMargin,
    tournamentId: tournament?._id,
    tournamentName: tournament?.tournamentName,
    teamA: match.teamA,
    teamB: match.teamB,
    tossWinner: match.tossWinner,
    tossDecision: match.tossDecision,
    winner: match.winner,
    venue: venue
      ? {
          name: venue.venueName || venue.name,
          city: venue.city,
          address: venue.groundAddress || venue.address,
          label: [venue.venueName || venue.name, venue.city].filter(Boolean).join(", "),
        }
      : null,
    tossResult: formatTossResult(match),
  };
};

/**
 * Build complete scorecard summary from MongoDB match + ball records.
 * Shared by organizer and public viewer endpoints.
 */
export async function getMatchSummary(matchId, { userId = null, publicAccess = false } = {}) {
  const match = await populateMatchQuery(Match.findById(matchId));
  if (!match) throw new ApiError(404, "Match not found");

  const tournament = match.tournament;
  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (publicAccess) {
    if (
      !tournament.isPublic ||
      tournament.isDeleted ||
      tournament.isArchived ||
      tournament.isStorageArchived
    ) {
      throw new ApiError(404, "Match not found");
    }
  } else if (userId && String(tournament.createdBy) !== String(userId)) {
    throw new ApiError(403, "Not authorized to view this match");
  }

  const allBalls = await Ball.find({ match: matchId })
    .sort({ sequence: 1 })
    .populate("dismissedPlayer", "name");

  const matchResult = buildMatchResult(match, allBalls);
  const innings = enrichInningsWithFow(matchResult?.innings || [], allBalls);

  const ballHistory =
    matchResult?.ballHistory ||
    allBalls.map((ball) => ({
      _id: ball._id,
      inningsNumber: ball.inningsNumber,
      type: ball.type,
      runs: ball.runs,
      batsmanRuns: ball.batsmanRuns,
      sequence: ball.sequence,
      label: formatBallLabel(ball),
      isLegal: ball.isLegal,
      overNumber: ball.overNumber,
      ballInOver: ball.ballInOver,
    }));

  const overTimeline =
    matchResult?.overTimeline ||
    [...new Set(allBalls.map((b) => b.inningsNumber || 1))].map((innNum) => ({
      inningsNumber: innNum,
      battingTeamName: null,
      overs: groupBallsByOver(
        ballHistory
          .filter((b) => (b.inningsNumber || 1) === innNum)
          .map((b) => ({
            ...b,
            overNumber: b.overNumber ?? 0,
          }))
      ),
    }));

  return {
    match: formatMatchInfo(match),
    innings,
    summary: matchResult?.summary || {
      winner: match.winner
        ? {
            _id: String(match.winner._id || match.winner),
            name: match.winner.name,
            logo: match.winner.logo,
          }
        : null,
      resultSummary: match.resultSummary,
      resultType: match.resultType,
      resultMargin: match.resultMargin,
      tossResult: formatTossResult(match),
      venue: formatMatchInfo(match).venue,
      matchDate: match.scheduledDate,
      matchTime: match.matchTime,
      round: match.round,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
      totalFours: 0,
      totalSixes: 0,
    },
    overTimeline,
    ballHistory,
  };
}
