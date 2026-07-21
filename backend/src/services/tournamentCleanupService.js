import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Match from "../models/Match.js";
import Player from "../models/Player.js";
import Ball from "../models/Ball.js";
import Notification from "../models/Notification.js";
import { ApiError } from "../utils/helpers.js";

export const MAX_ACTIVE_TOURNAMENTS = 5;

const ACTIVE_TOURNAMENT_FILTER = {
  isDeleted: false,
  isStorageArchived: { $ne: true },
};

/**
 * Runs a callback inside a MongoDB transaction when supported.
 * Falls back to non-transactional execution on standalone instances.
 */
async function withOptionalTransaction(callback) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction().catch(() => {});

    const txnUnsupported =
      err.code === 20 ||
      err.codeName === "IllegalOperation" ||
      /transaction/i.test(err.message || "");

    if (txnUnsupported) {
      return callback(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

export async function countActiveTournamentSlots(userId) {
  return Tournament.countDocuments({
    ...ACTIVE_TOURNAMENT_FILTER,
    createdBy: userId,
  });
}

export async function findOldestCompletedForCleanup(userId) {
  return Tournament.findOne({
    ...ACTIVE_TOURNAMENT_FILTER,
    createdBy: userId,
    status: "Completed",
  })
    .sort({ completedAt: 1, createdAt: 1 })
    .populate("winner runnerUp", "name logo")
    .populate("venue", "name city groundName")
    .populate("createdBy", "fullName name email");
}

export async function buildArchiveSummary(tournament) {
  const [teamCount, matchCount] = await Promise.all([
    Team.countDocuments({ tournament: tournament._id }),
    Match.countDocuments({ tournament: tournament._id }),
  ]);

  const organizer = tournament.createdBy;
  const organizerName =
    organizer?.fullName ||
    organizer?.name ||
    (typeof organizer === "object" && organizer?.email) ||
    "Organizer";

  const venueName =
    tournament.venue?.name ||
    tournament.groundName ||
    tournament.city ||
    "";

  return {
    tournamentName: tournament.tournamentName,
    tournamentLogo: tournament.tournamentLogo || "",
    bannerImage: tournament.bannerImage || "",
    organizerName,
    organizerId: organizer?._id || tournament.createdBy,
    venueName,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    winnerName: tournament.winner?.name || "",
    winnerLogo: tournament.winner?.logo || "",
    runnerUpName: tournament.runnerUp?.name || "",
    runnerUpLogo: tournament.runnerUp?.logo || "",
    totalTeams: teamCount || tournament.teams?.length || 0,
    totalMatches: matchCount || tournament.totalMatches || 0,
    status: "Completed",
    createdAt: tournament.createdAt,
    completedAt: tournament.completedAt || tournament.updatedAt,
    archivedAt: new Date(),
  };
}

export async function deleteTournamentHeavyData(tournamentId, userId, session = null) {
  const opts = session ? { session } : {};

  const teams = await Team.find({ tournament: tournamentId }).select("_id").session(session || null);
  const teamIds = teams.map((t) => t._id);
  const matches = await Match.find({ tournament: tournamentId }).select("_id").session(session || null);
  const matchIds = matches.map((m) => m._id);

  await Ball.deleteMany({ tournament: tournamentId }, opts);
  if (matchIds.length) {
    await Ball.deleteMany({ match: { $in: matchIds } }, opts);
  }
  await Match.deleteMany({ tournament: tournamentId }, opts);
  if (teamIds.length) {
    await Player.deleteMany({ team: { $in: teamIds } }, opts);
  }
  await Player.deleteMany({ tournament: tournamentId }, opts);
  await Team.deleteMany({ tournament: tournamentId }, opts);

  const relatedIds = [tournamentId, ...teamIds, ...matchIds].filter(Boolean);
  if (relatedIds.length) {
    await Notification.deleteMany(
      {
        user: userId,
        relatedId: { $in: relatedIds },
      },
      opts
    );
  }
}

/**
 * Archive tournament summary, then delete heavy related data.
 * Only completed tournaments are eligible.
 */
export async function archiveAndCleanupTournament(tournamentId, userId) {
  return withOptionalTransaction(async (session) => {
    const tournament = await Tournament.findOne({
      _id: tournamentId,
      createdBy: userId,
      ...ACTIVE_TOURNAMENT_FILTER,
      status: "Completed",
    })
      .populate("winner runnerUp", "name logo")
      .populate("venue", "name city groundName")
      .populate("createdBy", "fullName name email")
      .session(session || null);

    if (!tournament) {
      return { archived: false, reason: "not_eligible" };
    }

    const archiveSummary = await buildArchiveSummary(tournament);

    const archiveResult = await Tournament.updateOne(
      { _id: tournamentId, status: "Completed", isStorageArchived: { $ne: true } },
      {
        $set: {
          isStorageArchived: true,
          storageArchivedAt: new Date(),
          archiveSummary,
          teams: [],
          sponsors: [],
          winner: null,
          runnerUp: null,
          venue: null,
        },
      },
      session ? { session } : {}
    );

    if (!archiveResult.modifiedCount) {
      return { archived: false, reason: "archive_failed" };
    }

    await deleteTournamentHeavyData(tournamentId, userId, session);

    return { archived: true, tournamentId, archiveSummary };
  });
}

/**
 * Free active tournament slots by cleaning up oldest completed tournaments.
 */
export async function ensureActiveTournamentCapacity(userId) {
  const cleaned = [];
  let activeCount = await countActiveTournamentSlots(userId);

  while (activeCount >= MAX_ACTIVE_TOURNAMENTS) {
    const oldest = await findOldestCompletedForCleanup(userId);
    if (!oldest) break;

    const result = await archiveAndCleanupTournament(oldest._id, userId);
    if (!result.archived) break;

    cleaned.push(result);
    activeCount = await countActiveTournamentSlots(userId);
  }

  return { activeCount, cleaned };
}

/**
 * Called before creating a new tournament.
 * Cleans up oldest completed tournaments when the active cap is reached.
 */
export async function enforceCapacityBeforeCreate(userId) {
  let activeCount = await countActiveTournamentSlots(userId);
  if (activeCount < MAX_ACTIVE_TOURNAMENTS) {
    return { allowed: true, activeCount, cleaned: [] };
  }

  const { cleaned } = await ensureActiveTournamentCapacity(userId);
  activeCount = await countActiveTournamentSlots(userId);

  if (activeCount >= MAX_ACTIVE_TOURNAMENTS) {
    throw new ApiError(
      400,
      "Maximum of 5 active tournaments reached. Complete a tournament to free a slot, or remove a draft/upcoming/live tournament before creating another."
    );
  }

  return { allowed: true, activeCount, cleaned };
}

export function formatTournamentForClient(tournament) {
  if (!tournament) return tournament;
  const doc = tournament.toObject ? tournament.toObject({ virtuals: true }) : { ...tournament };

  const withId = {
    ...doc,
    id: doc._id ?? doc.id,
    teams: Array.isArray(doc.teams) ? doc.teams : [],
  };

  if (!withId.isStorageArchived) return withId;

  const summary = withId.archiveSummary || {};

  return {
    ...withId,
    tournamentName: summary.tournamentName || withId.tournamentName,
    tournamentLogo: summary.tournamentLogo ?? withId.tournamentLogo,
    bannerImage: summary.bannerImage ?? withId.bannerImage,
    startDate: summary.startDate || withId.startDate,
    endDate: summary.endDate || withId.endDate,
    status: summary.status || withId.status,
    completedAt: summary.completedAt || withId.completedAt,
    totalMatches: summary.totalMatches ?? withId.totalMatches,
    teams: [],
    sponsors: [],
    venue: summary.venueName
      ? { venueName: summary.venueName, name: summary.venueName, city: summary.venueName }
      : null,
    winner: summary.winnerName
      ? { name: summary.winnerName, logo: summary.winnerLogo || "" }
      : withId.winner,
    runnerUp: summary.runnerUpName
      ? { name: summary.runnerUpName, logo: summary.runnerUpLogo || "" }
      : withId.runnerUp,
    organizerName: summary.organizerName,
    archiveSummary: summary,
  };
}

export function assertTournamentNotStorageArchived(tournament) {
  if (tournament?.isStorageArchived) {
    throw new ApiError(
      400,
      "This tournament has been archived to optimize storage and can no longer be modified."
    );
  }
}
