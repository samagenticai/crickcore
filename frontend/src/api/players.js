import api from "./axios";

export const playerAPI = {
  getAll: (params) => api.get("/players", { params }),
  getOne: (id) => api.get(`/players/${id}`),
  create: (formData) => api.post("/players", formData),
  update: (id, data) => api.put(`/players/${id}`, data),
  remove: (id) => api.delete(`/players/${id}`),
};
