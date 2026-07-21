/** Logs requests that exceed the slow threshold (default 2s). */
export function requestTiming(options = {}) {
  const slowMs = options.slowMs ?? 2000;

  return (req, res, next) => {
    const started = process.hrtime.bigint();

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
      const tag = `${req.method} ${req.originalUrl}`;

      if (durationMs >= slowMs) {
        console.warn(`[SLOW ${durationMs.toFixed(0)}ms] ${tag} → ${res.statusCode}`);
      } else if (process.env.REQUEST_TIMING === "verbose") {
        console.log(`[${durationMs.toFixed(0)}ms] ${tag} → ${res.statusCode}`);
      }
    });

    next();
  };
}
