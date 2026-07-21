import { asyncHandler, ApiError } from "../utils/helpers.js";
import { getMatchSummary } from "../services/matchSummaryService.js";

export const getOrganizerMatchSummary = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  if (!matchId?.match(/^[a-f\d]{24}$/i)) {
    throw new ApiError(400, "Invalid match id");
  }

  const data = await getMatchSummary(matchId, { userId: req.user._id });
  res.json({ success: true, data });
});
