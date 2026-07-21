import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Match from "../models/Match.js";
import Player from "../models/Player.js";
import Umpire from "../models/Umpire.js";
import Scorer from "../models/Scorer.js";
import { prepareStartMatchUmpires } from "../utils/matchUmpires.js";
import { toObjectIdOrNull } from "../utils/objectId.js";
import {
  setUmpiresBusy,
  setUmpiresAvailable,
  extractMatchUmpireIds,
} from "../utils/umpireMatchStatus.js";
import Venue from "../models/Venue.js";
import Sponsor from "../models/Sponsor.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";
import {
  finalizeTournamentIfComplete,
  syncTournamentStatus,
  syncTournamentStatusesForUser,
  invalidateUserTournamentSyncCache,
} from "../utils/tournamentStatus.js";
import {
  recalculateTournamentStandings,
  getTournamentStandings as fetchTournamentStandings,
  loadTournamentTeams,
} from "../services/pointsTableService.js";
import {
  isHybridType,
  isKnockoutType,
  resolveTournamentType,
} from "../constants/tournamentTypes.js";
import { TOSS_DECISIONS } from "../utils/toss.js";
import {
  notifyTournamentCreated,
  notifyTournamentPublished,
  notifyFixturesGenerated,
  notifyMatchStarted,
  notifyMatchCompleted,
  notifyTeamsJoined,
} from "../utils/notificationEvents.js";
import {
  enforceCapacityBeforeCreate,
  formatTournamentForClient,
  assertTournamentNotStorageArchived,
  deleteTournamentHeavyData,
} from "../services/tournamentCleanupService.js";

const parseFiles = async (req) => {
  const files = {};
  if (req.files?.tournamentLogo?.[0]) {
    files.tournamentLogo = await resolveUpload(req.files.tournamentLogo[0], "tournaments/logos");
  }
  if (req.files?.bannerImage?.[0]) {
    files.bannerImage = await resolveUpload(req.files.bannerImage[0], "tournaments/banners");
  }
  return files;
};

const parseFormBody = (body) => {
  const data = { ...body };
  const numbers = ["numberOfTeams", "overs", "entryFee", "prizePool"];
  numbers.forEach((key) => {
    if (data[key] !== undefined && data[key] !== "") data[key] = Number(data[key]);
  });
  const booleans = ["isPublic", "isPublished", "isArchived"];
  booleans.forEach((key) => {
    if (data[key] !== undefined) data[key] = data[key] === "true" || data[key] === true;
  });
  ["startDate", "endDate", "registrationDeadline"].forEach((key) => {
    if (data[key] === "") delete data[key];
  });
  if (data.venue === "") data.venue = null;

  if (data.sponsors !== undefined) {
    let ids = data.sponsors;
    if (typeof ids === "string") {
      const trimmed = ids.trim();
      if (!trimmed) {
        ids = [];
      } else if (trimmed.startsWith("[")) {
        try {
          ids = JSON.parse(trimmed);
        } catch {
          ids = [trimmed];
        }
      } else {
        ids = [trimmed];
      }
    }
    if (!Array.isArray(ids)) ids = ids ? [ids] : [];
    data.sponsors = ids
      .map((id) => toObjectIdOrNull(id))
      .filter(Boolean);
  }

  // Ignore legacy manual venue text fields — venue is selected from the library
  delete data.groundName;
  delete data.groundAddress;
  delete data.city;
  return data;
};

const VENUE_SELECT = "venueName groundAddress city state country pitchType capacity";
const SPONSOR_SELECT =
  "sponsorName companyName sponsorType logo website status contactPerson";
const populateVenue = (query) => query.populate("venue", VENUE_SELECT);
const populateSponsors = (query) => query.populate("sponsors", SPONSOR_SELECT);

async function resolveVenueForOrganizer(venueId, userId) {
  if (venueId == null || venueId === "") return null;
  if (!mongoose.Types.ObjectId.isValid(venueId)) {
    throw new ApiError(400, "Invalid venue id");
  }
  const venue = await Venue.findOne({ _id: venueId, organizerId: userId });
  if (!venue) throw new ApiError(400, "Venue not found or access denied");
  return venue._id;
}

async function resolveSponsorsForOrganizer(sponsorIds, userId) {
  if (!Array.isArray(sponsorIds)) return [];
  if (sponsorIds.length === 0) return [];
  const unique = [...new Set(sponsorIds.map((id) => String(id)))];
  const found = await Sponsor.find({
    _id: { $in: unique },
    organizerId: userId,
  }).select("_id");
  if (found.length !== unique.length) {
    throw new ApiError(400, "One or more sponsors are invalid or inaccessible");
  }
  return found.map((s) => s._id);
}

async function buildPublicTournamentSearchOr(search) {
  const venueIds = await Venue.find({
    $or: [
      { venueName: { $regex: search, $options: "i" } },
      { groundAddress: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ],
  }).distinct("_id");

  return [
    { tournamentName: { $regex: search, $options: "i" } },
    { city: { $regex: search, $options: "i" } },
    { groundName: { $regex: search, $options: "i" } },
    { venue: { $in: venueIds } },
  ];
}
async function buildTournamentSearchOr(search, userId) {
  const venueIds = await Venue.find({
    organizerId: userId,
    $or: [
      { venueName: { $regex: search, $options: "i" } },
      { groundAddress: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ],
  }).distinct("_id");

  return [
    { tournamentName: { $regex: search, $options: "i" } },
    { city: { $regex: search, $options: "i" } },
    { groundName: { $regex: search, $options: "i" } },
    { venue: { $in: venueIds } },
  ];
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export const createTournament = asyncHandler(async (req, res) => {
  const capacity = await enforceCapacityBeforeCreate(req.user._id);
  const fileData = await parseFiles(req);
  const body = parseFormBody(req.body);
  if (body.venue !== undefined) {
    body.venue = await resolveVenueForOrganizer(body.venue, req.user._id);
  }
  if (body.sponsors !== undefined) {
    body.sponsors = await resolveSponsorsForOrganizer(body.sponsors, req.user._id);
  }
  try {
    const tournament = await Tournament.create({
      ...body,
      ...fileData,
      createdBy: req.user._id,
    });
    const populated = await populateSponsors(
      populateVenue(Tournament.findById(tournament._id))
    ).populate("teams", "name logo city");

    invalidateUserTournamentSyncCache(req.user._id);

    if (process.env.NODE_ENV !== "production") {
      console.info("[tournaments:create]", { userId: String(req.user._id), id: String(tournament._id), name: tournament.tournamentName });
    }

    notifyTournamentCreated(req.user._id, tournament).catch((err) =>
      console.error("[notification]", err.message)
    );
    const response = { success: true, data: formatTournamentForClient(await populated) };
    if (capacity.cleaned?.length) {
      response.meta = {
        cleanedTournaments: capacity.cleaned.length,
        message:
          capacity.cleaned.length === 1
            ? "1 completed tournament was archived to free storage."
            : `${capacity.cleaned.length} completed tournaments were archived to free storage.`,
      };
    }
    res.status(201).json(response);
  } catch (error) {
    console.error("Tournament create failed", {
      message: error.message,
      errors: error.errors || [],
      body: req.body,
      files: req.files ? Object.keys(req.files) : [],
    });
    throw error;
  }
});

export const getTournaments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = "",
    status,
    tournamentType,
    showDeleted = "false",
    showArchived,
  } = req.query;

  const query = { createdBy: req.user._id };

  if (showDeleted === "true") {
    query.isDeleted = true;
  } else {
    query.isDeleted = false;
    if (showArchived !== "true") query.isArchived = false;
  }

  if (search) {
    query.$or = await buildTournamentSearchOr(search, req.user._id);
  }

  if (status) query.status = status;
  if (tournamentType) query.tournamentType = tournamentType;

  await syncTournamentStatusesForUser(req.user._id);

  const skip = (Number(page) - 1) * Number(limit);
  const [tournaments, total] = await Promise.all([
    Tournament.find(query)
      .select(
        "_id tournamentName tournamentLogo bannerImage tournamentType ballType status startDate endDate numberOfTeams teams overs isPublished isArchived isStorageArchived archiveSummary winner runnerUp totalMatches completedAt createdAt venue"
      )
      .populate("teams", "name logo city")
      .populate("winner runnerUp", "name logo city")
      .populate("venue", VENUE_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: false }),
    Tournament.countDocuments(query),
  ]);

  const data = tournaments.map(formatTournamentForClient);

  if (process.env.NODE_ENV !== "production") {
    console.info("[tournaments:list]", {
      userId: String(req.user._id),
      filters: { search: search || null, status: status || null, tournamentType: tournamentType || null, showDeleted, showArchived: showArchived || null },
      matched: total,
      returned: data.length,
      page: Number(page),
    });
  }

  res.json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

// Public Viewer listing
// returns all public non-completed tournaments across organizers (no auth required).
export const getViewerTournaments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    search = "",
    status,
    tournamentType,
  } = req.query;

  const query = {
    isPublic: true,
    isDeleted: false,
    isArchived: false,
    isStorageArchived: { $ne: true },
    status: { $ne: "Completed" },
    // Exclude auto-generated test/sample tournaments (not organizer-created ones)
    $nor: [
      { tournamentName: { $regex: /^Repro Cup \d{10,}$/ } },
      { tournamentName: { $regex: /^Completion Cup \d{10,}$/ } },
      { tournamentName: "Test Tournament API" },
    ],
  };

  if (search) {
    query.$or = await buildPublicTournamentSearchOr(search);
  }

  if (status === "Upcoming") {
    query.status = "Upcoming";
  } else if (status === "Live") {
    const liveTournamentIds = await Match.distinct("tournament", { status: "Live" });
    query.$or = [{ status: "Live" }, { _id: { $in: liveTournamentIds } }];
    delete query.status;
  }
  if (tournamentType) query.tournamentType = tournamentType;

  const skip = (Number(page) - 1) * Number(limit);
  const [tournaments, total] = await Promise.all([
    Tournament.find(query)
      .populate("teams", "name logo city")
      .populate("winner runnerUp", "name logo city")
      .populate("venue", VENUE_SELECT)
      .populate("sponsors", SPONSOR_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Tournament.countDocuments(query),
  ]);

  const tournamentIds = tournaments.map((t) => t._id);
  const liveCounts = tournamentIds.length
    ? await Match.aggregate([
        { $match: { tournament: { $in: tournamentIds }, status: "Live" } },
        { $group: { _id: "$tournament", count: { $sum: 1 } } },
      ])
    : [];
  const liveMap = Object.fromEntries(liveCounts.map((c) => [String(c._id), c.count]));

  const data = tournaments.map((t) => {
    const liveMatchCount = liveMap[String(t._id)] || 0;
    return {
      ...t.toObject(),
      liveMatchCount,
      hasLiveMatch: liveMatchCount > 0,
    };
  });

  res.json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  })
    .populate("teams", "name logo city captain")
    .populate("winner runnerUp", "name logo city")
    .populate("venue", VENUE_SELECT)
    .populate("sponsors", SPONSOR_SELECT);

  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (tournament.isStorageArchived) {
    res.json({ success: true, data: formatTournamentForClient(tournament) });
    return;
  }

  await syncTournamentStatus(tournament._id);

  const updated = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  })
    .populate("teams", "name logo city captain")
    .populate("winner runnerUp", "name logo city")
    .populate("venue", VENUE_SELECT)
    .populate("sponsors", SPONSOR_SELECT);

  res.json({ success: true, data: formatTournamentForClient(updated) });
});

export const updateTournament = asyncHandler(async (req, res) => {
  const fileData = await parseFiles(req);

  // Completed tournaments are locked — no metadata edits allowed.
  const existing = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  }).select("status isStorageArchived");
  if (!existing) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(existing);
  if (existing.status === "Completed") {
    throw new ApiError(400, "This tournament is completed and locked. It can no longer be edited.");
  }

  try {
    const body = parseFormBody(req.body);
    if (body.venue !== undefined) {
      body.venue = await resolveVenueForOrganizer(body.venue, req.user._id);
    }
    if (body.sponsors !== undefined) {
      body.sponsors = await resolveSponsorsForOrganizer(body.sponsors, req.user._id);
    }

    const tournament = await Tournament.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id, isDeleted: false },
      { ...body, ...fileData },
      { new: true, runValidators: true }
    )
      .populate("teams", "name logo city")
      .populate("venue", VENUE_SELECT)
      .populate("sponsors", SPONSOR_SELECT);

    if (!tournament) throw new ApiError(404, "Tournament not found");
    invalidateUserTournamentSyncCache(req.user._id);
    res.json({ success: true, data: formatTournamentForClient(tournament) });
  } catch (error) {
    console.error("Tournament update failed", {
      message: error.message,
      errors: error.errors || [],
      params: req.params,
      body: req.body,
      files: req.files ? Object.keys(req.files) : [],
    });
    throw error;
  }
});

export const softDeleteTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!tournament) throw new ApiError(404, "Tournament not found");
  res.json({ success: true, message: "Tournament moved to trash", data: tournament });
});

export const restoreTournament = asyncHandler(async (req, res) => {
  await enforceCapacityBeforeCreate(req.user._id);

  const tournament = await Tournament.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { new: true }
  );
  if (!tournament) throw new ApiError(404, "Deleted tournament not found");
  res.json({ success: true, message: "Tournament restored", data: tournament });
});

export const permanentDeleteTournament = asyncHandler(async (req, res) => {
  const tournamentId = req.params.id;

  // Works whether the tournament is in the trash or deleted directly from the
  // card — as long as it belongs to the requesting user.
  const tournament = await Tournament.findOne({
    _id: tournamentId,
    createdBy: req.user._id,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (!tournament.isStorageArchived) {
    await deleteTournamentHeavyData(tournamentId, req.user._id);
  }
  await Tournament.deleteOne({ _id: tournamentId });

  res.json({ success: true, message: "Tournament and all related data permanently deleted" });
});

// ─── EXTRA ACTIONS ──────────────────────────────────────────────────────────

export const duplicateTournament = asyncHandler(async (req, res) => {
  await enforceCapacityBeforeCreate(req.user._id);

  const source = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!source) throw new ApiError(404, "Tournament not found");

  const copy = source.toObject();
  delete copy._id;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.archiveSummary;

  if (source.isStorageArchived && source.archiveSummary) {
    const summary = source.archiveSummary;
    copy.tournamentName = `${summary.tournamentName || copy.tournamentName} (Copy)`;
    copy.tournamentLogo = summary.tournamentLogo || copy.tournamentLogo;
    copy.bannerImage = summary.bannerImage || copy.bannerImage;
    copy.startDate = summary.startDate || copy.startDate;
    copy.endDate = summary.endDate || copy.endDate;
  } else {
    copy.tournamentName = `${copy.tournamentName} (Copy)`;
  }

  copy.status = "Draft";
  copy.isPublished = false;
  copy.isArchived = false;
  copy.isStorageArchived = false;
  copy.storageArchivedAt = null;
  copy.isDeleted = false;
  copy.deletedAt = null;
  copy.teams = [];
  copy.winner = null;
  copy.runnerUp = null;
  copy.totalMatches = 0;
  copy.completedAt = null;
  copy.createdBy = req.user._id;

  const newTournament = await Tournament.create(copy);
  res.status(201).json({ success: true, data: formatTournamentForClient(newTournament) });
});

export const archiveTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");

  tournament.isArchived = !tournament.isArchived;
  await tournament.save();

  res.json({
    success: true,
    message: tournament.isArchived ? "Tournament archived" : "Tournament unarchived",
    data: tournament,
  });
});

export const publishTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(tournament);

  tournament.isPublished = !tournament.isPublished;
  await tournament.save();

  if (tournament.isPublished) {
    notifyTournamentPublished(req.user._id, tournament).catch((err) =>
      console.error("[notification]", err.message)
    );
  }

  res.json({
    success: true,
    message: tournament.isPublished ? "Tournament published" : "Tournament unpublished",
    data: tournament,
  });
});

// ─── MANAGE TEAMS ───────────────────────────────────────────────────────────

export const getTournamentTeams = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (tournament.isStorageArchived) {
    const summary = tournament.archiveSummary || {};
    res.json({
      success: true,
      data: [],
      archived: true,
      message: "This tournament has been archived to optimize storage.",
      meta: { totalTeams: summary.totalTeams || 0 },
    });
    return;
  }

  const teams = await loadTournamentTeams(tournament._id, { Team, Match })
    .then((docs) =>
      docs.map((t) => {
        const plain = t.toObject ? t.toObject() : t;
        return { ...plain, stats: plain.stats || {} };
      })
    );

  res.json({ success: true, data: teams });
});

export const getTournamentStandings = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  }).select("_id tournamentName isStorageArchived archiveSummary");

  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (tournament.isStorageArchived) {
    const summary = tournament.archiveSummary || {};
    res.json({
      success: true,
      data: {
        rows: [],
        count: 0,
        archived: true,
        message: "This tournament has been archived to optimize storage.",
        meta: { totalTeams: summary.totalTeams || 0 },
      },
    });
    return;
  }

  const forceRecalc = req.query.refresh === "1" || req.query.recalculate === "true";
  const standings = await fetchTournamentStandings(tournament._id, { recalculate: forceRecalc });

  res.json({ success: true, data: standings });
});

export const addTeamsToTournament = asyncHandler(async (req, res) => {
  const { teamIds } = req.body;
  if (!teamIds || !Array.isArray(teamIds)) {
    throw new ApiError(400, "teamIds must be an array");
  }

  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(tournament);
  if (tournament.status === "Completed") {
    throw new ApiError(400, "This tournament is completed and locked. Teams can no longer be changed.");
  }

  // Verify all teams belong to this user
  const validTeams = await Team.find({ _id: { $in: teamIds }, createdBy: req.user._id });
  if (validTeams.length !== teamIds.length) {
    throw new ApiError(400, "One or more teams not found");
  }

  const previousTeamIds = (tournament.teams || []).map((id) => String(id));

  tournament.teams = teamIds;
  await tournament.save();

  await Team.updateMany(
    { _id: { $in: teamIds } },
    { $set: { tournament: tournament._id } }
  );

  await recalculateTournamentStandings(tournament._id, { Team, Match });
  await tournament.populate("teams", "name logo city captain stats");

  notifyTeamsJoined(req.user._id, tournament, teamIds, previousTeamIds).catch((err) =>
    console.error("[notification]", err.message)
  );

  res.json({ success: true, data: tournament.teams, message: "Teams updated" });
});

export const removeTeamFromTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(tournament);
  if (tournament.status === "Completed") {
    throw new ApiError(400, "This tournament is completed and locked. Teams can no longer be changed.");
  }

  tournament.teams = tournament.teams.filter(
    (t) => t.toString() !== req.params.teamId
  );
  await tournament.save();

  await recalculateTournamentStandings(tournament._id, { Team, Match });

  res.json({ success: true, message: "Team removed from tournament" });
});

// ─── FIXTURE GENERATION ─────────────────────────────────────────────────────
//
// Supports: Knockout (Single Elimination), Round Robin / League,
// Double Round Robin, Group Stage, and Hybrid (Group Stage + Knockout).
//
// Knockout & Hybrid knockout rounds are built with "slots" that may not be
// resolvable at generation time (e.g. "Winner Group A"). Those matches are
// stored with teamA/teamB = null and a descriptive teamASlot/teamBSlot; the
// resolveFixtures() cascade fills them in automatically once the source
// group/match is completed, all the way through to the Final.

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getDateKey = (date) => {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized.toISOString().split("T")[0];
};

const parseTimeToMinutes = (timeStr) => {
  const parsed = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(String(timeStr).trim());
  if (!parsed) return 10 * 60; // fallback: 10:00 AM
  let [, h, m, meridiem] = parsed;
  h = Number(h);
  m = Number(m);
  meridiem = meridiem?.toUpperCase();
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const formatMinutesToTime = (totalMinutes) => {
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const meridiem = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${meridiem}`;
};

const getRoundName = (teamCount) => {
  if (teamCount <= 2) return "Final";
  if (teamCount <= 4) return "Semi Final";
  if (teamCount <= 8) return "Quarter Final";
  if (teamCount <= 16) return "Round of 16";
  return "Round of 32";
};

const rankLabel = (rank) => (rank === 1 ? "Winner" : rank === 2 ? "Runner-up" : `Rank ${rank}`);

const ordinal = (n) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
};

const placeLabel = (rank) => `${ordinal(rank)} Place`;

const determineGroupCount = (teamCount) => {
  if (teamCount >= 8) return 4;
  if (teamCount >= 4) return 2;
  return 1;
};

const assignGroups = (teams, numGroups) => {
  const groups = Array.from({ length: numGroups }, () => []);
  teams.forEach((team, i) => groups[i % numGroups].push(team));
  return groups;
};

// ── Fixture builders (produce plain fixture objects, no scheduling yet) ────

// Round-robin rounds via the circle method. Each returned round contains
// matches in which every team appears at most once, which lets the scheduler
// spread a team's games out and give it proper rest between matches.
const buildCircleRounds = (teams) => {
  const list = [...teams];
  if (list.length % 2 === 1) list.push(null); // odd → phantom "bye" team
  const n = list.length;
  const half = n / 2;
  const rounds = [];

  let arr = [...list];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < half; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home && away) round.push([home, away]);
    }
    rounds.push(round);
    // Rotate all but the first element clockwise.
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }

  return rounds;
};

const generateRoundRobinFixtures = (teams, matchNumRef, doubleRound = false) => {
  const fixtures = [];
  const rounds = buildCircleRounds(teams);

  // First leg
  rounds.forEach((round) => {
    round.forEach(([home, away]) => {
      fixtures.push({
        matchNumber: matchNumRef.value++,
        round: "League",
        leg: 1,
        stage: 0,
        teamA: home._id,
        teamB: away._id,
        teamASlot: { type: "fixed" },
        teamBSlot: { type: "fixed" },
      });
    });
  });

  // Second leg (reverse home/away) — scheduled as its own stage so the whole
  // return leg happens after the first leg.
  if (doubleRound) {
    rounds.forEach((round) => {
      round.forEach(([home, away]) => {
        fixtures.push({
          matchNumber: matchNumRef.value++,
          round: "League",
          leg: 2,
          stage: 1,
          teamA: away._id,
          teamB: home._id,
          teamASlot: { type: "fixed" },
          teamBSlot: { type: "fixed" },
        });
      });
    });
  }

  return fixtures;
};

// Playoffs appended after a league/round-robin stage: two semi-finals seeded
// from the final league table (1st vs 4th, 2nd vs 3rd) and a final between the
// two semi-final winners. All start as placeholders and are auto-filled by the
// resolveFixtures() cascade once the league table is final.
const generateLeaguePlayoffs = (matchNumRef, baseStage) => {
  const sf1 = {
    matchNumber: matchNumRef.value++,
    round: "Semi Final",
    stage: baseStage,
    teamA: null,
    teamB: null,
    teamASlot: { type: "groupRank", group: "League", rank: 1, label: placeLabel(1) },
    teamBSlot: { type: "groupRank", group: "League", rank: 4, label: placeLabel(4) },
  };
  const sf2 = {
    matchNumber: matchNumRef.value++,
    round: "Semi Final",
    stage: baseStage,
    teamA: null,
    teamB: null,
    teamASlot: { type: "groupRank", group: "League", rank: 2, label: placeLabel(2) },
    teamBSlot: { type: "groupRank", group: "League", rank: 3, label: placeLabel(3) },
  };
  const final = {
    matchNumber: matchNumRef.value++,
    round: "Final",
    stage: baseStage + 1,
    teamA: null,
    teamB: null,
    teamASlot: { type: "matchWinner", sourceMatch: sf1.matchNumber, label: "Winner Semi Final 1" },
    teamBSlot: { type: "matchWinner", sourceMatch: sf2.matchNumber, label: "Winner Semi Final 2" },
  };
  return [sf1, sf2, final];
};

const generateGroupStageFixtures = (teams, numGroups, matchNumRef, stage = 0) => {
  const groups = assignGroups(teams, numGroups);
  const fixtures = [];
  const groupMeta = [];

  groups.forEach((groupTeams, gi) => {
    const label = `Group ${String.fromCharCode(65 + gi)}`;
    groupMeta.push({ label, teamIds: groupTeams.map((t) => t._id) });

    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        fixtures.push({
          matchNumber: matchNumRef.value++,
          round: label,
          stage,
          teamA: groupTeams[i]._id,
          teamB: groupTeams[j]._id,
          teamASlot: { type: "fixed" },
          teamBSlot: { type: "fixed" },
        });
      }
    }
  });

  return { fixtures, groupMeta };
};

// Single-elimination bracket with automatic bye handling for non-power-of-two
// team counts. Every round beyond the first is a placeholder ("Winner M#")
// that gets resolved automatically as earlier matches complete.
const generateKnockoutFixtures = (teams, matchNumRef, baseStage = 0) => {
  const fixtures = [];
  const n = teams.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const byes = bracketSize - n;
  const byeTeams = teams.slice(0, byes);
  const playingTeams = teams.slice(byes);

  let currentSlots = [];
  let stage = baseStage;

  if (playingTeams.length > 0) {
    const roundName = getRoundName(bracketSize);
    for (let i = 0; i < playingTeams.length; i += 2) {
      const match = {
        matchNumber: matchNumRef.value++,
        round: roundName,
        stage,
        teamA: playingTeams[i]._id,
        teamB: playingTeams[i + 1]._id,
        teamASlot: { type: "fixed" },
        teamBSlot: { type: "fixed" },
      };
      fixtures.push(match);
      currentSlots.push({ type: "matchWinner", sourceMatch: match.matchNumber, label: `Winner ${roundName}` });
    }
    stage += 1;
  }

  byeTeams.forEach((t) => currentSlots.push({ type: "fixed", team: t._id }));

  while (currentSlots.length > 1) {
    const roundName = getRoundName(currentSlots.length);
    const nextSlots = [];

    for (let i = 0; i < currentSlots.length; i += 2) {
      const a = currentSlots[i];
      const b = currentSlots[i + 1];
      const match = {
        matchNumber: matchNumRef.value++,
        round: roundName,
        stage,
        teamA: a.type === "fixed" ? a.team : null,
        teamB: b.type === "fixed" ? b.team : null,
        teamASlot: a.type === "fixed" ? { type: "fixed" } : { type: "matchWinner", sourceMatch: a.sourceMatch, label: a.label },
        teamBSlot: b.type === "fixed" ? { type: "fixed" } : { type: "matchWinner", sourceMatch: b.sourceMatch, label: b.label },
      };
      fixtures.push(match);
      nextSlots.push({ type: "matchWinner", sourceMatch: match.matchNumber, label: `Winner ${roundName}` });
    }

    currentSlots = nextSlots;
    stage += 1;
  }

  return fixtures;
};

// Group Stage first, then a Quarter/Semi Final → Final bracket seeded with
// cross-group placeholders (e.g. "Winner Group A vs Runner-up Group B").
const generateHybridFixtures = (teams, matchNumRef) => {
  const n = teams.length;
  if (n < 4) throw new ApiError(400, "Hybrid (Group Stage + Knockout) format requires at least 4 teams");

  const numGroups = n >= 8 ? 4 : 2;
  const { fixtures: groupFixtures, groupMeta } = generateGroupStageFixtures(teams, numGroups, matchNumRef, 0);
  const fixtures = [...groupFixtures];
  const labels = groupMeta.map((g) => g.label);

  const firstRoundPairs =
    numGroups === 4
      ? [
          [{ group: labels[0], rank: 1 }, { group: labels[1], rank: 2 }],
          [{ group: labels[2], rank: 1 }, { group: labels[3], rank: 2 }],
          [{ group: labels[1], rank: 1 }, { group: labels[0], rank: 2 }],
          [{ group: labels[3], rank: 1 }, { group: labels[2], rank: 2 }],
        ]
      : [
          [{ group: labels[0], rank: 1 }, { group: labels[1], rank: 2 }],
          [{ group: labels[1], rank: 1 }, { group: labels[0], rank: 2 }],
        ];

  const knockoutBaseStage = 1;
  const firstRoundName = getRoundName(firstRoundPairs.length * 2);

  let roundSlots = firstRoundPairs.map(([a, b]) => {
    const match = {
      matchNumber: matchNumRef.value++,
      round: firstRoundName,
      stage: knockoutBaseStage,
      teamA: null,
      teamB: null,
      teamASlot: { type: "groupRank", group: a.group, rank: a.rank, label: `${rankLabel(a.rank)} ${a.group}` },
      teamBSlot: { type: "groupRank", group: b.group, rank: b.rank, label: `${rankLabel(b.rank)} ${b.group}` },
    };
    fixtures.push(match);
    return { type: "matchWinner", sourceMatch: match.matchNumber, label: `Winner ${firstRoundName}` };
  });

  let stage = knockoutBaseStage + 1;
  while (roundSlots.length > 1) {
    const roundName = getRoundName(roundSlots.length);
    const nextSlots = [];

    for (let i = 0; i < roundSlots.length; i += 2) {
      const a = roundSlots[i];
      const b = roundSlots[i + 1];
      const match = {
        matchNumber: matchNumRef.value++,
        round: roundName,
        stage,
        teamA: null,
        teamB: null,
        teamASlot: { type: "matchWinner", sourceMatch: a.sourceMatch, label: a.label },
        teamBSlot: { type: "matchWinner", sourceMatch: b.sourceMatch, label: b.label },
      };
      fixtures.push(match);
      nextSlots.push({ type: "matchWinner", sourceMatch: match.matchNumber, label: `Winner ${roundName}` });
    }

    roundSlots = nextSlots;
    stage += 1;
  }

  return fixtures;
};

// ── Scheduling ──────────────────────────────────────────────────────────────
//
// Processes fixtures stage-by-stage (group stage before knockout, round N
// before round N+1, etc.) so later rounds are never dated before the matches
// that feed into them. Within a stage: never double-book a team on the same
// day, and never exceed the configured matches-per-day cap — once the cap is
// hit, scheduling rolls over to the next available date automatically.

const scheduleFixtures = (fixtures, { startDate, matchesPerDay, matchStartTime, matchDurationMinutes }) => {
  const startMinutes = parseTimeToMinutes(matchStartTime);
  const perDay = Math.max(1, Number(matchesPerDay) || 1);
  const scheduled = [];

  // Process stages in order (e.g. league before playoffs, knockout round N
  // before N+1) so dependent rounds are always dated after their sources.
  const stages = [...new Set(fixtures.map((f) => f.stage ?? 0))].sort((a, b) => a - b);
  let cursorDate = new Date(startDate);

  stages.forEach((stageNum) => {
    const remaining = fixtures.filter((f) => (f.stage ?? 0) === stageNum);

    // Greedily fill one day at a time: add matches until the day is at the
    // matches-per-day cap or no remaining match can be added without putting a
    // team on the pitch twice that day, then advance to the next date.
    while (remaining.length > 0) {
      const dayTeams = new Set();
      let dayCount = 0;

      for (let i = 0; i < remaining.length && dayCount < perDay; ) {
        const fixture = remaining[i];
        const teamIds = [fixture.teamA, fixture.teamB].filter(Boolean).map(String);
        const teamConflict = teamIds.some((id) => dayTeams.has(id));

        if (teamConflict) {
          i += 1;
          continue;
        }

        teamIds.forEach((id) => dayTeams.add(id));
        scheduled.push({
          ...fixture,
          scheduledDate: new Date(cursorDate),
          matchTime: formatMinutesToTime(startMinutes + dayCount * matchDurationMinutes),
          matchDurationMinutes,
        });
        dayCount += 1;
        remaining.splice(i, 1); // remove placed fixture; next one shifts into i
      }

      cursorDate = addDays(cursorDate, 1);
    }
  });

  return scheduled.sort((a, b) => a.matchNumber - b.matchNumber);
};

const validateFixtures = (fixtures, matchesPerDay) => {
  const teamDates = new Map();
  const seenPairs = new Set();
  const dateCounts = new Map();
  const cap = Math.max(1, Number(matchesPerDay) || 1);

  for (const fixture of fixtures) {
    const teamA = fixture.teamA?.toString();
    const teamB = fixture.teamB?.toString();

    // No self-matches
    if (teamA && teamB && teamA === teamB) return false;

    // No duplicate fixtures (per leg, so home & away of a double round robin are allowed)
    if (teamA && teamB) {
      const pairKey = `${[teamA, teamB].sort().join("::")}::leg${fixture.leg || 1}`;
      if (seenPairs.has(pairKey)) return false;
      seenPairs.add(pairKey);
    }

    const dateKey = getDateKey(fixture.scheduledDate);

    // Matches-per-day cap must be respected
    const dayCount = (dateCounts.get(dateKey) || 0) + 1;
    if (dayCount > cap) return false;
    dateCounts.set(dateKey, dayCount);

    // A team must never appear twice on the same date
    if (teamA) {
      const dates = teamDates.get(teamA) || new Set();
      if (dates.has(dateKey)) return false;
      dates.add(dateKey);
      teamDates.set(teamA, dates);
    }

    if (teamB) {
      const dates = teamDates.get(teamB) || new Set();
      if (dates.has(dateKey)) return false;
      dates.add(dateKey);
      teamDates.set(teamB, dates);
    }
  }

  return true;
};

// ── Auto-advancement cascade ────────────────────────────────────────────────
//
// Fills in teamA/teamB for matches whose slot depends on a group's final
// standings (groupRank) or another match's winner (matchWinner). Called
// right after a result is recorded so winners flow through the bracket
// automatically, round after round, until the Final is fully resolved.

const computeGroupStandings = (groupMatches, nrrMap = {}) => {
  const table = new Map();
  const ensure = (id) => {
    const key = id.toString();
    if (!table.has(key)) table.set(key, { teamId: id, points: 0, wins: 0, played: 0 });
    return table.get(key);
  };

  groupMatches.forEach((m) => {
    if (m.teamA) ensure(m.teamA);
    if (m.teamB) ensure(m.teamB);
  });

  groupMatches.forEach((m) => {
    if (m.teamA) ensure(m.teamA).played += 1;
    if (m.teamB) ensure(m.teamB).played += 1;
    if (m.status === "Completed" && m.winner) {
      const entry = ensure(m.winner);
      entry.points += 2;
      entry.wins += 1;
    }
  });

  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      (nrrMap[String(b.teamId)] ?? 0) - (nrrMap[String(a.teamId)] ?? 0) ||
      b.wins - a.wins
  );
};

const resolveSlotTeam = (slot, allMatches, nrrMap = {}) => {
  if (!slot || slot.type === "fixed") return null;

  if (slot.type === "matchWinner") {
    const source = allMatches.find((m) => m.matchNumber === slot.sourceMatch);
    if (source?.status === "Completed" && source.winner) return source.winner;
    return null;
  }

  if (slot.type === "groupRank") {
    const groupMatches = allMatches.filter((m) => m.round === slot.group && m.teamASlot?.type === "fixed");
    if (groupMatches.length === 0) return null;
    const allDone = groupMatches.every((m) => m.status === "Completed");
    if (!allDone) return null;
    const standings = computeGroupStandings(groupMatches, nrrMap);
    const entry = standings[slot.rank - 1];
    return entry ? entry.teamId : null;
  }

  return null;
};

export const resolveFixtures = async (tournamentId) => {
  const teams = await Team.find({ tournament: tournamentId }).select("_id stats.netRunRate");
  const nrrMap = Object.fromEntries(
    teams.map((t) => [String(t._id), t.stats?.netRunRate ?? 0])
  );

  let changed = true;
  let iterations = 0;

  while (changed && iterations < 8) {
    changed = false;
    iterations += 1;
    const allMatches = await Match.find({ tournament: tournamentId });

    for (const match of allMatches) {
      let updated = false;

      if (!match.teamA && match.teamASlot?.type !== "fixed") {
        const resolved = resolveSlotTeam(match.teamASlot, allMatches, nrrMap);
        if (resolved) {
          match.teamA = resolved;
          updated = true;
        }
      }

      if (!match.teamB && match.teamBSlot?.type !== "fixed") {
        const resolved = resolveSlotTeam(match.teamBSlot, allMatches, nrrMap);
        if (resolved) {
          match.teamB = resolved;
          updated = true;
        }
      }

      if (updated) {
        await match.save();
        changed = true;
      }
    }
  }
};

export const generateFixtures = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  }).populate("teams");

  if (!tournament) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(tournament);
  if (tournament.status === "Completed") {
    throw new ApiError(400, "This tournament is completed and locked. Fixtures can no longer be generated.");
  }

  const teams = tournament.teams;
  if (teams.length < 2) throw new ApiError(400, "Need at least 2 teams to generate fixtures");

  // Scheduling options (with sane defaults)
  const matchesPerDay = Math.max(1, Number(req.body?.matchesPerDay) || 3);
  const matchDurationMinutes = Math.max(30, Number(req.body?.matchDurationMinutes) || 180);
  const matchStartTime =
    typeof req.body?.matchStartTime === "string" && req.body.matchStartTime.trim()
      ? req.body.matchStartTime.trim()
      : "10:00 AM";

  // Delete existing fixtures for this tournament
  await Match.deleteMany({ tournament: tournament._id });

  const { tournamentType: rawType, startDate, overs } = tournament;
  const tournamentType = resolveTournamentType(rawType);
  const matchNumRef = { value: 1 };
  let rawFixtures = [];

  // League-style formats get automatic playoffs (SF1, SF2, Final) appended
  // after the league stage when there are enough teams to seed a top-4.
  const withLeaguePlayoffs = (leagueFixtures) => {
    if (teams.length < 4) return leagueFixtures;
    const baseStage = Math.max(...leagueFixtures.map((f) => f.stage ?? 0)) + 1;
    return [...leagueFixtures, ...generateLeaguePlayoffs(matchNumRef, baseStage)];
  };

  switch (tournamentType) {
    case "Knockout (Single Elimination)":
      rawFixtures = generateKnockoutFixtures(teams, matchNumRef);
      break;
    case "Double Round Robin":
      rawFixtures = withLeaguePlayoffs(generateRoundRobinFixtures(teams, matchNumRef, true));
      break;
    case "Group Stage": {
      const numGroups = determineGroupCount(teams.length);
      rawFixtures = generateGroupStageFixtures(teams, numGroups, matchNumRef, 0).fixtures;
      break;
    }
    case "Hybrid (Group Stage + Knockout)":
      rawFixtures = generateHybridFixtures(teams, matchNumRef);
      break;
    case "Round Robin (League)":
      rawFixtures = withLeaguePlayoffs(generateRoundRobinFixtures(teams, matchNumRef, false));
      break;
    default:
      if (isKnockoutType(tournamentType)) {
        rawFixtures = generateKnockoutFixtures(teams, matchNumRef);
      } else if (isHybridType(tournamentType)) {
        rawFixtures = generateHybridFixtures(teams, matchNumRef);
      } else {
        rawFixtures = withLeaguePlayoffs(generateRoundRobinFixtures(teams, matchNumRef, false));
      }
  }

  const scheduled = scheduleFixtures(rawFixtures, {
    startDate,
    matchesPerDay,
    matchStartTime,
    matchDurationMinutes,
  });

  if (!validateFixtures(scheduled, matchesPerDay)) {
    throw new ApiError(500, "Generated fixtures contain scheduling conflicts");
  }

  const fixturesToInsert = scheduled.map((fixture) => ({
    ...fixture,
    tournament: tournament._id,
    overs,
    status: "Scheduled",
    createdBy: req.user._id,
  }));

  const created = await Match.insertMany(fixturesToInsert);
  await resolveFixtures(tournament._id);
  await recalculateTournamentStandings(tournament._id, { Team, Match });

  const finalFixtures = await Match.find({ tournament: tournament._id })
    .populate("teamA teamB winner tossWinner", "name logo city")
    .sort({ matchNumber: 1 });

  notifyFixturesGenerated(req.user._id, tournament, created.length).catch((err) =>
    console.error("[notification]", err.message)
  );

  res.status(201).json({
    success: true,
    message: `${created.length} fixtures generated`,
    data: finalFixtures,
    count: created.length,
  });
});

export const getTournamentFixtures = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (tournament.isStorageArchived) {
    res.json({
      success: true,
      data: [],
      count: 0,
      archived: true,
      message: "This tournament has been archived to optimize storage.",
    });
    return;
  }

  const fixtures = await Match.find({ tournament: req.params.id })
    .populate("teamA teamB winner tossWinner", "name logo city")
    .sort({ matchNumber: 1 });

  res.json({ success: true, data: fixtures, count: fixtures.length });
});

const PLAYING_XI_SIZE = 11;

const validatePlayingXI = async (playerIds, teamId, tournamentId, label) => {
  if (!Array.isArray(playerIds) || playerIds.length !== PLAYING_XI_SIZE) {
    throw new ApiError(400, `${label} Playing XI must have exactly ${PLAYING_XI_SIZE} players`);
  }

  const unique = new Set(playerIds.map(String));
  if (unique.size !== PLAYING_XI_SIZE) {
    throw new ApiError(400, `${label} Playing XI cannot contain duplicate players`);
  }

  const players = await Player.find({
    _id: { $in: playerIds },
    team: teamId,
    tournament: tournamentId,
  });

  if (players.length !== PLAYING_XI_SIZE) {
    throw new ApiError(400, `${label} Playing XI contains invalid or out-of-squad players`);
  }

  const wicketKeeperCount = players.filter((p) => p.role === "Wicket-Keeper").length;
  if (wicketKeeperCount > 2) {
    throw new ApiError(400, "Maximum 2 wicket keepers are allowed in the Playing XI.");
  }

  return playerIds;
};

export const startMatch = asyncHandler(async (req, res) => {
  const { teamAPlayingXI, teamBPlayingXI, tossWinner, tossDecision } = req.body;

  if (!tossWinner || !tossDecision) {
    throw new ApiError(400, "tossWinner and tossDecision are required");
  }
  if (!TOSS_DECISIONS.includes(tossDecision)) {
    throw new ApiError(400, "tossDecision must be Bat or Bowl");
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[startMatch] request body umpire fields:", {
      umpires: req.body?.umpires,
      umpireNames: req.body?.umpireNames,
      umpire1Name: req.body?.umpire1Name,
      umpire2Name: req.body?.umpire2Name,
    });
  }

  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(tournament);

  if (tournament.status === "Completed") {
    throw new ApiError(400, "This tournament is completed and locked. Matches can no longer be started.");
  }

  const match = await Match.findOne({ _id: req.params.matchId, tournament: tournament._id });
  if (!match) throw new ApiError(404, "Match not found");

  if (match.status !== "Scheduled") {
    throw new ApiError(400, "Only scheduled matches can be started");
  }

  if (!match.teamA || !match.teamB) {
    throw new ApiError(400, "Both teams must be confirmed before starting the match");
  }

  if (![match.teamA.toString(), match.teamB.toString()].includes(String(tossWinner))) {
    throw new ApiError(400, "Toss winner must be one of the two competing teams");
  }

  const umpireInput = prepareStartMatchUmpires(req.body);
  if (!umpireInput.ok) {
    throw new ApiError(400, umpireInput.error);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[startMatch] resolved umpires:", umpireInput);
  }

  if (umpireInput.source === "none") {
    throw new ApiError(400, "Main umpire is required");
  }

  let finalUmpireIds = umpireInput.umpireIds;

  if (umpireInput.source === "database") {
    if (finalUmpireIds.length === 0) {
      throw new ApiError(400, "Main umpire is required");
    }

    const uniqueUmpires = new Set(finalUmpireIds);
    if (uniqueUmpires.size !== finalUmpireIds.length) {
      throw new ApiError(400, "Duplicate umpires are not allowed");
    }

    const umpireRecords = await Umpire.find({
      _id: { $in: finalUmpireIds },
      organizerId: req.user._id,
      status: "Available",
    });
    if (umpireRecords.length !== finalUmpireIds.length) {
      throw new ApiError(400, "One or more selected umpires are unavailable or invalid");
    }
  } else if (finalUmpireIds.length > 0) {
    const uniqueUmpires = new Set(finalUmpireIds);
    if (uniqueUmpires.size !== finalUmpireIds.length) {
      throw new ApiError(400, "Duplicate umpires are not allowed");
    }

    const umpireRecords = await Umpire.find({
      _id: { $in: finalUmpireIds },
      organizerId: req.user._id,
    });
    if (umpireRecords.length !== finalUmpireIds.length) {
      throw new ApiError(400, "One or more selected umpires are invalid");
    }
  }

  const finalUmpireNames = umpireInput.umpireNames;

  const validatedA = await validatePlayingXI(
    teamAPlayingXI,
    match.teamA,
    tournament._id,
    "Team A"
  );
  const validatedB = await validatePlayingXI(
    teamBPlayingXI,
    match.teamB,
    tournament._id,
    "Team B"
  );

  match.teamAPlayingXI = validatedA;
  match.teamBPlayingXI = validatedB;
  match.umpires = finalUmpireIds;
  match.umpireNames = finalUmpireNames;

  // Optional official scorer — snapshot name for historical scorecards
  const scorerId = toObjectIdOrNull(req.body.scorerId || req.body.scorer);
  if (scorerId) {
    const scorer = await Scorer.findOne({
      _id: scorerId,
      organizerId: req.user._id,
      status: "Active",
    });
    if (!scorer) {
      throw new ApiError(400, "Selected scorer is unavailable or invalid");
    }
    match.scorer = scorer._id;
    match.scorerName = scorer.fullName;
  } else if (req.body.scorerId === "" || req.body.scorer === "" || req.body.scorerId === null) {
    match.scorer = null;
    match.scorerName = "";
  }

  match.tossWinner = tossWinner;
  match.tossDecision = tossDecision;
  match.status = "Live";
  match.startedAt = new Date();
  await match.save();

  if (finalUmpireIds.length > 0 && umpireInput.source === "database") {
    await setUmpiresBusy(finalUmpireIds, req.user._id);
  }

  if (tournament.status === "Upcoming" || tournament.status === "Draft") {
    tournament.status = "Live";
    await tournament.save();
  }

  const updated = await Match.findById(match._id)
    .populate("teamA teamB winner tossWinner", "name logo city")
    .populate("teamAPlayingXI teamBPlayingXI", "name photo jerseyNumber role")
    .populate("umpires", "fullName umpireType city status")
    .populate("scorer", "fullName phone email status profilePhoto");

  notifyMatchStarted(req.user._id, match, tournament).catch((err) =>
    console.error("[notification]", err.message)
  );

  res.json({
    success: true,
    message: "Match started successfully",
    data: updated,
  });
});

// ── Auto-completion ─────────────────────────────────────────────────────────
//
// finalizeTournamentIfComplete lives in ../utils/tournamentStatus.js

export const recordMatchResult = asyncHandler(async (req, res) => {
  const { winner } = req.body;
  if (!winner) throw new ApiError(400, "winner team id is required");

  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isDeleted: false,
  });
  if (!tournament) throw new ApiError(404, "Tournament not found");
  assertTournamentNotStorageArchived(tournament);

  if (tournament.status === "Completed") {
    throw new ApiError(400, "This tournament is completed and locked. Match results can no longer be changed.");
  }

  const match = await Match.findOne({ _id: req.params.matchId, tournament: tournament._id });
  if (!match) throw new ApiError(404, "Match not found");

  if (!match.teamA || !match.teamB) {
    throw new ApiError(400, "Both teams must be confirmed before recording a result");
  }
  if (![match.teamA.toString(), match.teamB.toString()].includes(String(winner))) {
    throw new ApiError(400, "Winner must be one of the two competing teams");
  }

  match.winner = winner;
  match.status = "Completed";
  if (!match.resultSummary) {
    const winnerTeam = await Team.findById(winner).select("name");
    match.resultSummary = `${winnerTeam?.name || "Winner"} won`;
  }
  await match.save();

  notifyMatchCompleted(req.user._id, match, tournament).catch((err) =>
    console.error("[notification]", err.message)
  );

  const umpireIds = extractMatchUmpireIds(match);
  if (umpireIds.length > 0) {
    await setUmpiresAvailable(umpireIds, req.user._id);
  }

  await recalculateTournamentStandings(tournament._id, { Team, Match });

  // Advance the winner into any dependent knockout/qualifier slots
  await resolveFixtures(tournament._id);

  // Auto-complete + lock the tournament if this was the last match.
  const finalized = await finalizeTournamentIfComplete(tournament._id);
  invalidateUserTournamentSyncCache(req.user._id);

  const [fixtures, updatedTournament] = await Promise.all([
    Match.find({ tournament: tournament._id })
      .populate("teamA teamB winner tossWinner", "name logo city")
      .sort({ matchNumber: 1 }),
    Tournament.findById(tournament._id).populate("winner runnerUp teams", "name logo city"),
  ]);

  res.json({
    success: true,
    message: finalized?.status === "Completed"
      ? "Final result recorded — tournament completed!"
      : "Match result recorded",
    data: fixtures,
    tournament: updatedTournament,
  });
});

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await syncTournamentStatusesForUser(userId);

  const [tournaments, teams, players, matches, venues, recentTournaments, recentMatches] =
    await Promise.all([
      Tournament.countDocuments({ createdBy: userId, isDeleted: false }),
      Team.countDocuments({ createdBy: userId }),
      Player.countDocuments({ createdBy: userId }),
      Match.countDocuments({ createdBy: userId }),
      Venue.countDocuments({ organizerId: userId }),
      Tournament.find({ createdBy: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "tournamentName status startDate endDate city tournamentLogo bannerImage winner runnerUp isStorageArchived archiveSummary completedAt"
        )
        .populate("winner runnerUp", "name logo")
        .lean(),
      Match.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("status teamA teamB tournament createdAt")
        .populate("tournament", "tournamentName")
        .populate("teamA teamB", "name")
        .lean(),
    ]);

  const statusBreakdown = await Tournament.aggregate([
    { $match: { createdBy: userId, isDeleted: false } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      stats: { tournaments, teams, players, matches, venues },
      statusBreakdown,
      recentTournaments: recentTournaments.map(formatTournamentForClient),
      recentMatches,
    },
  });
});

export const getTournamentStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await syncTournamentStatusesForUser(userId);

  const matchFilter = {
    createdBy: userId,
    isDeleted: false,
    isArchived: false,
    isStorageArchived: { $ne: true },
  };

  const [facet] = await Tournament.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        breakdown: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const statusMap = {};
  (facet?.breakdown || []).forEach(({ _id, count }) => {
    statusMap[_id] = count;
  });

  res.json({
    success: true,
    data: {
      total: facet?.total?.[0]?.count || 0,
      upcoming: statusMap["Upcoming"] || 0,
      live: statusMap["Live"] || 0,
      completed: statusMap["Completed"] || 0,
      draft: statusMap["Draft"] || 0,
      cancelled: statusMap["Cancelled"] || 0,
    },
  });
});
