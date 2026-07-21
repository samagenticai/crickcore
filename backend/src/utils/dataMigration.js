import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Match from "../models/Match.js";
import { rebuildTournamentStandings } from "../services/pointsTableService.js";
import { ensureTournamentTeamLinks } from "./tournamentTeams.js";

/** Sync tournament.teams array from Team.tournament refs and tournament.teams back-links. */
export const syncTournamentTeamRefs = async (tournamentId) => {
  const ids = await ensureTournamentTeamLinks(tournamentId, { Team, Match });
  return ids.length;
};

/** Infer toss from first-innings batting when legacy matches lack toss data. */
export const backfillMissingToss = async (tournamentId) => {
  const matches = await Match.find({
    tournament: tournamentId,
    tossWinner: null,
    status: { $in: ["Live", "Completed"] },
    "liveScore.isInitialized": true,
  });

  let updated = 0;
  for (const match of matches) {
    const ls = match.liveScore || {};
    const firstBat =
      ls.firstInnings?.battingTeam ||
      (ls.inningsNumber === 1 ? ls.battingTeam : null);

    if (!firstBat) continue;

    match.tossWinner = firstBat;
    match.tossDecision = "Bat";
    await match.save();
    updated += 1;
  }
  return updated;
};

export const migrateTournamentData = async (tournamentId) => {
  await syncTournamentTeamRefs(tournamentId);
  await backfillMissingToss(tournamentId);
  await rebuildTournamentStandings(tournamentId, { Team, Match });
};

export const migrateAllTournaments = async () => {
  const tournaments = await Tournament.find({ isDeleted: false }).select("_id tournamentName");
  let syncedTeams = 0;
  let tossBackfilled = 0;
  let standingsRecalculated = 0;

  for (const tournament of tournaments) {
    syncedTeams += await syncTournamentTeamRefs(tournament._id);
    tossBackfilled += await backfillMissingToss(tournament._id);
    await rebuildTournamentStandings(tournament._id, { Team, Match });
    standingsRecalculated += 1;
  }

  return { tournaments: tournaments.length, syncedTeams, tossBackfilled, standingsRecalculated };
};
