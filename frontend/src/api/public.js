import api from "./axios";

export const publicAPI = {
  getViewerTournaments: (params) => api.get("/tournaments/viewer", { params }),
  getTournament: (id) => api.get(`/public/tournaments/${id}`),
  getFixtures: (id) => api.get(`/public/tournaments/${id}/fixtures`),
  getMatch: (tournamentId, matchId) => api.get(`/public/tournaments/${tournamentId}/matches/${matchId}`),
  getMatchSummary: (tournamentId, matchId) =>
    api.get(`/public/tournaments/${tournamentId}/matches/${matchId}/summary`),
  getTeams: (id) => api.get(`/public/tournaments/${id}/teams`),
  getStandings: (id) => api.get(`/public/tournaments/${id}/standings`),
  getTeamSquad: (id, teamId) => api.get(`/public/tournaments/${id}/teams/${teamId}/squad`),
};
