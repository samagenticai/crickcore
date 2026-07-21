import { Menu, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdminUser } from "../../utils/roles";
import UserAvatar from "./UserAvatar";
import NotificationBell from "./NotificationBell";

export default function TopBar({ onMenuClick, title }) {
  const { user, isPro } = useAuth();

  return (
    <header className="sticky top-0 z-30 mx-3 mt-3 flex items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200/70 bg-white/85 px-4 py-3 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:mx-6 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 touch-target"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-secondary" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-secondary truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPro ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/80 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-900 uppercase">
            <Star className="h-3 w-3 fill-current" />
            Pro Plan Active
          </span>
        ) : !isAdminUser(user) ? (
          <Link
            to="/#pricing"
            className="hidden sm:inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Upgrade to Pro
          </Link>
        ) : null}
        <NotificationBell />
        <Link
          to="/dashboard/profile"
          className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity"
          title="Profile"
        >
          <UserAvatar user={user} size="sm" />
        </Link>
      </div>
    </header>
  );
}
