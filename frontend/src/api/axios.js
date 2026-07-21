import axios from "axios";
import { resolveApiBaseUrl } from "../config/apiBaseUrl.js";

const apiBaseUrl = resolveApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const isFormData = (data) => typeof FormData !== "undefined" && data instanceof FormData;

api.interceptors.request.use((config) => {
  if (isFormData(config.data)) {
    const headers = config.headers;
    if (headers && typeof headers.delete === "function") {
      headers.delete("Content-Type");
      headers.delete("content-type");
    } else if (headers) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
  } else {
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "application/json",
    };
  }
  return config;
});

const getErrorMessage = (error) => {
  if (!error.response) {
    const target = apiBaseUrl;

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return `Request timed out (15s) reaching ${target}. The server may be unreachable, slow, or blocked by the network.`;
    }

    if (error.message?.includes("ERR_CONNECTION_REFUSED")) {
      return `Connection refused at ${target}. The backend is not accepting connections on that address/port.`;
    }

    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        return "You appear to be offline. Check your Wi‑Fi or mobile data connection.";
      }
      return `Network error: cannot reach ${target}. On a phone, ensure you opened the app via your computer's LAN IP (not localhost) and that both devices are on the same Wi‑Fi.`;
    }

    return error.message || "Network error. Please check your connection and try again.";
  }

  const backendMessage = error.response?.data?.message;
  if (backendMessage) return backendMessage;

  const method = error.config?.method?.toUpperCase() || "GET";
  const url = error.config?.url || "";
  if (error.response.status === 404) {
    return `Route not found: ${method} ${url}`.trim();
  }

  if (error.response.status === 403) {
    return "Access denied. Your session may have expired — try signing in again.";
  }

  if (error.response.status === 503) {
    return backendMessage || "Database temporarily unavailable. Please try again in a moment.";
  }

  return error.message || "Something went wrong";
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = getErrorMessage(error);
    const errors = error.response?.data?.errors || [];
    return Promise.reject({
      message,
      errors,
      status: error.response?.status,
      code: error.code,
      canceled: error.code === "ERR_CANCELED",
    });
  }
);

export default api;
