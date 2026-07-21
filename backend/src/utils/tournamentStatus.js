import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import { notifyTournamentCompleted } from "./notificationEvents.js";

const TERMINAL_STATUSES = new Set(["Completed", "Cancelled"]);
const USER_SYNC_TTL_MS = 60_000;
const userSyncCache = new Map();

export function invalidateUserTournamentSyncCache(userId) {
  if (userId) userSyncCache.delete(String(userId));
}

const computeGroupStandings = (groupMatches) => {
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

  return [...table.values()].sort((a, b) => b.points - a.points || b.wins - a.wins);
};

/**
 * Mark a tournament Completed once every match is finished or cancelled.
 */
export const finalizeTournamentIfComplete = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId).select(
    "status isDeleted createdBy winner runnerUp totalMatches completedAt"
  );
  if (!tournament || tournament.isDeleted) return null;
  if (TERMINAL_STATUSES.has(tournament.status)) return tournament;

  const matches = await Match.find({ tournament: tournamentId })
    .select("status winner round matchNumber teamA teamB")
    .lean();

  if (matches.length === 0) return null;

  const pending = matches.filter((m) => m.status !== "Completed" && m.status !== "Cancelled");
  if (pending.length > 0) return null;

  const completed = matches.filter((m) => m.status === "Completed" && m.winner);
  if (completed.length === 0) return null;

  let winner = null;
  let runnerUp = null;

  const finalMatch = completed
    .filter((m) => m.round === "Final")
    .sort((a, b) => b.matchNumber - a.matchNumber)[0];

  if (finalMatch) {
    winner = finalMatch.winner;
    const winnerId = finalMatch.winner.toString();
    runnerUp =
      finalMatch.teamA && finalMatch.teamA.toString() === winnerId
        ? finalMatch.teamB
        : finalMatch.teamA;
  } else {
    const standings = computeGroupStandings(completed);
    winner = standings[0]?.teamId || null;
    runnerUp = standings[1]?.teamId || null;
  }

  tournament.status = "Completed";
  tournament.winner = winner;
  tournament.runnerUp = runnerUp || null;
  tournament.totalMatches = matches.length;
  tournament.completedAt = new Date();
  await tournament.save();

  if (tournament.createdBy) {
    notifyTournamentCompleted(tournament.createdBy, tournament).catch((err) =>
      console.error("[notification]", err.message)
    );
  }

  invalidateUserTournamentSyncCache(tournament.createdBy);
  return tournament;
};

const hasTournamentStarted = (tournament) =>
  Boolean(tournament?.startDate && new Date(tournament.startDate) <= new Date());

/**
 * Resolve the correct status for one tournament using current match + date rules.
 */
export const resolveTournamentStatus = (tournament, { hasLiveMatch = false } = {}) => {
  if (!tournament || TERMINAL_STATUSES.has(tournament.status)) {
    return tournament?.status ?? null;
  }

  const started = hasTournamentStarted(tournament);

  if (hasLiveMatch || started) {
    if (tournament.status === "Draft") {
      return hasLiveMatch ? "Live" : tournament.status;
    }
    return "Live";
  }

  if (tournament.status === "Live") {
    return "Upcoming";
  }

  return tournament.status;
};

/**
 * Synchronize one tournament's status in MongoDB (includes completion check).
 */
export const syncTournamentStatus = async (tournamentId) => {
  const finalized = await finalizeTournamentIfComplete(tournamentId);
  if (finalized?.status === "Completed") return finalized;

  const tournament = await Tournament.findById(tournamentId).select("status isDeleted startDate");
  if (!tournament || tournament.isDeleted) return null;
  if (TERMINAL_STATUSES.has(tournament.status)) return tournament;

  const hasLiveMatch = Boolean(
    await Match.exists({ tournament: tournamentId, status: "Live" })
  );

  const nextStatus = resolveTournamentStatus(tournament, { hasLiveMatch });
  if (nextStatus && nextStatus !== tournament.status) {
    tournament.status = nextStatus;
    await tournament.save();
  }

  return tournament;
};

/**
 * Fast batched sync for dashboard/list reads — no per-tournament finalize scans.
 * Cached per user to avoid hammering MongoDB on parallel frontend requests.
 */
export const syncTournamentStatusesForUser = async (userId, { force = false } = {}) => {
  const cacheKey = String(userId);
  const cachedAt = userSyncCache.get(cacheKey);
  const now = Date.now();

  if (!force && cachedAt && now - cachedAt < USER_SYNC_TTL_MS) {
    return { scanned: 0, updated: 0, cached: true };
  }

  const tournaments = await Tournament.find({
    createdBy: userId,
    isDeleted: false,
    status: { $nin: ["Completed", "Cancelled"] },
  })
    .select("_id status startDate")
    .lean();

  if (!tournaments.length) {
    userSyncCache.set(cacheKey, now);
    return { scanned: 0, updated: 0, cached: false };
  }

  const ids = tournaments.map((t) => t._id);
  const liveRows = await Match.aggregate([
    { $match: { tournament: { $in: ids }, status: "Live" } },
    { $group: { _id: "$tournament" } },
  ]);
  const liveSet = new Set(liveRows.map((row) => String(row._id)));

  const bulkOps = [];
  for (const tournament of tournaments) {
    const hasLiveMatch = liveSet.has(String(tournament._id));
    const nextStatus = resolveTournamentStatus(tournament, { hasLiveMatch });
    if (nextStatus && nextStatus !== tournament.status) {
      bulkOps.push({
        updateOne: {
          filter: { _id: tournament._id },
          update: { $set: { status: nextStatus } },
        },
      });
    }
  }

  if (bulkOps.length) {
    await Tournament.bulkWrite(bulkOps, { ordered: false });
  }

  userSyncCache.set(cacheKey, now);
  return { scanned: tournaments.length, updated: bulkOps.length, cached: false };
};

const syncTournamentIds = async (tournamentIds) => {
  let updated = 0;

  for (const tournamentId of tournamentIds) {
    const before = await Tournament.findById(tournamentId).select("status").lean();
    const after = await syncTournamentStatus(tournamentId);
    if (before && after && before.status !== after.status) updated += 1;
  }

  return { scanned: tournamentIds.length, updated };
};

/**
 * Synchronize every non-terminal tournament already stored in MongoDB.
 */
export const syncAllTournamentStatuses = async (extraFilter = {}) => {
  const tournaments = await Tournament.find({
    isDeleted: false,
    status: { $nin: ["Completed", "Cancelled"] },
    ...extraFilter,
  })
    .select("_id")
    .lean();

  return syncTournamentIds(tournaments.map((t) => t._id));
};

/**
 * Synchronize public viewer tournaments.
 */
export const syncPublicTournamentStatuses = async () =>
  syncAllTournamentStatuses({ isPublic: true, isArchived: false });

/** @deprecated Use syncTournamentStatus instead */
export const promoteTournamentToLiveIfStarted = async (tournament) => {
  if (!tournament) return null;
  return syncTournamentStatus(tournament._id);
};

/** @deprecated Use syncPublicTournamentStatuses instead */
export const promoteUpcomingTournamentsToLive = async () => {
  await syncPublicTournamentStatuses();
};
