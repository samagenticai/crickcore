import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import {
  PUBLIC_REGISTER_ROLES,
  ROLES,
  getLoginRedirect,
  isAdminRole,
  normalizeRole,
} from "../constants/roles.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import {
  extractToken,
  generateToken,
  sendTokenCookie,
  clearTokenCookie,
} from "../utils/token.js";
import { resolveUpload } from "../middleware/upload.js";
import {
  assertSessionClaimable,
  claimCheckoutSessionForUser,
} from "../utils/claimCheckoutSession.js";
import { isStripeConfigured } from "../utils/stripe.js";
import { isProActive, getRemainingDays, syncSubscriptionExpiry } from "../utils/subscription.js";

const sanitizeUser = (user) => {
  const proActive = isProActive(user);
  const plan = proActive ? user.subscriptionPlan || "pro" : "free";
  const status = proActive ? user.subscriptionStatus || "active" : "none";

  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profilePicture: user.profilePicture,
    avatar: user.profilePicture || "",
    role: normalizeRole(user.role),
    status: user.isActive ? "active" : "inactive",
    isActive: user.isActive,
    country: user.country,
    city: user.city,
    createdAt: user.createdAt,
    subscriptionPlan: plan,
    subscriptionStatus: status,
    subscriptionStartDate: user.subscriptionStartDate || null,
    subscriptionEndDate: user.subscriptionEndDate || null,
    subscriptionUpdatedAt: user.subscriptionUpdatedAt || null,
    subscription: {
      plan: proActive ? String(plan).charAt(0).toUpperCase() + String(plan).slice(1) : "Free",
      status,
      startDate: user.subscriptionStartDate || null,
      endDate: user.subscriptionEndDate || null,
      remainingDays: proActive ? getRemainingDays(user.subscriptionEndDate) : 0,
    },
  };
};

export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    username,
    email,
    phone,
    password,
    role,
    country,
    city,
    stripeSessionId,
  } = req.body;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new ApiError(409, "Email already registered");

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) throw new ApiError(409, "Phone number already registered");

  if (username) {
    const existingUsername = await User.findOne({ username });
    if (existingUsername) throw new ApiError(409, "Username already taken");
  }

  const requestedRole = normalizeRole(role);
  if (requestedRole === ROLES.ADMIN) {
    throw new ApiError(403, "Admin accounts cannot be created through registration.");
  }

  const assignedRole = PUBLIC_REGISTER_ROLES.includes(requestedRole)
    ? requestedRole
    : ROLES.ORGANIZER;

  const checkoutSessionId = String(stripeSessionId || req.body.session_id || "").trim();

  // Validate paid Pro session before creating the account (Pro onboarding flow)
  if (checkoutSessionId) {
    if (!isStripeConfigured()) {
      throw new ApiError(503, "Payments are not configured.");
    }
    await assertSessionClaimable(checkoutSessionId, email);
  }

  let profilePicture = "";
  if (req.file) profilePicture = await resolveUpload(req.file, "profiles/avatars");

  const user = await User.create({
    fullName,
    username: username || undefined,
    email,
    phone,
    password,
    role: assignedRole,
    country: country || "",
    city: city || "",
    profilePicture,
    subscriptionPlan: "free",
    subscriptionStatus: "none",
  });

  if (checkoutSessionId) {
    await claimCheckoutSessionForUser(user, checkoutSessionId);
  }

  await Settings.create({ user: user._id });

  const fresh = await User.findById(user._id);
  const isPro =
    fresh.subscriptionPlan === "pro" && fresh.subscriptionStatus === "active";

  res.status(201).json({
    success: true,
    message: isPro
      ? "Registration successful! Your Pro plan is active. Please login."
      : "Registration successful! Please login.",
    data: sanitizeUser(fresh),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email/phone or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  await syncSubscriptionExpiry(user);

  let token;

  if (isAdminRole(user.role)) {
    const adminUser = await User.findById(user._id).select("+adminSessionId");
    const rejectExisting =
      process.env.ADMIN_SESSION_POLICY === "reject" && Boolean(adminUser.adminSessionId);

    if (rejectExisting) {
      throw new ApiError(403, "Admin is already logged in on another device.");
    }

    const newSessionId = crypto.randomUUID();
    adminUser.adminSessionId = newSessionId;
    await adminUser.save({ validateBeforeSave: false });
    token = generateToken(user._id, { adminSessionId: newSessionId });
  } else {
    token = generateToken(user._id, { sessionVersion: user.sessionVersion ?? 0 });
  }

  sendTokenCookie(res, token);

  res.json({
    success: true,
    message: "Welcome back!",
    redirectTo: getLoginRedirect(user.role),
    data: sanitizeUser(user),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("+adminSessionId");
      if (isAdminRole(user?.role) && user.adminSessionId) {
        user.adminSessionId = "";
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      /* cookie cleared regardless */
    }
  }

  clearTokenCookie(res);
  res.json({ success: true, message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await syncSubscriptionExpiry(req.user);
  res.json({ success: true, data: sanitizeUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["fullName", "username", "country", "city", "phone"];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (req.file) updates.profilePicture = await resolveUpload(req.file, "profiles/avatars");

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: sanitizeUser(user) });
});
