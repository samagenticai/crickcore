const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function computeProEndDate(startDate = new Date()) {
  return new Date(new Date(startDate).getTime() + PRO_DURATION_MS);
}

export function getRemainingDays(endDate) {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function isProPlan(user) {
  if (!user) return false;
  const plan = String(user.subscriptionPlan || "free").toLowerCase();
  return plan === "pro" || plan === "enterprise";
}

/** True when plan is pro/enterprise, status active, and not past subscriptionEndDate. */
export function isProActive(user) {
  if (!user || !isProPlan(user)) return false;
  if (String(user.subscriptionStatus || "none").toLowerCase() !== "active") return false;
  if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) <= new Date()) return false;
  return true;
}

/** Apply a new 30-day Pro subscription window. */
export function applyProSubscription(user, planId = "pro") {
  const now = new Date();
  user.subscriptionPlan = planId === "starter" ? "starter" : planId;
  user.subscriptionStatus = "active";
  user.subscriptionStartDate = now;
  user.subscriptionEndDate = computeProEndDate(now);
  user.subscriptionUpdatedAt = now;
  return user;
}

/**
 * Backfill missing dates and downgrade expired Pro users to Free in MongoDB.
 * Returns the (possibly updated) user document.
 */
export async function syncSubscriptionExpiry(user) {
  if (!user || !isProPlan(user)) return user;

  let dirty = false;

  if (user.subscriptionStatus === "active" && !user.subscriptionEndDate) {
    const start = user.subscriptionStartDate || user.subscriptionUpdatedAt || new Date();
    user.subscriptionStartDate = start;
    user.subscriptionEndDate = computeProEndDate(start);
    dirty = true;
  }

  if (
    user.subscriptionStatus === "active" &&
    user.subscriptionEndDate &&
    new Date(user.subscriptionEndDate) <= new Date()
  ) {
    user.subscriptionPlan = "free";
    user.subscriptionStatus = "none";
    user.subscriptionUpdatedAt = new Date();
    dirty = true;
  }

  if (dirty) {
    await user.save({ validateBeforeSave: false });
  }

  return user;
}
