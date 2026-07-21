/**
 * End-to-end verification for match start umpire handling.
 * Run: node scripts/verify-start-match.mjs
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import {
  normalizeManualUmpireNames,
  normalizeUmpireIds,
  resolveMatchUmpires,
} from "../src/utils/matchUmpires.js";

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

// ── Unit: shared umpire resolution ──────────────────────────────────────────
const manualBody = { umpireNames: ["John Smith"] };
const manualNames = normalizeManualUmpireNames(manualBody);
const resolvedManual = resolveMatchUmpires({ umpireIds: [], manualNames });
assert(resolvedManual.umpireNames[0] === "John Smith", "manual name resolution failed");
assert(resolvedManual.umpireIds.length === 0, "manual should not set umpire IDs");

const dbBody = { umpires: ["507f1f77bcf86cd799439011"] };
const dbResolved = resolveMatchUmpires({
  umpireIds: normalizeUmpireIds(dbBody.umpires),
  manualNames: [],
});
assert(dbResolved.umpireIds.length === 1, "DB umpire ID resolution failed");

const emptyResolved = resolveMatchUmpires({ umpireIds: [], manualNames: [] });
assert(
  emptyResolved.umpireIds.length === 0 && emptyResolved.umpireNames.length === 0,
  "empty umpires should be allowed"
);

console.log("✓ matchUmpires unit checks passed");

// ── Integration: MongoDB scheduled match ───────────────────────────────────
await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DATABASE || "cricket_tournament",
});
const Match = (await import("../src/models/Match.js")).default;
const Player = (await import("../src/models/Player.js")).default;
const Tournament = (await import("../src/models/Tournament.js")).default;

const scheduled = await Match.findOne({
  status: "Scheduled",
  teamA: { $ne: null },
  teamB: { $ne: null },
}).lean();

if (!scheduled) {
  console.log("⚠ No scheduled match with both teams — skip MongoDB integration");
  await mongoose.disconnect();
  process.exit(0);
}

const tournament = await Tournament.findById(scheduled.tournament).lean();
const squadA = await Player.find({ team: scheduled.teamA, tournament: scheduled.tournament })
  .limit(11)
  .lean();
const squadB = await Player.find({ team: scheduled.teamB, tournament: scheduled.tournament })
  .limit(11)
  .lean();

if (squadA.length < 11 || squadB.length < 11) {
  console.log("⚠ Scheduled match lacks full squads — skip MongoDB integration");
  await mongoose.disconnect();
  process.exit(0);
}

console.log("Found test match:", scheduled._id.toString(), "tournament:", tournament?._id?.toString());

// Simulate controller umpire resolution from a manual-entry payload
const payload = {
  teamAPlayingXI: squadA.map((p) => p._id.toString()),
  teamBPlayingXI: squadB.map((p) => p._id.toString()),
  umpireNames: ["Test Umpire Manual"],
};

const names = normalizeManualUmpireNames(payload);
const ids = normalizeUmpireIds(payload.umpires);
const resolved = resolveMatchUmpires({ umpireIds: ids, manualNames: names });
assert(!resolved.error, `unexpected umpire error: ${resolved.error}`);
assert(resolved.umpireNames[0] === "Test Umpire Manual", "payload umpireNames not resolved");

console.log("✓ Payload resolution:", JSON.stringify(resolved));
console.log("✓ Ready for PATCH with umpireNames:", payload.umpireNames);

await mongoose.disconnect();
