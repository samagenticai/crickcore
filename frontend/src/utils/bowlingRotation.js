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

/** Exclude the bowler who just completed an over when the next over is due. */
export const getConsecutiveOverExcludedBowlerId = (liveScore) => {
  if (!liveScore?.overBreakPending) return null;

  syncOverBreakState(liveScore);
  if (!liveScore.overBreakPending) return null;

  const excluded = liveScore.lastOverBowler;
  return excluded ? String(excluded) : null;
};
