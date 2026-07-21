export function battingTeamName(match) {
  if (!match?.liveScore?.battingTeam) return null;
  const batId = String(match.liveScore.battingTeam);
  const aId = String(match.teamA?._id || match.teamA);
  const bId = String(match.teamB?._id || match.teamB);
  if (batId === aId) return match.teamA?.name || "Team A";
  if (batId === bId) return match.teamB?.name || "Team B";
  return null;
}

export function bowlingTeamName(match) {
  if (!match?.liveScore?.bowlingTeam) return null;
  const bowlId = String(match.liveScore.bowlingTeam);
  const aId = String(match.teamA?._id || match.teamA);
  const bId = String(match.teamB?._id || match.teamB);
  if (bowlId === aId) return match.teamA?.name || "Team A";
  if (bowlId === bId) return match.teamB?.name || "Team B";
  return null;
}

export function hasLiveScoring(match) {
  if (match?.status !== "Live") return false;
  const ls = match?.liveScore;
  return Boolean(ls?.isInitialized || ls?.awaitingSecondInnings || ls?.firstInnings?.runs != null);
}

export function hasMatchResult(match) {
  return match?.status === "Completed" && Boolean(match?.matchResult?.innings?.length);
}

export function getChasingTeamId(match, liveScoreOverride) {
  const ls = liveScoreOverride ?? match?.liveScore;
  if (!ls) return null;

  // During innings break the backend already sets battingTeam to the chasing side.
  if (ls.awaitingSecondInnings && ls.battingTeam) {
    return String(ls.battingTeam);
  }

  if (ls.firstInnings?.battingTeam == null) return null;
  const firstBat = String(ls.firstInnings.battingTeam);
  const aId = String(match?.teamA?._id || match?.teamA);
  const bId = String(match?.teamB?._id || match?.teamB);
  return firstBat === aId ? bId : aId;
}

export function resolveChaseTarget(liveScore) {
  if (liveScore?.firstInnings?.runs != null) {
    return liveScore.firstInnings.runs + 1;
  }
  if (liveScore?.target != null) return liveScore.target;
  return null;
}

export function getExtrasSummary(liveScore) {
  if (!liveScore) {
    return { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 };
  }
  const wides = liveScore.wides ?? 0;
  const noBalls = liveScore.noBalls ?? 0;
  const byes = liveScore.byes ?? 0;
  const legByes = liveScore.legByes ?? 0;
  return {
    wides,
    noBalls,
    byes,
    legByes,
    total: wides + noBalls + byes + legByes,
  };
}

export function groupBallsByOver(recentBalls = []) {
  const map = new Map();
  for (const ball of recentBalls) {
    const over = ball.overNumber ?? 0;
    if (!map.has(over)) map.set(over, []);
    map.get(over).push(ball);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([overNumber, balls]) => ({ overNumber, balls }));
}
