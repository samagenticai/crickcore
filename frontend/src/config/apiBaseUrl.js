const DEFAULT_API_PATH = "/api";

function isLoopbackHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

/**
 * Resolves the API base URL for the current runtime environment.
 *
 * - Relative "/api" uses the Vite dev proxy (works on mobile when dev server uses --host).
 * - Absolute localhost URLs are rewritten to the browser hostname on LAN devices.
 * - Production absolute URLs are used unchanged.
 */
export function resolveApiBaseUrl() {
  const configured = (import.meta.env.VITE_API_URL || DEFAULT_API_PATH).trim();

  if (configured.startsWith("/")) {
    return configured.replace(/\/+$/, "") || DEFAULT_API_PATH;
  }

  try {
    const url = new URL(configured);

    if (typeof window !== "undefined" && isLoopbackHost(url.hostname)) {
      const browserHost = window.location.hostname;
      if (!isLoopbackHost(browserHost)) {
        url.hostname = browserHost;
      }
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_API_PATH;
  }
}

/** Backend origin for static uploads (e.g. /uploads/...). Empty when using same-origin proxy. */
export function resolveBackendOrigin() {
  const base = resolveApiBaseUrl();
  if (base.startsWith("/")) return "";

  try {
    const url = new URL(base);
    if (url.pathname.endsWith("/api")) {
      url.pathname = url.pathname.slice(0, -4);
    }
    return url.origin;
  } catch {
    return "";
  }
}
