import mongoose from "mongoose";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
const MAX_PLAYERS_PER_TEAM = 15;

// Players cannot be added/edited/deleted once their tournament is completed.
const assertTournamentActive = async (tournamentId) => {
  if (!tournamentId) return;
  const tournament = await Tournament.findById(tournamentId).select("status");
  if (tournament && tournament.status === "Completed") {
    throw new ApiError(
      400,
      "This tournament is completed. Players can no longer be added, edited, or deleted."
    );
  }
};

// Rejects a jersey number already used by another player in the same team.
const assertJerseyAvailable = async (teamId, jerseyNumber, userId, excludePlayerId = null) => {
  if (!teamId || jerseyNumber === undefined || jerseyNumber === null) return;
  const query = { team: teamId, jerseyNumber, createdBy: userId };
  if (excludePlayerId) query._id = { $ne: excludePlayerId };
  const clash = await Player.findOne(query).select("_id");
  if (clash) {
    throw new ApiError(400, `Jersey number ${jerseyNumber} is already taken in this team`);
  }
};

// Turns "" / "null" / invalid ids into null and verifies the referenced
// document belongs to the current user. Prevents Mongoose CastErrors from
// empty form fields and cross-account references.
const resolveRef = async (Model, value, userId, label) => {
  if (value === undefined || value === null || value === "" || value === "null" || value === "undefined") {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label} reference`);
  }
  const doc = await Model.findOne({ _id: value, createdBy: userId }).select("_id");
  if (!doc) throw new ApiError(404, `${label} not found`);
  return doc._id;
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

export const createPlayer = asyncHandler(async (req, res) => {
  const { name, role, battingStyle, bowlingStyle } = req.body;

  if (!name || !name.trim()) throw new ApiError(400, "Player name is required");

  const teamId = await resolveRef(Team, req.body.team, req.user._id, "Team");
  const tournamentId = await resolveRef(Tournament, req.body.tournament, req.user._id, "Tournament");

  // Locked once the tournament is completed.
  await assertTournamentActive(tournamentId);

  const jerseyNumber = toNumber(req.body.jerseyNumber);

  if (teamId) {
    // Enforce the 15-player squad cap.
    const count = await Player.countDocuments({ team: teamId, createdBy: req.user._id });
    if (count >= MAX_PLAYERS_PER_TEAM) {
      throw new ApiError(400, `A team can have a maximum of ${MAX_PLAYERS_PER_TEAM} players`);
    }
    await assertJerseyAvailable(teamId, jerseyNumber, req.user._id);
  }

  const payload = {
    name: name.trim(),
    role: ROLES.includes(role) ? role : "Batsman",
    battingStyle: battingStyle || "",
    bowlingStyle: bowlingStyle || "",
    jerseyNumber,
    age: toNumber(req.body.age),
    photo: req.file ? await resolveUpload(req.file, "players/photos") : "",
    createdBy: req.user._id,
  };
  if (teamId) payload.team = teamId;
  if (tournamentId) payload.tournament = tournamentId;

  const player = await Player.create(payload);
  res.status(201).json({ success: true, data: player });
});

export const getPlayers = asyncHandler(async (req, res) => {
  const { team, tournament, search = "" } = req.query;

  const query = { createdBy: req.user._id };
  if (team && mongoose.Types.ObjectId.isValid(team)) query.team = team;
  if (tournament && mongoose.Types.ObjectId.isValid(tournament)) query.tournament = tournament;
  if (search) query.name = { $regex: search, $options: "i" };

  const players = await Player.find(query)
    .populate("team", "name logo")
    .sort({ jerseyNumber: 1, createdAt: -1 });

  res.json({ success: true, data: players, count: players.length });
});

export const getPlayer = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ _id: req.params.id, createdBy: req.user._id })
    .populate("team", "name logo")
    .populate("tournament", "tournamentName");
  if (!player) throw new ApiError(404, "Player not found");
  res.json({ success: true, data: player });
});

export const updatePlayer = asyncHandler(async (req, res) => {
  const { name, role, battingStyle, bowlingStyle } = req.body;

  const existing = await Player.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!existing) throw new ApiError(404, "Player not found");

  // Block edits while the player's (existing or target) tournament is completed.
  await assertTournamentActive(existing.tournament);

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (role !== undefined && ROLES.includes(role)) updateData.role = role;
  if (battingStyle !== undefined) updateData.battingStyle = battingStyle;
  if (bowlingStyle !== undefined) updateData.bowlingStyle = bowlingStyle;
  if (req.body.jerseyNumber !== undefined) updateData.jerseyNumber = toNumber(req.body.jerseyNumber);
  if (req.body.age !== undefined) updateData.age = toNumber(req.body.age);
  if (req.file) updateData.photo = await resolveUpload(req.file, "players/photos");

  if (req.body.team !== undefined) {
    updateData.team = await resolveRef(Team, req.body.team, req.user._id, "Team");
  }
  if (req.body.tournament !== undefined) {
    updateData.tournament = await resolveRef(Tournament, req.body.tournament, req.user._id, "Tournament");
    await assertTournamentActive(updateData.tournament);
  }

  const targetTeamId = updateData.team !== undefined ? updateData.team : existing.team;
  const targetJersey =
    updateData.jerseyNumber !== undefined ? updateData.jerseyNumber : existing.jerseyNumber;

  // No duplicate jersey numbers within the same team.
  await assertJerseyAvailable(targetTeamId, targetJersey, req.user._id, existing._id);

  // Enforce the squad cap when moving a player to a different team.
  if (updateData.team && String(updateData.team) !== String(existing.team || "")) {
    const count = await Player.countDocuments({ team: updateData.team, createdBy: req.user._id });
    if (count >= MAX_PLAYERS_PER_TEAM) {
      throw new ApiError(400, `A team can have a maximum of ${MAX_PLAYERS_PER_TEAM} players`);
    }
  }

  const player = await Player.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: player });
});

export const deletePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!player) throw new ApiError(404, "Player not found");

  // Cannot delete players from a completed tournament.
  await assertTournamentActive(player.tournament);

  await player.deleteOne();
  res.json({ success: true, message: "Player deleted" });
});
