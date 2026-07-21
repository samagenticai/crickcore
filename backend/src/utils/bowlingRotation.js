import { ApiError } from "./helpers.js";

export const consecutiveOverMessage =
  "A bowler cannot bowl two consecutive overs";

/** Sync over-break flags for matches saved before overBreakPending existed. */
export const syncOverBreakState = (liveScore) => {
  if (!liveScore) return;
  if (liveScore.overBreakPending) return;

  const legalBalls = liveScore.legalBalls ?? 0;
  if (legalBalls <= 0 || legalBalls % 6 !== 0 || !liveScore.bowler) return;

  if (!liveScore.lastOverBowler) {
    liveScore.lastOverBowler = liveScore.bowler;
    liveScore.overBreakPending = true;
    return;
  }

  if (String(liveScore.bowler) === String(liveScore.lastOverBowler)) {
    liveScore.overBreakPending = true;
  }
};

/** ID of the bowler who must not bowl the next over (just finished previous over). */
export const getConsecutiveOverExcludedBowlerId = (liveScore) => {
  if (!liveScore?.overBreakPending) return null;

  syncOverBreakState(liveScore);
  if (!liveScore.overBreakPending) return null;

  const excluded = liveScore.lastOverBowler;
  return excluded ? String(excluded) : null;
};

export const assertNotConsecutiveOverBowler = (liveScore, bowlerId) => {
  const excluded = getConsecutiveOverExcludedBowlerId(liveScore);
  if (!excluded || !bowlerId) return;
  if (String(bowlerId) === excluded) {
    throw new ApiError(400, consecutiveOverMessage);
  }
};

export const markOverBreakPending = (liveScore) => {
  if (!liveScore?.bowler) return;
  liveScore.lastOverBowler = liveScore.bowler;
  liveScore.overBreakPending = true;
};

export const clearOverBreakPending = (liveScore) => {
  if (!liveScore) return;
  liveScore.overBreakPending = false;
};
