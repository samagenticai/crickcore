import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Match from "../models/Match.js";
import Ball from "../models/Ball.js";
import Venue from "../models/Venue.js";
import Umpire from "../models/Umpire.js";
import Scorer from "../models/Scorer.js";
import Sponsor from "../models/Sponsor.js";
import Payment from "../models/Payment.js";
import Settings from "../models/Settings.js";
import FreeTrial from "../models/FreeTrial.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "./helpers.js";

/**
 * Cascade-delete a tournament and all related scoring/fixture data.
 * Admin version — not scoped to createdBy.
 */
export async function cascadeDeleteTournament(tournamentId, session = null) {
  const opts = session ? { session } : {};
  const teams = await Team.find({ tournament: tournamentId }).select("_id").session(session || null);
  const teamIds = teams.map((t) => t._id);
  const matches = await Match.find({ tournament: tournamentId }).select("_id").session(session || null);
  const matchIds = matches.map((m) => m._id);

  await Ball.deleteMany({ tournament: tournamentId }, opts);
  if (matchIds.length) await Ball.deleteMany({ match: { $in: matchIds } }, opts);
  await Match.deleteMany({ tournament: tournamentId }, opts);
  if (teamIds.length) await Player.deleteMany({ team: { $in: teamIds } }, opts);
  await Player.deleteMany({ tournament: tournamentId }, opts);
  await Team.deleteMany({ tournament: tournamentId }, opts);
  await Tournament.deleteOne({ _id: tournamentId }, opts);
}

/**
 * Cascade-delete everything owned by a user (organizer teardown).
 * Never deletes admin accounts via this helper.
 */
export async function cascadeDeleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === ROLES.ADMIN) {
    throw new ApiError(403, "Admin accounts cannot be deleted from this endpoint.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tournaments = await Tournament.find({ createdBy: userId }).select("_id").session(session);
    for (const t of tournaments) {
      await cascadeDeleteTournament(t._id, session);
    }

    // Orphan cleanup for resources not tied to a remaining tournament
    await Promise.all([
      Team.deleteMany({ createdBy: userId }).session(session),
      Player.deleteMany({ createdBy: userId }).session(session),
      Venue.deleteMany({ organizerId: userId }).session(session),
      Umpire.deleteMany({ organizerId: userId }).session(session),
      Scorer.deleteMany({ organizerId: userId }).session(session),
      Sponsor.deleteMany({ organizerId: userId }).session(session),
      Match.deleteMany({ createdBy: userId }).session(session),
      Ball.deleteMany({ createdBy: userId }).session(session),
      Settings.deleteMany({ user: userId }).session(session),
      Notification.deleteMany({ user: userId }).session(session),
      FreeTrial.deleteMany({
        $or: [{ user: userId }, { email: user.email }],
      }).session(session),
      Payment.updateMany({ user: userId }, { $set: { user: null } }).session(session),
    ]);

    await User.deleteOne({ _id: userId }).session(session);
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function cascadeDeleteTeam(teamId) {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, "Team not found");

  await Player.deleteMany({ team: teamId });
  await Match.updateMany({ teamA: teamId }, { $set: { teamA: null } });
  await Match.updateMany({ teamB: teamId }, { $set: { teamB: null } });
  await Match.updateMany({ winner: teamId }, { $set: { winner: null } });

  if (team.tournament) {
    await Tournament.updateOne({ _id: team.tournament }, { $pull: { teams: teamId } });
  }

  await Team.deleteOne({ _id: teamId });
}

export async function cascadeDeleteMatch(matchId) {
  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  const tournamentId = match.tournament;
  await Ball.deleteMany({ match: matchId });
  await Match.deleteOne({ _id: matchId });

  if (tournamentId) {
    const { recalculateTournamentStandings } = await import("../services/pointsTableService.js");
    await recalculateTournamentStandings(tournamentId);
  }
}

export async function cascadeDeletePlayer(playerId) {
  const player = await Player.findById(playerId);
  if (!player) throw new ApiError(404, "Player not found");
  await Player.deleteOne({ _id: playerId });
}
