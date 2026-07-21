import { ApiError } from "../utils/helpers.js";
import multer from "multer";

function summarizeFile(file) {
  if (!file) return null;
  return {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    filename: file.filename,
  };
}

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = Array.isArray(err.errors) ? err.errors : [];

  // ── Full diagnostic dump (avatar / profile uploads) ─────────────────────
  console.error("\n========== REQUEST ERROR DUMP ==========");
  console.error("path:", req.method, req.originalUrl);
  console.error("err.message:", err.message);
  console.error("err.name:", err.name);
  console.error("err.code:", err.code);
  console.error("err.errors:", err.errors);
  console.error("err.stack:", err.stack);
  console.error("req.body:", req.body);
  console.error("req.file:", summarizeFile(req.file));
  console.error("req.files:", req.files);
  console.error("content-type:", req.headers["content-type"]);
  console.error("========================================\n");

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    errors = [{ field, message }];
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image must be 5 MB or smaller.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected upload field "${err.field}". Use field name "avatar".`;
    } else {
      message = `Multer error (${err.code}): ${err.message}`;
    }
    errors = [{ field: err.field || "avatar", message, code: err.code }];
  }

  // Mongoose document validation — return the EXACT failing field(s)
  if (err.name === "ValidationError") {
    statusCode = 400;
    const fieldErrors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
      kind: e.kind,
    }));
    errors = fieldErrors;
    message =
      fieldErrors.map((e) => `${e.field}: ${e.message}`).join(" | ") ||
      err.message ||
      "Document validation failed";
  }

  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongoServerSelectionError" ||
    err.name === "MongoTimeoutError" ||
    err.message?.includes("timed out after") ||
    err.code === "ECONNRESET"
  ) {
    statusCode = 503;
    message = "Database temporarily unavailable. Please try again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    debug:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            name: err.name,
            code: err.code,
            hasFile: Boolean(req.file),
            fileField: req.file?.fieldname || null,
            contentType: req.headers["content-type"] || null,
          },
  });
};

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};
