import { normalizeRole } from "../constants/roles.js";
import { isProActive, getRemainingDays } from "./subscription.js";

const planLabel = (plan) => {
  const value = String(plan || "free");
  if (value === "starter") return "Free";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const accountTypeFromUser = (user) => (isProActive(user) ? "Pro" : "Free");

export const serializeProfile = (user, settings, req = null) => {
  const role = normalizeRole(user.role);
  const plan = user.subscriptionPlan || "free";
  const proActive = isProActive(user);
  const userAgent = req?.headers?.["user-agent"] || "";

  const avatar = user.profilePicture || "";
  const status = user.isActive ? "Active" : "Inactive";

  return {
    _id: user._id,
    id: user._id,
    accountId: user._id,
    fullName: user.fullName,
    username: user.username || "",
    email: user.email,
    phone: user.phone,
    avatar,
    profilePicture: avatar,
    role,
    roleLabel: role.charAt(0).toUpperCase() + role.slice(1),
    accountType: accountTypeFromUser(user),
    accountStatus: status,
    status,
    isActive: user.isActive,
    memberSince: user.createdAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null,
    country: user.country || "",
    city: user.city || "",
    organizationName: user.organizationName || "",
    bio: user.bio || "",
    address: user.address || "",
    timezone: user.timezone || "",
    subscriptionPlan: proActive ? plan : "free",
    subscriptionStatus: proActive ? user.subscriptionStatus || "active" : "none",
    subscriptionStartDate: user.subscriptionStartDate || null,
    subscriptionEndDate: user.subscriptionEndDate || null,
    stripeCustomerId: user.stripeCustomerId || "",
    subscriptionUpdatedAt: user.subscriptionUpdatedAt || null,
    subscription: {
      plan: proActive ? planLabel(plan) : "Free",
      status: proActive ? user.subscriptionStatus || "active" : "none",
      startDate: user.subscriptionStartDate || null,
      endDate: user.subscriptionEndDate || null,
      remainingDays: proActive ? getRemainingDays(user.subscriptionEndDate) : 0,
      updatedAt: user.subscriptionUpdatedAt || null,
    },
    connectedAccounts: {
      stripe: Boolean(user.stripeCustomerId),
      stripeStatus: user.stripeCustomerId
        ? user.subscriptionStatus === "active"
          ? "Connected"
          : "Linked"
        : "Not connected",
      emailVerified: true,
    },
    verification: {
      email: true,
      phone: false,
    },
    preferences: {
      theme: "light",
      language: settings?.language || "en",
      timeFormat: settings?.timeFormat || "12h",
      dateFormat: settings?.dateFormat || "MDY",
      timezone: settings?.timezone || user.timezone || "Asia/Karachi",
      emailNotifications: settings?.emailNotifications ?? true,
      pushNotifications: settings?.pushNotifications ?? true,
    },
    security: {
      currentDevice: parseDeviceLabel(userAgent),
      lastLoginAt: user.lastLoginAt || null,
      activeSession: true,
    },
  };
};

function parseDeviceLabel(userAgent) {
  if (!userAgent) return "Unknown device";
  if (/mobile/i.test(userAgent)) return "Mobile browser";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Web browser";
}
