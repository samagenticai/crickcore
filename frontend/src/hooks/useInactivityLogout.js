import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  INACTIVITY_ACTIVITY_THROTTLE_MS,
  INACTIVITY_CHECK_INTERVAL_MS,
  INACTIVITY_POINTER_THROTTLE_MS,
  INACTIVITY_TIMEOUT_MS,
  SESSION_FORCE_LOGOUT_KEY,
  SESSION_LAST_ACTIVITY_KEY,
} from "../constants/session";

const readStoredActivity = () => {
  try {
    const stored = Number(localStorage.getItem(SESSION_LAST_ACTIVITY_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
};

const writeActivity = (timestamp) => {
  try {
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    /* ignore quota / private mode */
  }
};

const markForceLogout = () => {
  try {
    localStorage.setItem(SESSION_FORCE_LOGOUT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

const clearForceLogoutFlag = () => {
  try {
    localStorage.removeItem(SESSION_FORCE_LOGOUT_KEY);
  } catch {
    /* ignore */
  }
};

const hasForceLogoutFlag = () => {
  try {
    return Boolean(localStorage.getItem(SESSION_FORCE_LOGOUT_KEY));
  } catch {
    return false;
  }
};

/**
 * Auto-logout after continuous dashboard inactivity.
 * Cross-tab: activity in one tab refreshes the shared timestamp for all tabs.
 */
export default function useInactivityLogout({ enabled = true, onLogout }) {
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());
  const lastBroadcastRef = useRef(0);
  const lastPointerRef = useRef(0);
  const loggingOutRef = useRef(false);
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const recordActivity = useCallback((force = false) => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (force || now - lastBroadcastRef.current >= INACTIVITY_ACTIVITY_THROTTLE_MS) {
      lastBroadcastRef.current = now;
      writeActivity(now);
    }
  }, []);

  const performLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    markForceLogout();
    try {
      await onLogoutRef.current?.();
    } catch {
      /* redirect + local clear still run in guard */
    }
  }, []);

  const evaluateIdleState = useCallback(() => {
    if (!enabled || loggingOutRef.current) return;

    if (hasForceLogoutFlag()) {
      performLogout();
      return;
    }

    const stored = readStoredActivity();
    const lastActivity = Math.max(lastActivityRef.current, stored ?? 0);
    lastActivityRef.current = lastActivity;

    if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
      performLogout();
    }
  }, [enabled, performLogout]);

  // Seed activity when dashboard session starts
  useEffect(() => {
    if (!enabled) return;
    clearForceLogoutFlag();
    recordActivity(true);
  }, [enabled, recordActivity]);

  // User interactions reset the idle timer
  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => recordActivity(true);
    const onPointerMove = () => {
      const now = Date.now();
      if (now - lastPointerRef.current < INACTIVITY_POINTER_THROTTLE_MS) return;
      lastPointerRef.current = now;
      recordActivity();
    };

    const immediateEvents = ["mousedown", "keydown", "click", "touchstart", "wheel"];
    immediateEvents.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    document.addEventListener("scroll", onActivity, { passive: true, capture: true });
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });

    return () => {
      immediateEvents.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener("scroll", onActivity, { capture: true });
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
    };
  }, [enabled, recordActivity]);

  // In-app navigation counts as activity
  useEffect(() => {
    if (enabled) recordActivity(true);
  }, [location.pathname, enabled, recordActivity]);

  // Periodic idle check + cross-tab sync
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(evaluateIdleState, INACTIVITY_CHECK_INTERVAL_MS);

    const onStorage = (event) => {
      if (event.key === SESSION_LAST_ACTIVITY_KEY && event.newValue) {
        const ts = Number(event.newValue);
        if (Number.isFinite(ts) && ts > lastActivityRef.current) {
          lastActivityRef.current = ts;
        }
      }
      if (event.key === SESSION_FORCE_LOGOUT_KEY && event.newValue) {
        performLogout();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") evaluateIdleState();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, evaluateIdleState, performLogout]);
}
