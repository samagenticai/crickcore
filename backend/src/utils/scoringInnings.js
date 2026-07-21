import { calcRunRate, formatOvers } from "./liveScore.js";

export const calcTarget = (firstInningsRuns) => Number(firstInningsRuns ?? 0) + 1;

/** Resolve chase target from stored value or first-innings snapshot (runs + 1). */
export const resolveTarget = (ls) => {
  if (ls?.firstInnings?.runs != null) {
    return calcTarget(ls.firstInnings.runs);
  }
  return ls?.target ?? null;
};

export const calcRunsRequired = (target, currentRuns) =>
  Math.max(0, (target ?? 0) - (currentRuns ?? 0));

export const resolveMaxOvers = (match) =>
  Number(match?.overs ?? match?.tournament?.overs ?? 20) || 20;

export const calcBallsRemaining = (legalBalls, maxOvers) => {
  const maxBalls = (maxOvers ?? 20) * 6;
  return Math.max(0, maxBalls - (legalBalls ?? 0));
};

export const calcRequiredRunRate = (target, currentRuns, legalBalls, maxBalls) => {
  const required = calcRunsRequired(target, currentRuns);
  const ballsRemaining = Math.max(0, maxBalls - (legalBalls ?? 0));
  if (ballsRemaining === 0) return required > 0 ? null : 0;
  return Math.round((required / (ballsRemaining / 6)) * 100) / 100;
};

export const isInningsOver = (ls, maxBalls) =>
  (ls?.legalBalls ?? 0) >= maxBalls || (ls?.wickets ?? 0) >= 10;

export const enrichChaseMetrics = (ls, maxOvers) => {
  const maxBalls = (maxOvers ?? 20) * 6;
  const target = resolveTarget(ls);
  const innings = ls?.inningsNumber ?? 1;
  const chaseStarted = innings >= 2 || ls?.awaitingSecondInnings;

  if (!chaseStarted || target == null) {
    return {
      target: null,
      runsRequired: null,
      requiredRunRate: null,
      ballsRemaining: null,
      maxOvers: maxOvers ?? 20,
      maxBalls,
    };
  }

  const runsRequired = calcRunsRequired(target, ls.totalRuns ?? 0);
  const ballsRemaining = calcBallsRemaining(ls.legalBalls ?? 0, maxOvers);
  const requiredRunRate = calcRequiredRunRate(
    target,
    ls.totalRuns ?? 0,
    ls.legalBalls ?? 0,
    maxBalls
  );

  return { target, runsRequired, requiredRunRate, ballsRemaining, maxOvers, maxBalls };
};

export const buildResultSummary = (match, winnerId, resultType, margin) => {
  const teamAId = String(match.teamA?._id || match.teamA);
  const teamBId = String(match.teamB?._id || match.teamB);
  const winnerIdStr = String(winnerId);
  const winnerName =
    winnerIdStr === teamAId
      ? match.teamA?.name || "Team A"
      : match.teamB?.name || "Team B";

  if (resultType === "tie") return "Match tied";
  if (resultType === "wickets") return `${winnerName} won by ${margin} wicket${margin === 1 ? "" : "s"}`;
  if (resultType === "runs") return `${winnerName} won by ${margin} run${margin === 1 ? "" : "s"}`;
  return `${winnerName} won`;
};

export const snapshotFirstInnings = (ls) => ({
  runs: ls.totalRuns ?? 0,
  wickets: ls.wickets ?? 0,
  legalBalls: ls.legalBalls ?? 0,
  overs: formatOvers(ls.legalBalls ?? 0),
  battingTeam: ls.battingTeam,
});

export const resetForSecondInnings = (ls, battingTeamId, bowlingTeamId) => {
  ls.inningsNumber = 2;
  ls.battingTeam = battingTeamId;
  ls.bowlingTeam = bowlingTeamId;
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
  ls.awaitingSecondInnings = false;
  ls.isInitialized = true;
  ls.overBreakPending = false;
  ls.lastOverBowler = null;
};

export const determineMatchResult = (match, ls, maxBalls) => {
  const teamAId = String(match.teamA._id || match.teamA);
  const teamBId = String(match.teamB._id || match.teamB);
  const battingId = String(ls.battingTeam);
  const bowlingId = String(ls.bowlingTeam);
  const target = ls.target;
  const runs = ls.totalRuns ?? 0;
  const wickets = ls.wickets ?? 0;

  if (target == null || ls.inningsNumber < 2) return null;

  // Chase successful
  if (runs >= target) {
    return {
      winner: battingId,
      loser: bowlingId,
      resultType: "wickets",
      margin: Math.max(0, 10 - wickets),
    };
  }

  // All out or overs complete without reaching target
  if (wickets >= 10 || ls.legalBalls >= maxBalls) {
    if (runs === target - 1) {
      return { winner: null, loser: null, resultType: "tie", margin: 0 };
    }
    const margin = target - 1 - runs;
    return {
      winner: bowlingId,
      loser: battingId,
      resultType: "runs",
      margin,
    };
  }

  return null;
};
