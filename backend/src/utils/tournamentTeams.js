import Tournament from "../models/Tournament.js";

/** Keep tournament.teams and Team.tournament in sync (both directions). */
export const ensureTournamentTeamLinks = async (tournamentId, { Team, Match }) => {
  const tournament = await Tournament.findById(tournamentId).select("teams");
  if (!tournament) return [];

  const refIds = (tournament.teams || []).map((t) => String(t._id || t));

  if (refIds.length > 0) {
    await Team.updateMany(
      { _id: { $in: refIds } },
      { $set: { tournament: tournamentId } }
    );
  }

  const matchTeamIds = await Match.distinct("teamA", { tournament: tournamentId });
  const matchTeamBIds = await Match.distinct("teamB", { tournament: tournamentId });
  const fromMatches = [...matchTeamIds, ...matchTeamBIds]
    .filter(Boolean)
    .map(String);

  const linkedTeams = await Team.find({ tournament: tournamentId }).select("_id");
  const allIds = [...new Set([...refIds, ...fromMatches, ...linkedTeams.map((t) => String(t._id))])];

  if (allIds.length > 0) {
    await Team.updateMany({ _id: { $in: allIds } }, { $set: { tournament: tournamentId } });
    await Tournament.findByIdAndUpdate(tournamentId, { teams: allIds });
  }

  return allIds;
};

export const loadTournamentTeams = async (tournamentId, models) => {
  await ensureTournamentTeamLinks(tournamentId, models);
  return models.Team.find({ tournament: tournamentId })
    .select("name logo city captain createdAt stats")
    .sort({ name: 1 });
};
