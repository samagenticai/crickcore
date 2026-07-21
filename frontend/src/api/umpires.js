import api from "./axios";

export const umpireAPI = {
  getAll: (params) => api.get("/umpires", { params }),
  getOne: (id) => api.get(`/umpires/${id}`),
  create: (data) => api.post("/umpires", data),
  update: (id, data) => api.put(`/umpires/${id}`, data),
  remove: (id) => api.delete(`/umpires/${id}`),
};
