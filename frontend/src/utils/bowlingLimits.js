import { filterEligibleBowlers, playerId } from "./playerRoles";
import { consecutiveOverMessage } from "./bowlingRotation";

/** Max overs one bowler may bowl in an innings, based on match length. */
export const getMaxOversPerBowler = (matchOvers) => {
  const overs = Math.max(1, Number(matchOvers) || 20);
  if (overs >= 50) return 10;
  if (overs === 20) return 4;
  if (overs < 6) return 1;
  if (overs <= 10) return 2;
  return Math.min(10, Math.max(1, Math.floor(overs / 5)));
};

export const getMaxLegalBallsPerBowler = (matchOvers) =>
  getMaxOversPerBowler(matchOvers) * 6;

export const hasReachedBowlingLimit = (legalBalls, matchOvers) =>
  (legalBalls ?? 0) >= getMaxLegalBallsPerBowler(matchOvers);

export const bowlingLimitMessage = (matchOvers) => {
  const max = getMaxOversPerBowler(matchOvers);
  return `This bowler has reached the maximum bowling limit (${max} overs).`;
};

export const oversBowledFromLegalBalls = (legalBalls) =>
  Math.floor((legalBalls ?? 0) / 6);

export const formatBowlerSelectLabel = (playerName, legalBalls, matchOvers) => {
  const maxOvers = getMaxOversPerBowler(matchOvers);
  const oversBowled = oversBowledFromLegalBalls(legalBalls);
  if (hasReachedBowlingLimit(legalBalls, matchOvers)) {
    return `${playerName} (${maxOvers}/${maxOvers} Overs - Max Reached)`;
  }
  return `${playerName} (${oversBowled}/${maxOvers} Overs)`;
};

export const getBowlerLegalBallsFromScorecard = (scorecard, id) => {
  const row = scorecard?.bowling?.find((b) => String(b.playerId) === String(id));
  return row?.legalBalls ?? 0;
};

/** Build bowler dropdown rows with progress labels and limit flags. */
export const buildBowlerSelectOptions = (
  players = [],
  scorecard,
  matchOvers,
  excludeBowlerId = null
) =>
  filterEligibleBowlers(players).map((player) => {
    const id = playerId(player);
    const legalBalls = getBowlerLegalBallsFromScorecard(scorecard, id);
    const atLimit = hasReachedBowlingLimit(legalBalls, matchOvers);
    const consecutiveBlocked =
      excludeBowlerId && String(id) === String(excludeBowlerId);
    let label = formatBowlerSelectLabel(player?.name || "Player", legalBalls, matchOvers);
    if (consecutiveBlocked) {
      label = `${player?.name || "Player"} (cannot bowl consecutive overs)`;
    }
    return {
      player,
      id,
      legalBalls,
      atLimit,
      consecutiveBlocked,
      label,
    };
  });

export { consecutiveOverMessage };
