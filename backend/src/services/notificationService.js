import Notification from "../models/Notification.js";

export const MAX_NOTIFICATIONS_PER_USER = 10;

export function serializeNotification(doc) {
  const n = doc?.toObject ? doc.toObject() : doc;
  return {
    id: n._id,
    _id: n._id,
    title: n.title,
    message: n.message,
    type: n.type,
    icon: n.icon,
    isRead: Boolean(n.isRead),
    relatedId: n.relatedId || null,
    relatedType: n.relatedType || null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

async function trimOldestIfNeeded(userId) {
  const count = await Notification.countDocuments({ user: userId });
  if (count < MAX_NOTIFICATIONS_PER_USER) return;

  const oldest = await Notification.findOne({ user: userId })
    .sort({ createdAt: 1, _id: 1 })
    .select("_id")
    .lean();

  if (oldest) {
    await Notification.deleteOne({ _id: oldest._id });
  }
}

/**
 * Create a notification and keep only the latest MAX_NOTIFICATIONS_PER_USER per user.
 * Deletes the oldest entry before insert when the cap is already reached.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  icon = "bell",
  relatedId = null,
  relatedType = null,
}) {
  if (!userId || !title || !message) return null;

  await trimOldestIfNeeded(userId);

  const created = await Notification.create({
    user: userId,
    title: String(title).trim(),
    message: String(message).trim(),
    type,
    icon,
    relatedId: relatedId || undefined,
    relatedType: relatedType || undefined,
    isRead: false,
  });

  return serializeNotification(created);
}

export async function listNotifications(userId) {
  const rows = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(MAX_NOTIFICATIONS_PER_USER)
    .lean();

  return rows.map(serializeNotification);
}

export async function countUnread(userId) {
  return Notification.countDocuments({ user: userId, isRead: false });
}

export async function markNotificationRead(userId, notificationId) {
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true } },
    { new: true }
  ).lean();

  if (!updated) return null;
  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
  return listNotifications(userId);
}
