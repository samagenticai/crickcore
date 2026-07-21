// Resolves an uploaded image path (e.g. "/uploads/logo.png") stored in the
// database into a URL the browser can actually load.
//
// - Same-origin dev setup (VITE_API_URL="/api"): returns the path unchanged so
//   the Vite proxy serves "/uploads/...".
// - Absolute API (e.g. VITE_API_URL="https://api.example.com/api"): prefixes the
//   backend origin so images resolve in production too.
// - Already-absolute or data URLs are returned as-is.

import { resolveBackendOrigin } from "../config/apiBaseUrl.js";

const backendOrigin = resolveBackendOrigin();

export function mediaUrl(path) {
  if (!path || typeof path !== "string") return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  return `${backendOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
}
