import api from "./axios";

export const venueAPI = {
  getAll: (params) => api.get("/venues", { params }),
  getOne: (id) => api.get(`/venues/${id}`),
  create: (data) => api.post("/venues", data),
  update: (id, data) => api.put(`/venues/${id}`, data),
  remove: (id) => api.delete(`/venues/${id}`),
};
