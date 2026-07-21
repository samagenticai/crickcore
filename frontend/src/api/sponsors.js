import api from "./axios";

export const sponsorAPI = {
  getAll: (params) => api.get("/sponsors", { params }),
  getOne: (id) => api.get(`/sponsors/${id}`),
  create: (data) => {
    if (data instanceof FormData) return api.post("/sponsors", data);
    return api.post("/sponsors", data);
  },
  update: (id, data) => {
    if (data instanceof FormData) return api.put(`/sponsors/${id}`, data);
    return api.put(`/sponsors/${id}`, data);
  },
  remove: (id) => api.delete(`/sponsors/${id}`),
};
