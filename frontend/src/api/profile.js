import api from "./axios";

export const profileAPI = {
  get: () => api.get("/profile"),
  update: (data) => api.put("/profile", data),
  changePassword: (data) => api.put("/profile/password", data),
  uploadAvatar: (formData) => api.post("/profile/avatar", formData),
  deleteAvatar: () => api.delete("/profile/avatar"),
};
