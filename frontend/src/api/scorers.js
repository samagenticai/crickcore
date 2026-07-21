import api from "./axios";

export const scorerAPI = {
  getAll: (params) => api.get("/scorers", { params }),
  getOne: (id) => api.get(`/scorers/${id}`),
  create: (data) => {
    if (data instanceof FormData) return api.post("/scorers", data);
    return api.post("/scorers", data);
  },
  update: (id, data) => {
    if (data instanceof FormData) return api.put(`/scorers/${id}`, data);
    return api.put(`/scorers/${id}`, data);
  },
  remove: (id) => api.delete(`/scorers/${id}`),
};
