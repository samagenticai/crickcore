import connectDB from "./config/db.js";
import { syncAllTournamentStatuses } from "./utils/tournamentStatus.js";
import { migrateAllTournaments } from "./utils/dataMigration.js";
import { migrateUserRoles } from "./utils/migrateUserRoles.js";
import { scrubInvalidObjectIdRefs } from "./utils/scrubInvalidObjectIdRefs.js";
import { validateEnvironment } from "./config/envCheck.js";

/** Connect MongoDB and run one-time startup migrations. Safe to call once per process. */
export async function runBootstrap() {
  validateEnvironment();
  await connectDB();

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
}
