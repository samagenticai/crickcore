import api from "./axios";

export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getReports: () => api.get("/admin/reports"),

  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  getTournaments: (params) => api.get("/admin/tournaments", { params }),
  getTournament: (id) => api.get(`/admin/tournaments/${id}`),
  updateTournament: (id, data) => api.put(`/admin/tournaments/${id}`, data),
  deleteTournament: (id) => api.delete(`/admin/tournaments/${id}`),

  getTeams: (params) => api.get("/admin/teams", { params }),
  getTeam: (id) => api.get(`/admin/teams/${id}`),
  createTeam: (formData) => api.post("/admin/teams", formData),
  updateTeam: (id, formData) => api.put(`/admin/teams/${id}`, formData),
  deleteTeam: (id) => api.delete(`/admin/teams/${id}`),

  getPlayers: (params) => api.get("/admin/players", { params }),
  getPlayer: (id) => api.get(`/admin/players/${id}`),
  createPlayer: (formData) => api.post("/admin/players", formData),
  updatePlayer: (id, formData) => api.put(`/admin/players/${id}`, formData),
  deletePlayer: (id) => api.delete(`/admin/players/${id}`),

  getMatches: (params) => api.get("/admin/matches", { params }),
  getMatch: (id) => api.get(`/admin/matches/${id}`),
  updateMatch: (id, data) => api.put(`/admin/matches/${id}`, data),
  deleteMatch: (id) => api.delete(`/admin/matches/${id}`),

  getVenues: (params) => api.get("/admin/venues", { params }),
  deleteVenue: (id) => api.delete(`/admin/venues/${id}`),

  getUmpires: (params) => api.get("/admin/umpires", { params }),
  deleteUmpire: (id) => api.delete(`/admin/umpires/${id}`),

  getScorers: (params) => api.get("/admin/scorers", { params }),
  updateScorer: (id, data) => api.put(`/admin/scorers/${id}`, data),
  deleteScorer: (id) => api.delete(`/admin/scorers/${id}`),

  getSponsors: (params) => api.get("/admin/sponsors", { params }),
  updateSponsor: (id, data) => api.put(`/admin/sponsors/${id}`, data),
  deleteSponsor: (id) => api.delete(`/admin/sponsors/${id}`),

  getPayments: (params) => api.get("/admin/payments", { params }),
};
