/**
 * Active Pro subscription — checks plan, status, and expiry date from the database.
 */
export function isProMember(user) {
  if (!user) return false;

  const plan = String(user.subscription?.plan || user.subscriptionPlan || "free").toLowerCase();
  const status = String(user.subscription?.status || user.subscriptionStatus || "none").toLowerCase();

  if (plan !== "pro" && plan !== "enterprise") return false;
  if (status !== "active") return false;

  const endDate = user.subscription?.endDate || user.subscriptionEndDate;
  if (endDate && new Date(endDate) <= new Date()) return false;

  return true;
}

export { isAdminUser } from "./roles";

export function getSubscriptionLabel(user) {
  if (!user) return "Free";
  if (isProMember(user)) return "Pro";
  return "Free";
}

export function getRemainingDays(user) {
  if (!user) return 0;
  if (typeof user.subscription?.remainingDays === "number") {
    return user.subscription.remainingDays;
  }
  const endDate = user.subscription?.endDate || user.subscriptionEndDate;
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
