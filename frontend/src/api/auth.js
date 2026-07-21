import api from "./axios";

export const authAPI = {
  register: (formData) => api.post("/auth/register", formData),

  login: (data) => api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get("/auth/me"),

  updateProfile: (formData) => api.put("/auth/profile", formData),
};
