/**
 * Full E2E: seed match data, start via HTTP with manual umpireNames, verify MongoDB.
 * Run: node scripts/e2e-start-match.mjs
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { generateToken } from "../src/utils/token.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import { prepareStartMatchUmpires } from "../src/utils/matchUmpires.js";

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

// ── Unit: single validation source ──────────────────────────────────────────
const manual = prepareStartMatchUmpires({ umpireNames: ["John Smith"] });
assert(manual.ok && manual.umpireNames[0] === "John Smith", "manual umpireNames failed");

const db = prepareStartMatchUmpires({ umpires: ["507f1f77bcf86cd799439011"] });
assert(db.ok && db.umpireIds.length === 1, "database umpires failed");

const empty = prepareStartMatchUmpires({});
assert(empty.ok && empty.source === "none", "empty umpires should be allowed");

const conflict = prepareStartMatchUmpires({ umpires: ["507f1f77bcf86cd799439011"], umpireNames: ["X"] });
assert(!conflict.ok, "both sources should conflict");

console.log("✓ prepareStartMatchUmpires unit checks passed");

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DATABASE || "cricket_tournament",
});

const User = (await import("../src/models/User.js")).default;
const Tournament = (await import("../src/models/Tournament.js")).default;
const Team = (await import("../src/models/Team.js")).default;
const Player = (await import("../src/models/Player.js")).default;
const Match = (await import("../src/models/Match.js")).default;
const Umpire = (await import("../src/models/Umpire.js")).default;

const cleanup = [];

const user = await User.create({
  fullName: "E2E Test Organizer",
  email: `e2e-umpire-${Date.now()}@test.local`,
  phone: `9${Date.now().toString().slice(-9)}`,
  password: "TestPass123",
  role: "Organizer",
  isActive: true,
});
cleanup.push(() => User.deleteOne({ _id: user._id }));
assert(await User.findById(user._id), "Auth user must resolve via findById");

const token = generateToken(user._id.toString());
console.log("Test user:", user._id.toString());

// Find or create scheduled match with squads
let match = await Match.findOne({
  status: "Scheduled",
  teamA: { $ne: null },
  teamB: { $ne: null },
  createdBy: user._id,
}).lean();

let tournamentId;

if (!match) {
  const tournament = await Tournament.create({
    tournamentName: `E2E Umpire Test ${Date.now()}`,
    format: "T20",
    numberOfTeams: 2,
    city: "Test City",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    status: "Upcoming",
    createdBy: user._id,
  });
  tournamentId = tournament._id;
  cleanup.push(() => Tournament.deleteOne({ _id: tournament._id }));

  const teamA = await Team.create({ name: "E2E Team A", city: "A", createdBy: user._id });
  const teamB = await Team.create({ name: "E2E Team B", city: "B", createdBy: user._id });
  cleanup.push(() => Team.deleteMany({ _id: { $in: [teamA._id, teamB._id] } }));

  const makePlayers = async (teamId, prefix) => {
    const ids = [];
    for (let i = 1; i <= 11; i++) {
      const p = await Player.create({
        name: `${prefix} Player ${i}`,
        team: teamId,
        tournament: tournament._id,
        jerseyNumber: i,
        role: "Batsman",
        age: 25,
        createdBy: user._id,
      });
      ids.push(p._id);
    }
    return ids;
  };

  const squadA = await makePlayers(teamA._id, "A");
  const squadB = await makePlayers(teamB._id, "B");
  cleanup.push(() => Player.deleteMany({ tournament: tournament._id }));

  match = await Match.create({
    tournament: tournament._id,
    teamA: teamA._id,
    teamB: teamB._id,
    status: "Scheduled",
    matchNumber: 1,
    createdBy: user._id,
  });
  cleanup.push(() => Match.deleteOne({ _id: match._id }));

  match.squadA = squadA.map(String);
  match.squadB = squadB.map(String);
} else {
  tournamentId = match.tournament;
  const squadA = await Player.find({ team: match.teamA, tournament: match.tournament }).limit(11).lean();
  const squadB = await Player.find({ team: match.teamB, tournament: match.tournament }).limit(11).lean();
  assert(squadA.length === 11 && squadB.length === 11, "Existing match lacks full squads");
  match.squadA = squadA.map((p) => p._id.toString());
  match.squadB = squadB.map((p) => p._id.toString());
}

const payload = {
  teamAPlayingXI: match.squadA,
  teamBPlayingXI: match.squadB,
  umpireNames: ["Manual Umpire E2E"],
};

const port = process.env.PORT || 5000;
const url = `http://localhost:${port}/api/tournaments/${tournamentId}/fixtures/${match._id}/start`;

console.log("PATCH", url);
console.log("Payload:", JSON.stringify(payload));

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});

const body = await res.json().catch(() => ({}));
console.log("Response:", res.status, body?.message || body);

if (body?.message === "At least one umpire is required") {
  throw new Error(
    "STALE SERVER: still running old startMatch validation. Kill node on port 5000 and restart."
  );
}

assert(res.ok, `startMatch failed: ${body?.message || res.status}`);

const saved = await Match.findById(match._id).lean();
assert(saved.status === "Live", "Match status should be Live");
assert(
  Array.isArray(saved.umpireNames) && saved.umpireNames.includes("Manual Umpire E2E"),
  `umpireNames not saved: ${JSON.stringify(saved.umpireNames)}`
);
console.log("✓ MongoDB saved umpireNames:", saved.umpireNames);

// Test DB umpire selection on a fresh scheduled match if we created data
if (cleanup.length > 0) {
  const umpire = await Umpire.create({
    fullName: "DB Umpire E2E",
    phoneNumber: "03009998888",
    city: "Test City",
    country: "Pakistan",
    umpireType: "Main Umpire",
    organizerId: user._id,
  });

  const match2 = await Match.create({
    tournament: tournamentId,
    teamA: match.teamA,
    teamB: match.teamB,
    status: "Scheduled",
    matchNumber: 2,
    createdBy: user._id,
  });

  const payload2 = {
    teamAPlayingXI: match.squadA,
    teamBPlayingXI: match.squadB,
    umpires: [umpire._id.toString()],
  };

  const res2 = await fetch(
    `http://localhost:${port}/api/tournaments/${tournamentId}/fixtures/${match2._id}/start`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload2),
    }
  );
  const body2 = await res2.json().catch(() => ({}));
  assert(res2.ok, `DB umpire start failed: ${body2?.message || res2.status}`);

  const saved2 = await Match.findById(match2._id).lean();
  assert(saved2.umpires.map(String).includes(umpire._id.toString()), "DB umpire ID not saved");
  assert(saved2.umpireNames.includes("DB Umpire E2E"), "DB umpire name not resolved");
  console.log("✓ DB umpire selection saved:", saved2.umpireNames);

  await Match.deleteOne({ _id: match2._id });
  await Umpire.deleteOne({ _id: umpire._id });
}

for (const fn of cleanup.reverse()) {
  await fn();
}

await mongoose.disconnect();
console.log("✓ E2E start-match verification complete");
