import User from "../models/User.js";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Match from "../models/Match.js";
import Venue from "../models/Venue.js";
import Umpire from "../models/Umpire.js";
import Scorer from "../models/Scorer.js";
import Sponsor from "../models/Sponsor.js";
import Payment from "../models/Payment.js";
import { ROLES, normalizeRole } from "../constants/roles.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";
import {
  cascadeDeleteTournament,
  cascadeDeleteUser,
  cascadeDeleteTeam,
  cascadeDeleteMatch,
  cascadeDeletePlayer,
} from "../utils/adminCascade.js";
import { assertObjectId, toObjectIdOrNull, scrubEmptyObjectIdRefs } from "../utils/objectId.js";

const TEAM_FIELDS = [
  "name",
  "shortName",
  "captain",
  "viceCaptain",
  "coach",
  "manager",
  "teamOwner",
  "contactNumber",
  "email",
  "city",
  "homeGround",
  "teamColor",
  "tournament",
  "createdBy",
];

const PLAYER_FIELDS = [
  "name",
  "jerseyNumber",
  "age",
  "dateOfBirth",
  "phone",
  "email",
  "address",
  "role",
  "battingStyle",
  "bowlingStyle",
  "team",
  "tournament",
  "createdBy",
];

const pickFields = (body, keys) => {
  const out = {};
  for (const key of keys) {
    if (body[key] === undefined) continue;
    if (body[key] === "" || body[key] === null) {
      // Allow clearing string fields; skip empty ObjectId refs
      if (["tournament", "team", "createdBy"].includes(key)) continue;
      out[key] = "";
      continue;
    }
    out[key] = body[key];
  }
  return out;
};

const ageFromDob = (dob) => {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
};

const formatScoreLine = (match) => {
  const ls = match.liveScore;
  if (!ls) return null;
  const overs = ls.legalBalls != null ? `${Math.floor(ls.legalBalls / 6)}.${ls.legalBalls % 6}` : null;
  const current = `${ls.totalRuns ?? 0}/${ls.wickets ?? 0}${overs != null ? ` (${overs})` : ""}`;
  if (ls.firstInnings?.runs != null) {
    return `${ls.firstInnings.runs}/${ls.firstInnings.wickets ?? 0} & ${current}`;
  }
  return current;
};
const parsePage = (query, defLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const paginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit) || 1),
});

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalOrganizers,
    totalTournaments,
    totalTeams,
    totalPlayers,
    totalMatches,
    liveMatches,
    totalVenues,
    totalUmpires,
    totalSponsors,
    totalProUsers,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.ORGANIZER }),
    Tournament.countDocuments({ isDeleted: { $ne: true } }),
    Team.countDocuments(),
    Player.countDocuments(),
    Match.countDocuments(),
    Match.countDocuments({ status: "Live" }),
    Venue.countDocuments(),
    Umpire.countDocuments(),
    Sponsor.countDocuments(),
    User.countDocuments({
      subscriptionPlan: { $in: ["pro", "enterprise"] },
      subscriptionStatus: "active",
    }),
    Payment.aggregate([
      { $match: { paymentStatus: "succeeded" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      admin: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
      },
      stats: {
        totalUsers,
        totalOrganizers,
        totalTournaments,
        totalTeams,
        totalPlayers,
        totalMatches,
        liveMatches,
        totalVenues,
        totalUmpires,
        totalSponsors,
        totalProUsers,
        totalRevenue: revenueAgg[0]?.total || 0,
      },
    },
  });
});

/** Backward-compatible alias used by older AdminAreaPage */
export const getAdminOverview = getAdminDashboard;

export const listOrganizers = asyncHandler(async (_req, res) => {
  const organizers = await User.find({ role: ROLES.ORGANIZER })
    .sort({ createdAt: -1 })
    .select("fullName email role isActive createdAt subscriptionPlan subscriptionStatus");

  res.json({
    success: true,
    data: organizers.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.isActive ? "active" : "inactive",
      createdAt: u.createdAt,
      subscriptionPlan: u.subscriptionPlan,
    })),
  });
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};

  if (req.query.role && req.query.role !== "all") {
    query.role = normalizeRole(req.query.role);
  }
  if (req.query.status === "active") query.isActive = true;
  if (req.query.status === "inactive") query.isActive = false;
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ fullName: re }, { email: re }, { phone: re }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "fullName email phone role isActive profilePicture subscriptionPlan subscriptionStatus createdAt lastLoginAt country city"
      ),
  ]);

  res.json({
    success: true,
    data: {
      items: users.map((u) => ({
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        status: u.isActive ? "Active" : "Inactive",
        profilePicture: u.profilePicture,
        subscriptionPlan: u.subscriptionPlan,
        subscriptionStatus: u.subscriptionStatus,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        country: u.country,
        city: u.city,
      })),
      pagination: paginationMeta(total, page, limit),
    },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -adminSessionId");
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === ROLES.ADMIN && String(user._id) !== String(req.user._id)) {
    throw new ApiError(403, "Cannot modify another admin account.");
  }

  const allowed = ["fullName", "phone", "isActive", "country", "city"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }
  // Never escalate to admin via this endpoint
  if (req.body.role && normalizeRole(req.body.role) !== ROLES.ADMIN) {
    user.role = normalizeRole(req.body.role);
  }

  await user.save();
  res.json({
    success: true,
    message: "User updated",
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      status: user.isActive ? "Active" : "Inactive",
    },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot delete your own admin account.");
  }
  await cascadeDeleteUser(req.params.id);
  res.json({ success: true, message: "User and related data deleted" });
});

// ─── Tournaments ─────────────────────────────────────────────────────────────

export const listTournaments = asyncHandler(async (req, res) => {
  // Prevent CastError when legacy docs stored venue: ""
  await scrubEmptyObjectIdRefs(Tournament, ["venue"]);

  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.status && req.query.status !== "all") query.status = req.query.status;
  if (req.query.search) {
    query.tournamentName = new RegExp(escapeRegex(req.query.search.trim()), "i");
  }
  if (req.query.includeDeleted !== "true") query.isDeleted = { $ne: true };

  const [total, raw] = await Promise.all([
    Tournament.countDocuments(query),
    Tournament.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "fullName email")
      .populate({
        path: "venue",
        select: "venueName city",
        // skip populate when ref is null (already scrubbed)
      })
      .select(
        "tournamentName tournamentLogo tournamentType matchFormat status city groundName venue startDate endDate isPublished isDeleted createdBy createdAt"
      )
      .lean(),
  ]);

  const ids = raw.map((t) => t._id);
  const [teamCounts, matchCounts] = await Promise.all([
    Team.aggregate([
      { $match: { tournament: { $in: ids } } },
      { $group: { _id: "$tournament", count: { $sum: 1 } } },
    ]),
    Match.aggregate([
      { $match: { tournament: { $in: ids } } },
      { $group: { _id: "$tournament", count: { $sum: 1 } } },
    ]),
  ]);
  const teamMap = Object.fromEntries(teamCounts.map((c) => [String(c._id), c.count]));
  const matchMap = Object.fromEntries(matchCounts.map((c) => [String(c._id), c.count]));

  const items = raw.map((t) => ({
    ...t,
    teamsCount: teamMap[String(t._id)] || 0,
    matchesCount: matchMap[String(t._id)] || 0,
    venueName: t.venue?.venueName || t.groundName || t.city || null,
    organizerName: t.createdBy?.fullName || t.createdBy?.email || null,
    typeLabel: t.tournamentType || t.matchFormat || null,
  }));

  res.json({
    success: true,
    data: { items, pagination: paginationMeta(total, page, limit) },
  });
});

export const getTournament = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "tournament id");
  await scrubEmptyObjectIdRefs(Tournament, ["venue"]);

  const tournament = await Tournament.findById(id)
    .populate("createdBy", "fullName email")
    .populate("venue", "venueName city");
  if (!tournament || tournament.isDeleted) throw new ApiError(404, "Tournament not found");
  const [teamsCount, matchesCount] = await Promise.all([
    Team.countDocuments({ tournament: tournament._id }),
    Match.countDocuments({ tournament: tournament._id }),
  ]);
  res.json({
    success: true,
    data: {
      ...tournament.toObject(),
      teamsCount,
      matchesCount,
      venueName: tournament.venue?.venueName || tournament.groundName || tournament.city || null,
      organizerName: tournament.createdBy?.fullName || tournament.createdBy?.email || null,
    },
  });
});

export const deleteTournament = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "tournament id");
  const tournament = await Tournament.findById(id);
  if (!tournament) throw new ApiError(404, "Tournament not found");
  await cascadeDeleteTournament(tournament._id);
  res.json({ success: true, message: "Tournament and related data deleted" });
});

export const updateTournament = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "tournament id");
  const allowed = [
    "tournamentName",
    "status",
    "city",
    "isPublished",
    "isArchived",
    "tournamentType",
    "matchFormat",
    "startDate",
    "endDate",
    "groundName",
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Venue: never persist "" — null means no venue selected
  if (req.body.venue !== undefined) {
    const venueId = toObjectIdOrNull(req.body.venue);
    if (req.body.venue !== "" && req.body.venue != null && venueId == null) {
      throw new ApiError(400, "Invalid venue id. Select a valid venue or leave it empty.");
    }
    if (venueId) {
      const venueExists = await Venue.exists({ _id: venueId });
      if (!venueExists) throw new ApiError(400, "Venue not found.");
      updates.venue = venueId;
    } else {
      updates.venue = null;
    }
  }

  const tournament = await Tournament.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("createdBy", "fullName email")
    .populate("venue", "venueName city");
  if (!tournament) throw new ApiError(404, "Tournament not found");
  res.json({ success: true, data: tournament });
});

// ─── Teams ───────────────────────────────────────────────────────────────────

export const listTeams = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ name: re }, { shortName: re }, { city: re }, { captain: re }];
  }
  if (req.query.tournament && req.query.tournament !== "all") {
    query.tournament = req.query.tournament;
  }
  if (req.query.city) query.city = new RegExp(escapeRegex(req.query.city.trim()), "i");

  const [total, raw] = await Promise.all([
    Team.countDocuments(query),
    Team.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("tournament", "tournamentName status")
      .populate("createdBy", "fullName email")
      .lean(),
  ]);

  const ids = raw.map((t) => t._id);
  const playerCounts = await Player.aggregate([
    { $match: { team: { $in: ids } } },
    { $group: { _id: "$team", count: { $sum: 1 } } },
  ]);
  const pMap = Object.fromEntries(playerCounts.map((c) => [String(c._id), c.count]));

  const items = raw.map((t) => ({
    ...t,
    playersCount: pMap[String(t._id)] || 0,
  }));

  res.json({
    success: true,
    data: { items, pagination: paginationMeta(total, page, limit) },
  });
});

export const getTeam = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "team id");
  const team = await Team.findById(id)
    .populate("tournament", "tournamentName status")
    .populate("createdBy", "fullName email");
  if (!team) throw new ApiError(404, "Team not found");
  const squad = await Player.find({ team: team._id })
    .select("name photo jerseyNumber role")
    .sort({ jerseyNumber: 1 });
  res.json({ success: true, data: { ...team.toObject(), squad, playersCount: squad.length } });
});

export const createTeam = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, TEAM_FIELDS);
  if (!data.name?.trim()) throw new ApiError(400, "Team name is required");
  data.name = data.name.trim();

  if (req.file) data.logo = await resolveUpload(req.file, "teams/logos");

  if (data.tournament) {
    data.tournament = toObjectIdOrNull(data.tournament);
    if (!data.tournament) throw new ApiError(400, "Invalid tournament id.");
    const tournament = await Tournament.findById(data.tournament).select("createdBy");
    if (!tournament) throw new ApiError(404, "Tournament not found");
    if (!data.createdBy) data.createdBy = tournament.createdBy;
  }
  if (data.createdBy) {
    data.createdBy = toObjectIdOrNull(data.createdBy) || req.user._id;
  }
  if (!data.createdBy) data.createdBy = req.user._id;

  const team = await Team.create(data);

  // Optional squad: comma-separated or JSON array of player IDs
  let squadIds = req.body.squad;
  if (typeof squadIds === "string" && squadIds.trim()) {
    try {
      squadIds = JSON.parse(squadIds);
    } catch {
      squadIds = squadIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(squadIds) && squadIds.length) {
    await Player.updateMany(
      { _id: { $in: squadIds } },
      { $set: { team: team._id, tournament: team.tournament || undefined, createdBy: team.createdBy } }
    );
  }

  const populated = await Team.findById(team._id)
    .populate("tournament", "tournamentName")
    .populate("createdBy", "fullName email");
  res.status(201).json({ success: true, data: populated, message: "Team created successfully." });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "team id");
  const updates = pickFields(req.body, TEAM_FIELDS.filter((k) => k !== "createdBy"));
  if (req.file) updates.logo = await resolveUpload(req.file, "teams/logos");
  if (updates.name) updates.name = String(updates.name).trim();
  if (updates.tournament !== undefined) {
    updates.tournament = toObjectIdOrNull(updates.tournament);
  }

  const team = await Team.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("tournament", "tournamentName")
    .populate("createdBy", "fullName email");
  if (!team) throw new ApiError(404, "Team not found");

  let squadIds = req.body.squad;
  if (typeof squadIds === "string" && squadIds.trim()) {
    try {
      squadIds = JSON.parse(squadIds);
    } catch {
      squadIds = squadIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(squadIds)) {
    await Player.updateMany({ team: team._id }, { $unset: { team: 1 } });
    if (squadIds.length) {
      await Player.updateMany(
        { _id: { $in: squadIds } },
        { $set: { team: team._id, tournament: team.tournament || undefined } }
      );
    }
  }

  res.json({ success: true, data: team, message: "Team updated successfully." });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "team id");
  await cascadeDeleteTeam(id);
  res.json({ success: true, message: "Team deleted" });
});

// ─── Players ─────────────────────────────────────────────────────────────────

export const listPlayers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  if (req.query.team && req.query.team !== "all") query.team = req.query.team;
  if (req.query.tournament && req.query.tournament !== "all") query.tournament = req.query.tournament;
  if (req.query.role && req.query.role !== "all") query.role = req.query.role;

  const [total, items] = await Promise.all([
    Player.countDocuments(query),
    Player.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("team", "name shortName logo")
      .populate("tournament", "tournamentName")
      .populate("createdBy", "fullName email"),
  ]);

  res.json({
    success: true,
    data: { items, pagination: paginationMeta(total, page, limit) },
  });
});

export const getPlayer = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "player id");
  const player = await Player.findById(id)
    .populate("team", "name shortName logo")
    .populate("tournament", "tournamentName")
    .populate("createdBy", "fullName email");
  if (!player) throw new ApiError(404, "Player not found");
  res.json({ success: true, data: player });
});

export const createPlayer = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, PLAYER_FIELDS);
  if (!data.name?.trim()) throw new ApiError(400, "Player name is required");
  data.name = data.name.trim();
  if (req.file) data.photo = await resolveUpload(req.file, "players/photos");

  if (data.dateOfBirth) {
    data.dateOfBirth = new Date(data.dateOfBirth);
    const computed = ageFromDob(data.dateOfBirth);
    if (computed != null && data.age == null) data.age = computed;
  }
  if (data.jerseyNumber != null) data.jerseyNumber = Number(data.jerseyNumber);
  if (data.age != null) data.age = Number(data.age);

  if (data.team) {
    const team = await Team.findById(data.team).select("tournament createdBy");
    if (!team) throw new ApiError(404, "Team not found");
    if (!data.tournament) data.tournament = team.tournament;
    if (!data.createdBy) data.createdBy = team.createdBy;
  }
  if (!data.createdBy && data.tournament) {
    const t = await Tournament.findById(data.tournament).select("createdBy");
    if (t) data.createdBy = t.createdBy;
  }
  if (!data.createdBy) data.createdBy = req.user._id;

  const player = await Player.create(data);
  const populated = await Player.findById(player._id)
    .populate("team", "name")
    .populate("tournament", "tournamentName");
  res.status(201).json({ success: true, data: populated, message: "Player created successfully." });
});

export const updatePlayer = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "player id");
  const updates = pickFields(req.body, PLAYER_FIELDS.filter((k) => k !== "createdBy"));
  if (req.file) updates.photo = await resolveUpload(req.file, "players/photos");
  if (updates.name) updates.name = String(updates.name).trim();
  if (updates.dateOfBirth) {
    updates.dateOfBirth = new Date(updates.dateOfBirth);
    const computed = ageFromDob(updates.dateOfBirth);
    if (computed != null && updates.age == null) updates.age = computed;
  }
  if (updates.jerseyNumber != null) updates.jerseyNumber = Number(updates.jerseyNumber);
  if (updates.age != null) updates.age = Number(updates.age);
  if (updates.team !== undefined) updates.team = toObjectIdOrNull(updates.team);
  if (updates.tournament !== undefined) updates.tournament = toObjectIdOrNull(updates.tournament);

  if (updates.team) {
    const team = await Team.findById(updates.team).select("tournament");
    if (team && !updates.tournament) updates.tournament = team.tournament;
  }

  const player = await Player.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("team", "name")
    .populate("tournament", "tournamentName");
  if (!player) throw new ApiError(404, "Player not found");
  res.json({ success: true, data: player, message: "Player updated successfully." });
});

export const deletePlayer = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "player id");
  await cascadeDeletePlayer(id);
  res.json({ success: true, message: "Player deleted" });
});

// ─── Matches ─────────────────────────────────────────────────────────────────

export const listMatches = asyncHandler(async (req, res) => {
  await scrubEmptyObjectIdRefs(Match, ["venue", "teamA", "teamB", "tossWinner", "winner"]);

  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.status && req.query.status !== "all") query.status = req.query.status;
  if (req.query.tournament && req.query.tournament !== "all") {
    query.tournament = assertObjectId(req.query.tournament, "tournament id");
  }

  const [total, raw] = await Promise.all([
    Match.countDocuments(query),
    Match.find(query)
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("tournament", "tournamentName")
      .populate("teamA", "name shortName logo")
      .populate("teamB", "name shortName logo")
      .populate("venue", "venueName city")
      .populate("tossWinner", "name")
      .populate("winner", "name")
      .select(
        "tournament teamA teamB venue status scheduledDate matchTime round matchNumber resultSummary resultType resultMargin tossWinner tossDecision liveScore winner"
      )
      .lean(),
  ]);

  const items = raw.map((m) => ({
    ...m,
    scoreLine: formatScoreLine(m),
    venueName: m.venue?.venueName || null,
    tossLabel:
      m.tossWinner?.name && m.tossDecision
        ? `${m.tossWinner.name} chose to ${m.tossDecision}`
        : m.tossWinner?.name || null,
  }));

  res.json({
    success: true,
    data: { items, pagination: paginationMeta(total, page, limit) },
  });
});

export const getMatch = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "match id");
  await scrubEmptyObjectIdRefs(Match, ["venue"]);
  const match = await Match.findById(id)
    .populate("tournament", "tournamentName")
    .populate("teamA", "name shortName logo")
    .populate("teamB", "name shortName logo")
    .populate("venue", "venueName city")
    .populate("tossWinner", "name")
    .populate("winner", "name");
  if (!match) throw new ApiError(404, "Match not found");
  res.json({
    success: true,
    data: {
      ...match.toObject(),
      scoreLine: formatScoreLine(match),
      venueName: match.venue?.venueName || null,
    },
  });
});

export const updateMatch = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "match id");
  const allowed = ["status", "round", "matchTime", "scheduledDate", "overs", "resultSummary"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.venue !== undefined) {
    const venueId = toObjectIdOrNull(req.body.venue);
    if (req.body.venue !== "" && req.body.venue != null && venueId == null) {
      throw new ApiError(400, "Invalid venue id. Select a valid venue or leave it empty.");
    }
    updates.venue = venueId;
  }
  const match = await Match.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("teamA", "name")
    .populate("teamB", "name")
    .populate("venue", "venueName")
    .populate("tournament", "tournamentName");
  if (!match) throw new ApiError(404, "Match not found");

  if (match.tournament && (updates.status || updates.resultSummary !== undefined)) {
    const { recalculateTournamentStandings } = await import("../services/pointsTableService.js");
    const tournamentId = match.tournament._id || match.tournament;
    await recalculateTournamentStandings(tournamentId);
  }

  res.json({ success: true, data: match });
});

export const deleteMatch = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "match id");
  await cascadeDeleteMatch(id);
  res.json({ success: true, message: "Match deleted" });
});

// ─── Venues / Umpires ────────────────────────────────────────────────────────

export const listVenues = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ venueName: re }, { city: re }];
  }
  const [total, items] = await Promise.all([
    Venue.countDocuments(query),
    Venue.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("organizerId", "fullName email"),
  ]);
  res.json({ success: true, data: { items, pagination: paginationMeta(total, page, limit) } });
});

export const deleteVenue = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "venue id");
  const venue = await Venue.findByIdAndDelete(id);
  if (!venue) throw new ApiError(404, "Venue not found");
  await Match.updateMany({ venue: id }, { $unset: { venue: 1 } });
  await Tournament.updateMany({ venue: id }, { $set: { venue: null } });
  res.json({ success: true, message: "Venue deleted" });
});

export const listUmpires = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ fullName: re }, { phoneNumber: re }, { email: re }];
  }
  const [total, items] = await Promise.all([
    Umpire.countDocuments(query),
    Umpire.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("organizerId", "fullName email"),
  ]);
  res.json({ success: true, data: { items, pagination: paginationMeta(total, page, limit) } });
});

export const deleteUmpire = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "umpire id");
  const umpire = await Umpire.findByIdAndDelete(id);
  if (!umpire) throw new ApiError(404, "Umpire not found");
  res.json({ success: true, message: "Umpire deleted" });
});

// ─── Scorers ─────────────────────────────────────────────────────────────────

export const listScorers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.status && req.query.status !== "all") query.status = req.query.status;
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ fullName: re }, { phone: re }, { email: re }, { city: re }];
  }

  const [total, raw] = await Promise.all([
    Scorer.countDocuments(query),
    Scorer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("organizerId", "fullName email")
      .lean(),
  ]);

  const ids = raw.map((s) => s._id);
  const matchCounts = ids.length
    ? await Match.aggregate([
        { $match: { scorer: { $in: ids } } },
        { $group: { _id: "$scorer", count: { $sum: 1 } } },
      ])
    : [];
  const countMap = Object.fromEntries(matchCounts.map((c) => [String(c._id), c.count]));

  const items = raw.map((s) => ({
    ...s,
    assignedMatches: countMap[String(s._id)] || 0,
    organizerName: s.organizerId?.fullName || s.organizerId?.email || null,
  }));

  res.json({
    success: true,
    data: { items, pagination: paginationMeta(total, page, limit) },
  });
});

export const updateAdminScorer = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "scorer id");
  const allowed = ["fullName", "phone", "email", "city", "experience", "notes", "status"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.email != null) updates.email = String(updates.email).trim().toLowerCase();
  if (updates.experience === "") updates.experience = null;
  else if (updates.experience != null) updates.experience = Number(updates.experience);

  const scorer = await Scorer.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("organizerId", "fullName email");
  if (!scorer) throw new ApiError(404, "Scorer not found");

  if (updates.fullName) {
    await Match.updateMany({ scorer: scorer._id }, { $set: { scorerName: scorer.fullName } });
  }

  res.json({ success: true, data: scorer, message: "Scorer updated successfully." });
});

export const deleteAdminScorer = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "scorer id");
  const scorer = await Scorer.findById(id);
  if (!scorer) throw new ApiError(404, "Scorer not found");

  // Unlink ref but keep scorerName on matches for historical scorecards
  await Match.updateMany({ scorer: id }, { $unset: { scorer: 1 } });
  await Scorer.deleteOne({ _id: id });
  res.json({ success: true, message: "Scorer deleted successfully" });
});

// ─── Sponsors ────────────────────────────────────────────────────────────────

export const listSponsors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};
  if (req.query.status && req.query.status !== "all") query.status = req.query.status;
  if (req.query.sponsorType && req.query.sponsorType !== "all") {
    query.sponsorType = req.query.sponsorType;
  }
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [
      { sponsorName: re },
      { companyName: re },
      { contactPerson: re },
      { phone: re },
      { email: re },
    ];
  }

  const [total, raw] = await Promise.all([
    Sponsor.countDocuments(query),
    Sponsor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("organizerId", "fullName email")
      .lean(),
  ]);

  const ids = raw.map((s) => s._id);
  const tournamentCounts = ids.length
    ? await Tournament.aggregate([
        { $match: { sponsors: { $in: ids } } },
        { $unwind: "$sponsors" },
        { $match: { sponsors: { $in: ids } } },
        { $group: { _id: "$sponsors", count: { $sum: 1 } } },
      ])
    : [];
  const countMap = Object.fromEntries(tournamentCounts.map((c) => [String(c._id), c.count]));

  const items = raw.map((s) => ({
    ...s,
    assignedTournaments: countMap[String(s._id)] || 0,
    organizerName: s.organizerId?.fullName || s.organizerId?.email || null,
  }));

  res.json({
    success: true,
    data: { items, pagination: paginationMeta(total, page, limit) },
  });
});

export const updateAdminSponsor = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "sponsor id");
  const allowed = [
    "sponsorName",
    "companyName",
    "sponsorType",
    "contactPerson",
    "phone",
    "email",
    "website",
    "address",
    "sponsorshipAmount",
    "notes",
    "status",
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.email != null) updates.email = String(updates.email).trim().toLowerCase();
  if (updates.website != null) {
    const v = String(updates.website).trim();
    updates.website = v && !/^https?:\/\//i.test(v) ? `https://${v}` : v;
  }
  if (updates.sponsorshipAmount === "") updates.sponsorshipAmount = null;
  else if (updates.sponsorshipAmount != null) {
    updates.sponsorshipAmount = Number(updates.sponsorshipAmount);
  }

  const sponsor = await Sponsor.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("organizerId", "fullName email");
  if (!sponsor) throw new ApiError(404, "Sponsor not found");

  res.json({ success: true, data: sponsor, message: "Sponsor updated successfully." });
});

export const deleteAdminSponsor = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, "sponsor id");
  const sponsor = await Sponsor.findById(id);
  if (!sponsor) throw new ApiError(404, "Sponsor not found");

  await Tournament.updateMany({ sponsors: id }, { $pull: { sponsors: id } });
  await Sponsor.deleteOne({ _id: id });
  res.json({ success: true, message: "Sponsor deleted successfully" });
});

// ─── Payments ────────────────────────────────────────────────────────────────

export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const query = {};

  const statusMap = {
    paid: "succeeded",
    succeeded: "succeeded",
    failed: "failed",
    pending: "pending",
    refunded: "refunded",
  };
  if (req.query.status && req.query.status !== "all" && statusMap[req.query.status]) {
    query.paymentStatus = statusMap[req.query.status];
  }

  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    const matchingUsers = await User.find({
      $or: [{ fullName: re }, { email: re }],
    }).select("_id");
    query.$or = [
      { customerEmail: re },
      { stripeTransactionId: re },
      { stripePaymentIntentId: re },
      { stripeCheckoutSessionId: re },
      { user: { $in: matchingUsers.map((u) => u._id) } },
    ];
  }

  const [total, items] = await Promise.all([
    Payment.countDocuments(query),
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email subscriptionStatus subscriptionPlan"),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((p) => ({
        _id: p._id,
        userName: p.user?.fullName || "—",
        email: p.customerEmail || p.user?.email || "—",
        stripeCustomerId: p.stripeCustomerId || "—",
        stripePaymentIntentId: p.stripePaymentIntentId || "—",
        amount: p.amount,
        currency: p.currency,
        plan: p.plan,
        paymentStatus: p.paymentStatus,
        paymentDate: p.paymentDate || p.createdAt,
        subscriptionStatus: p.user?.subscriptionStatus || "—",
        transactionId: p.stripeTransactionId || p.stripeCheckoutSessionId || "—",
      })),
      pagination: paginationMeta(total, page, limit),
    },
  });
});

// ─── Reports ─────────────────────────────────────────────────────────────────

export const getAdminReports = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenue,
    totalProUsers,
    newUsers,
    activeUsers,
    totalMatches,
    totalTournaments,
    usersThisMonth,
    usersPrevMonth,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: { paymentStatus: "succeeded" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    User.countDocuments({
      subscriptionPlan: { $in: ["pro", "enterprise"] },
      subscriptionStatus: "active",
    }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    User.countDocuments({ isActive: true }),
    Match.countDocuments(),
    Tournament.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    User.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: monthStart } }),
  ]);

  const growth =
    usersPrevMonth === 0
      ? usersThisMonth > 0
        ? 100
        : 0
      : Math.round(((usersThisMonth - usersPrevMonth) / usersPrevMonth) * 1000) / 10;

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProUsers,
        newUsers,
        activeUsers,
        totalMatches,
        totalTournaments,
        monthlyGrowthPercent: growth,
      },
      // Flat fields kept for compatibility
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProUsers,
      newUsers,
      activeUsers,
      totalMatches,
      totalTournaments,
      monthlyGrowth: growth,
      monthlyGrowthPercent: growth,
      usersThisMonth,
      usersPrevMonth,
    },
  });
});
