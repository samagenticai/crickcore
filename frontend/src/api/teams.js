import api from "./axios";

export const teamAPI = {
  getAll: (params) => api.get("/teams", { params }),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (formData) => api.post("/teams", formData),
  update: (id, data) => api.put(`/teams/${id}`, data),
  remove: (id) => api.delete(`/teams/${id}`),
};
