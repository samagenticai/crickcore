export const TOSS_DECISIONS = ["Bat", "Bowl"];

export const resolveBattingTeamFromToss = (match) => {
  if (!match?.tossWinner || !match?.tossDecision) return null;

  const teamAId = String(match.teamA?._id || match.teamA);
  const teamBId = String(match.teamB?._id || match.teamB);
  const tossWinnerId = String(match.tossWinner?._id || match.tossWinner);

  if (![teamAId, teamBId].includes(tossWinnerId)) return null;

  const otherId = tossWinnerId === teamAId ? teamBId : teamAId;
  return match.tossDecision === "Bat" ? tossWinnerId : otherId;
};

export const teamNameById = (match, teamId) => {
  const id = String(teamId);
  const aId = String(match.teamA?._id || match.teamA);
  if (id === aId) return match.teamA?.name || "Team A";
  return match.teamB?.name || "Team B";
};

export const formatTossDecisionLabel = (decision) =>
  decision === "Bat" ? "Bat First" : decision === "Bowl" ? "Bowl First" : decision;

export const formatTossResult = (match) => {
  if (!match?.tossWinner || !match?.tossDecision) return null;

  const winnerName =
    match.tossWinner?.name ||
    teamNameById(match, match.tossWinner?._id || match.tossWinner);
  const decisionText = match.tossDecision === "Bat" ? "bat first" : "bowl first";

  return `${winnerName} won the toss and elected to ${decisionText}`;
};

/** Viewer-facing line: "Toss: Team won the toss and elected to bat first." */
export const formatTossViewerLine = (match) => {
  const result = formatTossResult(match);
  return result ? `Toss: ${result}.` : null;
};
