import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { normalizeRole } from "../constants/roles.js";
import { serializeProfile } from "../utils/profileSerializer.js";
import { cascadeDeleteUser } from "../utils/adminCascade.js";
import { clearTokenCookie } from "../utils/token.js";
import { syncSubscriptionExpiry } from "../utils/subscription.js";

const getOrCreateSettings = async (userId) => {
  let settings = await Settings.findOne({ user: userId });
  if (!settings) settings = await Settings.create({ user: userId });
  return settings;
};

const loadSettingsPayload = async (userId, req) => {
  let user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  user = await syncSubscriptionExpiry(user);
  const settings = await getOrCreateSettings(userId);
  return serializeProfile(user, settings, req);
};

export const getSettings = asyncHandler(async (req, res) => {
  const data = await loadSettingsPayload(req.user._id, req);
  res.json({ success: true, data });
});

/** Change password — mounted at PUT /api/settings/security */
export const updateSettingsSecurity = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }
  if (confirmPassword != null && confirmPassword !== newPassword) {
    throw new ApiError(400, "Password confirmation does not match");
  }
  if (String(newPassword).length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new ApiError(400, "New password must include an uppercase letter");
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new ApiError(400, "New password must include a lowercase letter");
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new ApiError(400, "New password must include a number");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  user.role = normalizeRole(user.role);
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  clearTokenCookie(res);

  res.json({
    success: true,
    message: "Password changed successfully. Please sign in again.",
    requiresReLogin: true,
  });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  user.role = normalizeRole(user.role);
  await user.save({ validateBeforeSave: false });

  clearTokenCookie(res);

  res.json({
    success: true,
    message: "Signed out from all devices. Please sign in again.",
    requiresReLogin: true,
  });
});

export const deleteSettingsAccount = asyncHandler(async (req, res) => {
  const { password, confirmText } = req.body;
  if (!password) throw new ApiError(400, "Password is required to delete your account");
  if (confirmText && String(confirmText).trim().toUpperCase() !== "DELETE") {
    throw new ApiError(400, "Type DELETE to confirm account deletion");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const valid = await user.comparePassword(password);
  if (!valid) throw new ApiError(401, "Password is incorrect");

  await cascadeDeleteUser(user._id);
  clearTokenCookie(res);

  res.json({ success: true, message: "Account deleted successfully" });
});
