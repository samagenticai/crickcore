import { validationResult } from "express-validator";
import { ApiError } from "../utils/helpers.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    const firstMessage = formatted[0]?.message || "Validation failed";
    throw new ApiError(400, firstMessage, formatted);
  }
  next();
};
