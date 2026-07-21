const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatTimeAgo(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSec < 10) return "Just now";
  if (diffSec < MINUTE) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / MINUTE);
  if (diffMin < 60) return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;

  const diffHour = Math.floor(diffSec / HOUR);
  if (diffHour < 24) return diffHour === 1 ? "1 hour ago" : `${diffHour} hours ago`;

  const diffDay = Math.floor(diffSec / DAY);
  if (diffDay < 7) return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
