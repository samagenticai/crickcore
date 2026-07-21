/**
 * End-to-end standings test: create tournament, complete two matches, verify points table.
 * Run: node scripts/standingsE2E.mjs
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { default: User } = await import("../src/models/User.js");
const { default: Tournament } = await import("../src/models/Tournament.js");
const { default: Team } = await import("../src/models/Team.js");
const { default: Match } = await import("../src/models/Match.js");
const { getTournamentStandings } = await import("../src/services/pointsTableService.js");

await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

const user =
  (await User.findOne({ role: { $in: ["organizer", "admin"] } })) ||
  (await User.findOne());

if (!user) {
  console.error("No user found for test");
  process.exit(1);
}

const tournament = await Tournament.create({
  tournamentName: `Standings E2E ${Date.now()}`,
  tournamentType: "Round Robin (League)",
  ballType: "Tennis Ball",
  overs: 20,
  numberOfTeams: 2,
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 86400000),
  status: "Live",
  createdBy: user._id,
  isPublic: true,
});

const teamA = await Team.create({ name: "E2E Alpha", city: "A", createdBy: user._id, tournament: tournament._id });
const teamB = await Team.create({ name: "E2E Beta", city: "B", createdBy: user._id, tournament: tournament._id });
tournament.teams = [teamA._id, teamB._id];
await tournament.save();

const makeCompletedMatch = async (winner, loser, matchNumber, runsA, runsB) => {
  return Match.create({
    tournament: tournament._id,
    teamA: teamA._id,
    teamB: teamB._id,
    matchNumber,
    status: "Completed",
    winner,
    resultSummary: `${winner.equals(teamA._id) ? teamA.name : teamB.name} won`,
    resultType: "runs",
    createdBy: user._id,
    liveScore: {
      inningsNumber: 2,
      isInitialized: true,
      battingTeam: winner,
      bowlingTeam: loser,
      totalRuns: winner.equals(teamA._id) ? runsA : runsB,
      legalBalls: 120,
      firstInnings: {
        runs: winner.equals(teamA._id) ? runsB : runsA,
        legalBalls: 120,
        battingTeam: loser,
      },
    },
  });
};

const match1 = await makeCompletedMatch(teamA._id, teamB._id, 1, 150, 140);
const standings1 = await getTournamentStandings(tournament._id);
const rowA1 = standings1.rows.find((r) => r.teamId === String(teamA._id));
const rowB1 = standings1.rows.find((r) => r.teamId === String(teamB._id));

console.log("After match 1:", { rowA1, rowB1 });
if (!rowA1 || rowA1.played !== 1 || rowA1.won !== 1 || rowA1.points !== 2) {
  throw new Error(`Match 1 standings wrong for winner: ${JSON.stringify(rowA1)}`);
}
if (!rowB1 || rowB1.played !== 1 || rowB1.lost !== 1) {
  throw new Error(`Match 1 standings wrong for loser: ${JSON.stringify(rowB1)}`);
}

const match2 = await makeCompletedMatch(teamB._id, teamA._id, 2, 160, 155);
const standings2 = await getTournamentStandings(tournament._id);
const rowA2 = standings2.rows.find((r) => r.teamId === String(teamA._id));
const rowB2 = standings2.rows.find((r) => r.teamId === String(teamB._id));

console.log("After match 2:", { rowA2, rowB2 });
if (!rowA2 || rowA2.played !== 2 || rowA2.won !== 1 || rowA2.lost !== 1 || rowA2.points !== 2) {
  throw new Error(`Match 2 standings wrong for team A: ${JSON.stringify(rowA2)}`);
}
if (!rowB2 || rowB2.played !== 2 || rowB2.won !== 1 || rowB2.lost !== 1 || rowB2.points !== 2) {
  throw new Error(`Match 2 standings wrong for team B: ${JSON.stringify(rowB2)}`);
}

// Legacy row: result saved but status still Live
await Match.create({
  tournament: String(tournament._id),
  teamA: teamA._id,
  teamB: teamB._id,
  matchNumber: 99,
  status: "Live",
  winner: teamA._id,
  resultSummary: "Legacy result row",
  createdBy: user._id,
  liveScore: {
    inningsNumber: 2,
    battingTeam: teamA._id,
    firstInnings: { runs: 100, legalBalls: 60, battingTeam: teamB._id },
    totalRuns: 101,
    legalBalls: 60,
  },
});

const standingsLegacy = await getTournamentStandings(tournament._id);
const totalPlayed = standingsLegacy.rows
  .filter((r) => [String(teamA._id), String(teamB._id)].includes(r.teamId))
  .reduce((s, r) => s + r.played, 0);
if (totalPlayed < 6) {
  throw new Error(`Legacy match not included; played sum for test teams=${totalPlayed}, expected >= 6`);
}

console.log("Standings E2E passed");

await Match.deleteMany({ tournament: tournament._id });
await Team.deleteMany({ _id: { $in: [teamA._id, teamB._id] } });
await Tournament.deleteOne({ _id: tournament._id });
await mongoose.disconnect();
