import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "../../context/NotificationContext";
import { formatTimeAgo } from "../../utils/timeAgo";
import {
  getNotificationIcon,
  getNotificationLink,
  NOTIFICATION_TYPE_STYLES,
} from "../../utils/notificationUi";

function NotificationItem({ notification, onSelect }) {
  const Icon = getNotificationIcon(notification.icon);
  const typeStyle =
    NOTIFICATION_TYPE_STYLES[notification.type] || NOTIFICATION_TYPE_STYLES.info;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
        notification.isRead ? "opacity-75" : "bg-primary/[0.03]"
      }`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${typeStyle}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-secondary truncate">{notification.title}</p>
          {!notification.isRead ? (
            <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" aria-hidden />
          ) : null}
        </div>
        <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{notification.message}</p>
        <p className="text-[11px] text-slate-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, enabled } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!enabled) return null;

  const handleSelect = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      setOpen(false);
      navigate(getNotificationLink(notification));
    } catch (err) {
      toast.error(err.message || "Could not update notification");
    }
  };

  const handleMarkAll = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
    } catch (err) {
      toast.error(err.message || "Could not mark all as read");
    }
  };

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl hover:bg-slate-100 relative touch-target"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {badgeLabel ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[min(100vw-1.5rem,22rem)] rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <h2 className="text-sm font-bold text-secondary">Notifications</h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-secondary">No notifications yet</p>
                <p className="text-xs text-text-muted mt-1">
                  Tournament and match updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 bg-white">
            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-primary hover:text-primary-dark"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
