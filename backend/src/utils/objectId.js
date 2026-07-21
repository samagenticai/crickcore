import mongoose from "mongoose";
import { ApiError } from "./helpers.js";

/** True only for non-empty, 24-hex ObjectId strings or ObjectId instances. */
export function isValidObjectId(value) {
  if (value == null || value === "") return false;
  if (value instanceof mongoose.Types.ObjectId) return true;
  if (typeof value === "object" && value._id != null) {
    return isValidObjectId(value._id);
  }
  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") return false;
  // Reject 12-char strings that mongoose.isValid incorrectly accepts
  if (!/^[a-fA-F0-9]{24}$/.test(str)) return false;
  return mongoose.Types.ObjectId.isValid(str);
}

/**
 * Convert empty / invalid ids to null so Mongoose never casts "".
 * Use for optional ref fields (venue, team, etc.).
 */
export function toObjectIdOrNull(value) {
  if (value == null || value === "") return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "object" && value._id != null) return toObjectIdOrNull(value._id);
  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") return null;
  if (!isValidObjectId(str)) return null;
  return str;
}

/**
 * Require a valid ObjectId for route params / required refs.
 * Throws ApiError(400) instead of letting Mongoose raise CastError.
 */
export function assertObjectId(value, fieldName = "id") {
  const id = toObjectIdOrNull(value);
  if (!id) {
    throw new ApiError(400, `Invalid ${fieldName}. A valid id is required.`);
  }
  return id;
}

/** Schema setter: empty string → null for ObjectId refs. */
export function objectIdSetter(value) {
  return toObjectIdOrNull(value);
}

/**
 * Fix legacy documents that stored "" in ObjectId ref fields.
 * Uses the native collection driver so Mongoose does not CastError on the filter.
 * Safe to call repeatedly.
 */
export async function scrubEmptyObjectIdRefs(Model, fields = []) {
  await Promise.all(
    fields.map((field) =>
      Model.collection.updateMany({ [field]: "" }, { $set: { [field]: null } })
    )
  );
}
