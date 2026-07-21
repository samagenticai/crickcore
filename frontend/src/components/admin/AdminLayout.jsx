import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import InactivityLogoutGuard from "../session/InactivityLogoutGuard";

const titles = {
  "/admin": "Admin Dashboard",
  "/admin/users": "User Management",
  "/admin/tournaments": "Tournaments",
  "/admin/teams": "Teams",
  "/admin/players": "Players",
  "/admin/matches": "Matches",
  "/admin/venues": "Venues",
  "/admin/umpires": "Umpires",
  "/admin/scorers": "Scorers",
  "/admin/sponsors": "Sponsors",
  "/admin/payments": "Payments",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
  "/admin/profile": "Admin Profile",
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || "Admin";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)] text-text overflow-x-hidden">
      <InactivityLogoutGuard />
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
        <header className="sticky top-0 z-30 mx-3 mt-3 flex items-center gap-3 rounded-[1.35rem] border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:mx-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-secondary truncate">{title}</h1>
        </header>

        <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 overflow-x-hidden">
          <div className="rounded-2xl sm:rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-3 shadow-sm backdrop-blur-xl sm:p-6 lg:p-8 min-w-0 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
