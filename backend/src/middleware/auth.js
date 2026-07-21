import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  ADMIN_ROLE,
  DASHBOARD_ROLES,
  normalizeRole,
  isAdminRole,
} from "../constants/roles.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { extractToken } from "../utils/token.js";

function assertAdminSession(user, decoded) {
  if (!isAdminRole(user.role)) return;

  if (!decoded.adminSessionId || !user.adminSessionId) {
    throw new ApiError(
      401,
      "Admin session expired or superseded by a newer login. Please sign in again."
    );
  }

  if (decoded.adminSessionId !== user.adminSessionId) {
    throw new ApiError(
      401,
      "Admin is already logged in on another device, or this session was replaced."
    );
  }
}

async function loadAuthenticatedUser(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token. Please login again.");
  }

  let user;
  try {
    user = await User.findById(decoded.id).select("+adminSessionId");
  } catch (err) {
    if (err.name === "MongoNetworkError" || err.code === "ECONNRESET") {
      throw new ApiError(503, "Database temporarily unavailable. Please try again.");
    }
    throw err;
  }

  if (!user || !user.isActive) {
    throw new ApiError(401, "User not found or deactivated.");
  }

  if (!isAdminRole(user.role)) {
    const tokenVersion = decoded.sessionVersion ?? 0;
    const currentVersion = user.sessionVersion ?? 0;
    if (tokenVersion !== currentVersion) {
      throw new ApiError(401, "Session expired. Please sign in again.");
    }
  }

  assertAdminSession(user, decoded);
  return user;
}

// Protect middleware: allows token via cookie or Authorization header (Bearer)
export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, "Not authorized. Please login.");
  }

  try {
    req.user = await loadAuthenticatedUser(token);
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (process.env.NODE_ENV !== "production") console.error("Auth verify error:", err);
    throw new ApiError(401, "Invalid or expired token. Please login again.");
  }
});

/** Attach req.user when a valid token is present; otherwise continue as guest. */
export const optionalProtect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = await loadAuthenticatedUser(token);
  } catch {
    /* guest checkout / verify */
  }

  next();
});

/** Restrict route to specific roles (always use after protect). */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    const userRole = normalizeRole(req.user?.role);
    const allowed = roles.map((role) => normalizeRole(role));

    if (!req.user || !allowed.includes(userRole)) {
      throw new ApiError(403, "You do not have permission to access this resource.");
    }
    next();
  };

export const adminOnly = authorize(ADMIN_ROLE);

/** Organizer dashboard + tournament management (organizer, scorer, admin) */
export const staffOrAdmin = authorize(ADMIN_ROLE, ...DASHBOARD_ROLES);

/** Organizer/scorer dashboard only — excludes admin and viewer */
export const organizerOnly = authorize(...DASHBOARD_ROLES);
