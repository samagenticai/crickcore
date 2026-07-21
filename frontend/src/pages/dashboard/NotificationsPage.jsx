import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "../../context/NotificationContext";
import { formatTimeAgo } from "../../utils/timeAgo";
import {
  getNotificationIcon,
  getNotificationLink,
  NOTIFICATION_TYPE_STYLES,
} from "../../utils/notificationUi";
import EmptyState from "../../components/dashboard/EmptyState";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      navigate(getNotificationLink(notification));
    } catch (err) {
      toast.error(err.message || "Could not update notification");
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error(err.message || "Could not mark all as read");
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading notifications…
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="When tournaments, matches, fixtures, or teams change, updates will show up here instantly."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-secondary">Recent activity</h2>
          <p className="text-sm text-text-muted">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-secondary hover:bg-slate-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        ) : null}
      </div>

      <div className="card-premium divide-y divide-slate-100 overflow-hidden">
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.icon);
          const typeStyle =
            NOTIFICATION_TYPE_STYLES[notification.type] || NOTIFICATION_TYPE_STYLES.info;

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={`w-full text-left px-4 sm:px-5 py-4 flex gap-4 hover:bg-slate-50/80 transition-colors ${
                notification.isRead ? "" : "bg-primary/[0.03]"
              }`}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-2xl border flex items-center justify-center ${typeStyle}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-secondary">{notification.title}</p>
                  {!notification.isRead ? (
                    <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-primary" aria-hidden />
                  ) : null}
                </div>
                <p className="text-sm text-text-muted mt-1">{notification.message}</p>
                <p className="text-xs text-slate-400 mt-2">{formatTimeAgo(notification.createdAt)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
