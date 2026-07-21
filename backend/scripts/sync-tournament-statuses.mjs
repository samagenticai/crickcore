/**
 * One-time / manual sync of all existing tournament statuses in MongoDB.
 * Run: node scripts/sync-tournament-statuses.mjs
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { syncAllTournamentStatuses } = await import("../src/utils/tournamentStatus.js");

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

try {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const { scanned, updated } = await syncAllTournamentStatuses();
  console.log(`Tournament status sync complete: updated ${updated} of ${scanned} records`);
} catch (err) {
  console.error("Sync failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
