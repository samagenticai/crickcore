import api from "./axios";
import { fetchWithRetry } from "./fetchWithRetry";
import { normalizeTournament, normalizeTournamentList } from "../utils/tournamentNormalize";

export const tournamentAPI = {
  getStats: () => fetchWithRetry(() => api.get("/tournaments/stats")),

  getTournamentStats: () => fetchWithRetry(() => api.get("/tournaments/tournament-stats")),

  getAll: (params = {}) => {
    const { signal, ...query } = params;
    return fetchWithRetry(() => api.get("/tournaments", { params: query, signal }));
  },

  getViewer: (params) => api.get("/tournaments/viewer", { params }),

  getOne: (id) => fetchWithRetry(() => api.get(`/tournaments/${id}`)),

  create: (formData) => api.post("/tournaments", formData),

  update: (id, formData) => api.put(`/tournaments/${id}`, formData),

  softDelete: (id) => api.delete(`/tournaments/${id}`),

  restore: (id) => api.patch(`/tournaments/${id}/restore`),

  permanentDelete: (id) => api.delete(`/tournaments/${id}/permanent`),

  duplicate: (id) => api.post(`/tournaments/${id}/duplicate`),

  archive: (id) => api.patch(`/tournaments/${id}/archive`),

  publish: (id) => api.patch(`/tournaments/${id}/publish`),

  getTournamentTeams: (id) => api.get(`/tournaments/${id}/teams`),

  getStandings: (id) => api.get(`/tournaments/${id}/standings`),

  addTeamsToTournament: (id, teamIds) => api.post(`/tournaments/${id}/teams`, { teamIds }),

  removeTeamFromTournament: (id, teamId) => api.delete(`/tournaments/${id}/teams/${teamId}`),

  generateFixtures: (id, options) => api.post(`/tournaments/${id}/generate-fixtures`, options || {}),

  getTournamentFixtures: (id) => api.get(`/tournaments/${id}/fixtures`),

  startMatch: (id, matchId, payload) =>
    api.patch(`/tournaments/${id}/fixtures/${matchId}/start`, payload),

  recordMatchResult: (id, matchId, winner) =>
    api.patch(`/tournaments/${id}/fixtures/${matchId}/result`, { winner }),
};

/** Parse list response — use after getAll or in hooks. */
export function parseTournamentListResponse(data) {
  return normalizeTournamentList(data?.data);
}

/** Parse single tournament — use after getOne/create/update. */
export function parseTournamentResponse(data) {
  return normalizeTournament(data?.data);
}
