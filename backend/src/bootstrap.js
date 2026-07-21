import connectDB, { getDatabaseState } from "./config/db.js";
import { syncAllTournamentStatuses } from "./utils/tournamentStatus.js";
import { migrateAllTournaments } from "./utils/dataMigration.js";
import { migrateUserRoles } from "./utils/migrateUserRoles.js";
import { scrubInvalidObjectIdRefs } from "./utils/scrubInvalidObjectIdRefs.js";
import { validateEnvironment } from "./config/envCheck.js";

let readyPromise = null;
let migrationsPromise = null;

/**
 * Fast path for request handling: validate env + connect MongoDB once per process.
 * Does NOT run data migrations (safe for Vercel/serverless cold starts).
 */
export function ensureDatabaseReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      validateEnvironment();
      await connectDB();
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

/** Heavy one-time style migrations — must not block auth/API on serverless. */
export async function runStartupMigrations() {
  const roleUpdates = await migrateUserRoles();
  if (roleUpdates > 0) {
    console.log(`User role migration: normalized ${roleUpdates} account(s) to lowercase roles`);
  }

  await scrubInvalidObjectIdRefs();

  const { scanned, updated } = await syncAllTournamentStatuses();
  if (updated > 0) {
    console.log(`Tournament status sync: updated ${updated} of ${scanned} records`);
  }

  const migration = await migrateAllTournaments();
  if (migration.tournaments > 0) {
    console.log(
      `Data migration: ${migration.tournaments} tournaments, ${migration.tossBackfilled} toss backfills, standings recalculated`
    );
  }

  return { roleUpdates, tournamentStatusUpdates: updated, ...migration };
}

/**
 * Local dev server bootstrap: connect immediately, run migrations without blocking listen.
 */
export async function runBootstrap() {
  await ensureDatabaseReady();

  if (process.env.RUN_STARTUP_MIGRATIONS === "false") {
    return { migrations: "skipped" };
  }

  if (!migrationsPromise) {
    migrationsPromise = runStartupMigrations().catch((err) => {
      migrationsPromise = null;
      console.error("[bootstrap] Startup migrations failed:", err);
      throw err;
    });
  }

  return migrationsPromise;
}

export function getBootstrapState() {
  return {
    db: getDatabaseState(),
    readyPending: Boolean(readyPromise),
    migrationsPending: Boolean(migrationsPromise),
  };
}
