/** Resolve display name for match scorer (live or historical snapshot). */
export function formatMatchScorerName(match) {
  if (!match) return "";
  if (match.scorer?.fullName) return match.scorer.fullName;
  if (match.scorerName) return match.scorerName;
  return "";
}

export function formatMatchScorerLine(match) {
  const name = formatMatchScorerName(match);
  if (!name) return "";
  return `Scorer: ${name}`;
}

export function formatScoredByLine(match) {
  const name = formatMatchScorerName(match);
  if (!name) return "";
  return `Scored By: ${name}`;
}
