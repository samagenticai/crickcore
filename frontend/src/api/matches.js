import api from "./axios";

export const matchesAPI = {
  getSummary: (matchId) => api.get(`/matches/${matchId}/summary`),
};
