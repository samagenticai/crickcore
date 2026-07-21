import api from "./axios";

export const settingsAPI = {
  get: () => api.get("/settings"),
  updateSecurity: (data) => api.put("/settings/security", data),
  logoutAllDevices: () => api.post("/settings/logout-all-devices"),
  deleteAccount: (data) => api.delete("/settings/account", { data }),
};
