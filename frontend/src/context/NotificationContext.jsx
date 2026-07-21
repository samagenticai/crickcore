import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { notificationsAPI } from "../api/notifications";
import { useAuth } from "./AuthContext";
import { canAccessOrganizerDashboard } from "../utils/roles";

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 10;
const POLL_INTERVAL_MS = 8000;

function normalizeNotification(raw) {
  if (!raw) return null;
  const id = raw.id || raw._id;
  return {
    id,
    _id: id,
    title: raw.title,
    message: raw.message,
    type: raw.type || "info",
    icon: raw.icon || "bell",
    isRead: Boolean(raw.isRead),
    relatedId: raw.relatedId || null,
    relatedType: raw.relatedType || null,
    createdAt: raw.createdAt,
  };
}

function sortNewestFirst(list) {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function trimNotifications(list) {
  return sortNewestFirst(list).slice(0, MAX_NOTIFICATIONS);
}

function fingerprintNotifications(list) {
  return list.map((n) => `${n.id}:${n.isRead ? 1 : 0}`).join("|");
}

function showNotificationToast(notification) {
  const options = { description: notification.message };
  switch (notification.type) {
    case "success":
      toast.success(notification.title, options);
      break;
    case "warning":
      toast.warning(notification.title, options);
      break;
    case "error":
      toast.error(notification.title, options);
      break;
    default:
      toast.info(notification.title, options);
      break;
  }
}

export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const enabled = Boolean(user && canAccessOrganizerDashboard(user));

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const seenIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);
  const fingerprintRef = useRef("");
  const pollInFlightRef = useRef(false);

  const applyPollResult = useCallback((items, unread, { toastNew = false } = {}) => {
    const trimmed = trimNotifications(items);
    const nextFingerprint = fingerprintNotifications(trimmed);

    if (toastNew && initialLoadDoneRef.current) {
      const newOnes = trimmed.filter((n) => !seenIdsRef.current.has(String(n.id)));
      newOnes.forEach((n) => showNotificationToast(n));
    }

    trimmed.forEach((n) => seenIdsRef.current.add(String(n.id)));

    if (nextFingerprint !== fingerprintRef.current) {
      fingerprintRef.current = nextFingerprint;
      setNotifications(trimmed);
    }

    setUnreadCount((prev) => (prev === unread ? prev : unread));
    initialLoadDoneRef.current = true;
  }, []);

  const poll = useCallback(
    async ({ showLoading = false, toastNew = false } = {}) => {
      if (!enabled || pollInFlightRef.current) return;

      pollInFlightRef.current = true;
      if (showLoading) setLoading(true);

      try {
        const { data } = await notificationsAPI.list();
        const items = (data.data?.notifications || [])
          .map(normalizeNotification)
          .filter(Boolean);
        const unread = data.data?.unreadCount ?? 0;
        applyPollResult(items, unread, { toastNew });
      } catch {
        /* Keep existing state on transient API failures */
      } finally {
        pollInFlightRef.current = false;
        if (showLoading) setLoading(false);
      }
    },
    [enabled, applyPollResult]
  );

  const refresh = useCallback(() => poll({ showLoading: false, toastNew: false }), [poll]);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!enabled) {
      seenIdsRef.current = new Set();
      initialLoadDoneRef.current = false;
      fingerprintRef.current = "";
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    seenIdsRef.current = new Set();
    initialLoadDoneRef.current = false;
    fingerprintRef.current = "";

    poll({ showLoading: true, toastNew: false });

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          poll({ toastNew: true });
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        poll({ toastNew: true });
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authLoading, enabled, poll]);

  const markAsRead = useCallback(async (notificationId) => {
    const target = notifications.find((n) => String(n.id) === String(notificationId));
    if (!target || target.isRead) return target;

    const next = notifications.map((n) =>
      String(n.id) === String(notificationId) ? { ...n, isRead: true } : n
    );
    fingerprintRef.current = fingerprintNotifications(next);
    setNotifications(next);

    try {
      const { data } = await notificationsAPI.markRead(notificationId);
      const updated = normalizeNotification(data.data?.notification);
      if (updated) {
        setNotifications((prev) => {
          const merged = prev.map((n) => (String(n.id) === String(updated.id) ? updated : n));
          fingerprintRef.current = fingerprintNotifications(merged);
          return merged;
        });
      }
      if (typeof data.data?.unreadCount === "number") {
        setUnreadCount(data.data.unreadCount);
      }
      return updated || target;
    } catch {
      await refresh();
      throw new Error("Failed to mark notification as read");
    }
  }, [notifications, refresh]);

  const markAllAsRead = useCallback(async () => {
    const next = notifications.map((n) => ({ ...n, isRead: true }));
    fingerprintRef.current = fingerprintNotifications(next);
    setNotifications(next);
    setUnreadCount(0);

    try {
      const { data } = await notificationsAPI.markAllRead();
      const items = (data.data?.notifications || [])
        .map(normalizeNotification)
        .filter(Boolean);
      applyPollResult(items, 0);
    } catch {
      await refresh();
      throw new Error("Failed to mark all notifications as read");
    }
  }, [notifications, applyPollResult, refresh]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      markAllAsRead,
      enabled,
    }),
    [notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead, enabled]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
