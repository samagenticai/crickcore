import { asyncHandler } from "../utils/helpers.js";
import { ApiError } from "../utils/helpers.js";
import {
  listNotifications,
  countUnread,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    listNotifications(req.user._id),
    countUnread(req.user._id),
  ]);

  res.json({
    success: true,
    data: {
      notifications: items,
      unreadCount,
    },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const updated = await markNotificationRead(req.user._id, req.params.id);
  if (!updated) throw new ApiError(404, "Notification not found");

  const unreadCount = await countUnread(req.user._id);
  res.json({
    success: true,
    data: { notification: updated, unreadCount },
  });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const notifications = await markAllNotificationsRead(req.user._id);
  res.json({
    success: true,
    data: { notifications, unreadCount: 0 },
  });
});
