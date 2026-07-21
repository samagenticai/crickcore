import { ensureDatabaseReady } from "../bootstrap.js";

const DB_ATTACH_MS = 12_000;
const TRACE = process.env.REQUEST_TRACE !== "0";

/** Logs before/after each named pipeline stage (set REQUEST_TRACE=0 to disable). */
export function traceStep(name) {
  return (req, res, next) => {
    if (!TRACE) return next();

    const tag = `[TRACE ${name}]`;
    const started = Date.now();
    console.log(`${tag} -> ${req.method} ${req.originalUrl}`);

    res.on("finish", () => {
      console.log(`${tag} <- ${res.statusCode} ${Date.now() - started}ms`);
    });

    next();
  };
}

/** Logs each request stage so hangs can be traced in Vercel/local logs. */
export function requestPipelineLogger() {
  return (req, res, next) => {
    const started = Date.now();
    const tag = `[REQ ${req.method} ${req.originalUrl}]`;

    console.log(`${tag} start`);

    res.on("finish", () => {
      console.log(`${tag} done ${res.statusCode} in ${Date.now() - started}ms`);
    });

    res.on("close", () => {
      if (!res.writableEnded) {
        console.warn(`${tag} closed without response after ${Date.now() - started}ms`);
      }
    });

    next();
  };
}

/** Ensures MongoDB is connected before route handlers run (cached per process). */
export function attachDatabase(req, res, next) {
  // /api/health is registered above the middleware stack; skip if it reaches here.
  if (req.path === "/health" || req.originalUrl === "/api/health") {
    return next();
  }

  let settled = false;
  console.log(`[DB middleware] attach start ${req.method} ${req.originalUrl}`);

  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    const msg = `Database connection timed out after ${DB_ATTACH_MS}ms`;
    console.error(`[DB middleware] ${msg} (${req.method} ${req.originalUrl})`);
    next(new Error(msg));
  }, DB_ATTACH_MS);

  ensureDatabaseReady()
    .then(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.log(`[DB middleware] attach ok ${req.method} ${req.originalUrl}`);
      next();
    })
    .catch((err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.error("[DB middleware] ensureDatabaseReady failed:", err.message);
      next(err);
    });
}
