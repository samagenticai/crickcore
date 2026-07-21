/** 15 minutes of inactivity before auto-logout on dashboard routes */
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

/** How often each tab re-checks idle time (and syncs with other tabs) */
export const INACTIVITY_CHECK_INTERVAL_MS = 30 * 1000;

/** Throttle cross-tab activity broadcasts */
export const INACTIVITY_ACTIVITY_THROTTLE_MS = 5 * 1000;

/** Throttle high-frequency pointer move events */
export const INACTIVITY_POINTER_THROTTLE_MS = 2 * 1000;

export const SESSION_LAST_ACTIVITY_KEY = "ctm_last_activity";
export const SESSION_FORCE_LOGOUT_KEY = "ctm_inactivity_logout";

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired due to 15 minutes of inactivity. Please sign in again.";
