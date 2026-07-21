/**
 * Production-safe CORS origin check.
 * Allows CLIENT_URL, Vercel production/preview URLs, and private LAN in development.
 */
export function createCorsOriginChecker() {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const isProduction = process.env.NODE_ENV === "production";

  const extraOrigins = (process.env.ADDITIONAL_CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`.replace(/\/$/, "")
    : null;

  const allowed = new Set([clientUrl, ...extraOrigins]);
  if (vercelUrl) allowed.add(vercelUrl);

  const PRIVATE_LAN =
    /^(localhost|127\.0\.0\.1|\[::1\]|::1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

  const parseOrigin = (origin) => {
    try {
      return new URL(origin);
    } catch {
      return null;
    }
  };

  const isPrivateLanHostname = (hostname) => PRIVATE_LAN.test(hostname);

  const isVercelAppHost = (hostname) =>
    hostname === "vercel.app" || hostname.endsWith(".vercel.app");

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalized = origin.replace(/\/$/, "");
    if (allowed.has(normalized)) {
      callback(null, true);
      return;
    }

    const parsed = parseOrigin(origin);
    if (parsed && isVercelAppHost(parsed.hostname)) {
      callback(null, true);
      return;
    }

    if (!isProduction && parsed && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
      if (isPrivateLanHostname(parsed.hostname)) {
        callback(null, true);
        return;
      }
    }

    callback(null, false);
  };
}
