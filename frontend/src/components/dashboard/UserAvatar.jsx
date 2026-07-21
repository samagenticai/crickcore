import { mediaUrl } from "../../utils/media";

/**
 * Shared user avatar — initials fallback when no photo.
 * Reads profilePicture / avatar from the auth user object.
 */
export default function UserAvatar({
  user,
  size = "md",
  className = "",
  alt = "",
}) {
  const src = mediaUrl(user?.profilePicture || user?.avatar || "");
  const initial = (user?.fullName || user?.email || "?").charAt(0).toUpperCase();

  const sizeClass =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-8 h-8 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={alt || user?.fullName || "Profile"}
        className={`${sizeClass} rounded-full object-cover shrink-0 ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 ${className}`}
      aria-hidden={!alt}
    >
      {initial}
    </div>
  );
}
