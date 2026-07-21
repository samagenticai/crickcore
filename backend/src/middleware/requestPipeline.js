import { ensureDatabaseReady } from "../bootstrap.js";

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
  ensureDatabaseReady()
    .then(() => next())
    .catch((err) => {
      console.error("[DB middleware] ensureDatabaseReady failed:", err.message);
      next(err);
    });
}
