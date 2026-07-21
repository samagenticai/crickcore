import Team from "../models/Team.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";

export const createTeam = asyncHandler(async (req, res) => {
  const logoFile = req.file;
  const team = await Team.create({
    ...req.body,
    logo: logoFile ? await resolveUpload(logoFile, "teams/logos") : "",
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: team });
});

export const getTeams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "", tournament } = req.query;

  const query = { createdBy: req.user._id };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  if (tournament) query.tournament = tournament;

  const skip = (Number(page) - 1) * Number(limit);
  const [teams, total] = await Promise.all([
    Team.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Team.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: teams,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!team) throw new ApiError(404, "Team not found");
  res.json({ success: true, data: team });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const logoFile = req.file;
  const updateData = { ...req.body };
  if (logoFile) updateData.logo = await resolveUpload(logoFile, "teams/logos");

  const team = await Team.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );
  if (!team) throw new ApiError(404, "Team not found");
  res.json({ success: true, data: team });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!team) throw new ApiError(404, "Team not found");
  res.json({ success: true, message: "Team deleted" });
});
