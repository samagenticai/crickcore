import Ball from "../models/Ball.js";
import { ApiError } from "./helpers.js";

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

export const getMatchOvers = (match, tournament) =>
  match?.overs || tournament?.overs || 20;

export async function getBowlerInningsLegalBalls(matchId, inningsNumber, bowlerId) {
  return Ball.countDocuments({
    match: matchId,
    inningsNumber: inningsNumber || 1,
    bowler: bowlerId,
    isLegal: true,
  });
}

export async function assertBowlerWithinLimit(match, tournament, liveScore, bowlerId) {
  const matchOvers = getMatchOvers(match, tournament);
  const legalBalls = await getBowlerInningsLegalBalls(
    match._id,
    liveScore?.inningsNumber,
    bowlerId
  );

  if (hasReachedBowlingLimit(legalBalls, matchOvers)) {
    throw new ApiError(400, bowlingLimitMessage(matchOvers));
  }

  return legalBalls;
}
