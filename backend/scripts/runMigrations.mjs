import dotenv from "dotenv";
import { ensureDatabaseReady, runStartupMigrations } from "../src/bootstrap.js";

dotenv.config();

try {
  await ensureDatabaseReady();
  const result = await runStartupMigrations();
  console.log("[migrate] Completed:", result);
  process.exit(0);
} catch (err) {
  console.error("[migrate] Failed:", err);
  process.exit(1);
}
