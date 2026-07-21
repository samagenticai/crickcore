import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { isAdminRole, normalizeRole } from "../constants/roles.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";
import { serializeProfile } from "../utils/profileSerializer.js";
import { syncSubscriptionExpiry } from "../utils/subscription.js";
import { generateToken, sendTokenCookie } from "../utils/token.js";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../uploads");

const getOrCreateSettings = async (userId) => {
  let settings = await Settings.findOne({ user: userId });
  if (!settings) settings = await Settings.create({ user: userId });
  return settings;
};

const removeLocalAvatar = (profilePicture) => {
  if (!profilePicture || profilePicture.startsWith("http")) return;
  if (!profilePicture.startsWith("/uploads/")) return;
  const filename = path.basename(profilePicture);
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

/** Avoid document.save() validation on legacy Title-Case roles like "Organizer". */
const persistAvatar = async (userId, profilePicture) => {
  const existing = await User.findById(userId).select("role profilePicture");
  if (!existing) return null;

  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        profilePicture,
        // Normalize legacy "Organizer" / "Scorer" so future saves don't fail
        role: normalizeRole(existing.role),
      },
    },
    { new: true, runValidators: false }
  );
};

export const getProfile = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  user = await syncSubscriptionExpiry(user);
  const settings = await getOrCreateSettings(user._id);
  res.json({ success: true, data: serializeProfile(user, settings, req) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userFields = [
    "fullName",
    "phone",
    "country",
    "city",
    "address",
    "organizationName",
    "bio",
    "timezone",
    "email",
  ];
  const userUpdates = {};
  for (const key of userFields) {
    if (req.body[key] !== undefined) userUpdates[key] = req.body[key];
  }

  if (Object.keys(userUpdates).length) {
    if (userUpdates.email !== undefined) {
      const email = String(userUpdates.email).trim().toLowerCase();
      if (!email) throw new ApiError(400, "Email is required");
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) throw new ApiError(400, "Invalid email address");
      const existing = await User.findOne({
        email,
        _id: { $ne: req.user._id },
      });
      if (existing) throw new ApiError(409, "Email already in use");
      userUpdates.email = email;
    }
    if (userUpdates.phone) {
      const existing = await User.findOne({
        phone: userUpdates.phone,
        _id: { $ne: req.user._id },
      });
      if (existing) throw new ApiError(409, "Phone number already in use");
    }
    // Also normalize legacy Title-Case roles so profile saves never fail enum validation
    if (Object.keys(userUpdates).length) {
      userUpdates.role = normalizeRole(req.user.role);
    }
    await User.findByIdAndUpdate(req.user._id, userUpdates, {
      runValidators: false,
      new: true,
    });
  } else {
    // Still normalize role even when only preferences change
    await User.updateOne(
      { _id: req.user._id },
      { $set: { role: normalizeRole(req.user.role) } }
    );
  }

  const settingsFields = [
    "theme",
    "emailNotifications",
    "pushNotifications",
    "language",
    "timeFormat",
    "dateFormat",
    "timezone",
  ];
  const settingsUpdates = {};
  for (const key of settingsFields) {
    if (req.body[key] !== undefined) {
      settingsUpdates[key] = req.body[key];
    }
  }
  if (settingsUpdates.theme !== undefined) {
    settingsUpdates.theme = "light";
  }

  let settings = await getOrCreateSettings(req.user._id);
  if (Object.keys(settingsUpdates).length) {
    settings = await Settings.findOneAndUpdate({ user: req.user._id }, settingsUpdates, {
      new: true,
      runValidators: true,
    });
  }

  const user = await syncSubscriptionExpiry(await User.findById(req.user._id));
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: serializeProfile(user, settings, req),
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password +adminSessionId");
  if (!user) throw new ApiError(404, "User not found");

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  user.role = normalizeRole(user.role);

  if (isAdminRole(user.role)) {
    user.adminSessionId = crypto.randomUUID();
    await user.save();
    const token = generateToken(user._id, { adminSessionId: user.adminSessionId });
    sendTokenCookie(res, token);
  } else {
    await user.save();
  }

  res.json({ success: true, message: "Password changed successfully" });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      400,
      "Avatar image is required (req.file is undefined). Send multipart/form-data with field name \"avatar\"."
    );
  }

  const previous = await User.findById(req.user._id).select("profilePicture role");
  if (!previous) throw new ApiError(404, "User not found");

  if (previous.profilePicture) removeLocalAvatar(previous.profilePicture);

  const avatarUrl = await resolveUpload(req.file, "profiles/avatars");
  const user = await persistAvatar(req.user._id, avatarUrl);
  if (!user) throw new ApiError(404, "User not found");

  const settings = await getOrCreateSettings(user._id);
  res.json({
    success: true,
    message: "Profile photo updated",
    data: serializeProfile(user, settings, req),
  });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const previous = await User.findById(req.user._id).select("profilePicture role");
  if (!previous) throw new ApiError(404, "User not found");

  if (previous.profilePicture) removeLocalAvatar(previous.profilePicture);

  const user = await persistAvatar(req.user._id, "");
  if (!user) throw new ApiError(404, "User not found");

  const settings = await getOrCreateSettings(user._id);
  res.json({
    success: true,
    message: "Profile photo removed",
    data: serializeProfile(user, settings, req),
  });
});
