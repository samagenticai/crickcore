export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  const label = fn.name || "anonymousHandler";
  const tag = `[CTRL ${label}]`;
  const started = Date.now();
  console.log(`${tag} -> ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(`${tag} <- ${res.statusCode} in ${Date.now() - started}ms`);
  });

  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`${tag} ERROR in ${Date.now() - started}ms:`, err.message);
    next(err);
  });
};
