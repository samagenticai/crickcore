import api from "./axios";

export const scoringAPI = {
  getLiveMatches: () => api.get("/scoring/live-matches"),
  getMatchScore: (matchId) => api.get(`/scoring/matches/${matchId}`),
  initScoring: (matchId, payload) => api.post(`/scoring/matches/${matchId}/init`, payload),
  endInnings: (matchId) => api.post(`/scoring/matches/${matchId}/end-innings`),
  recordBall: (matchId, payload) => api.post(`/scoring/matches/${matchId}/ball`, payload),
  updateBowler: (matchId, bowlerId) => api.patch(`/scoring/matches/${matchId}/bowler`, { bowlerId }),
};
