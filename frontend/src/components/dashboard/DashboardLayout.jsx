import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { NotificationProvider } from "../../context/NotificationContext";
import InactivityLogoutGuard from "../session/InactivityLogoutGuard";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/dashboard/tournaments": "Tournaments",
  "/dashboard/teams": "Teams",
  "/dashboard/players": "Players",
  "/dashboard/matches": "Matches",
  "/dashboard/live-scoring": "Live Scoring",
  "/dashboard/fixtures": "Fixtures",
  "/dashboard/points-table": "Points Table",
  "/dashboard/venues": "Venues",
  "/dashboard/umpires": "Umpires",
  "/dashboard/scorers": "Scorers",
  "/dashboard/sponsors": "Sponsors",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "Profile",
};

function readDensity() {
  try {
    return (
      document.documentElement.dataset.density ||
      localStorage.getItem("dashboardDensity") ||
      "comfortable"
    );
  } catch {
    return "comfortable";
  }
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [density, setDensity] = useState(readDensity);
  const location = useLocation();

  useEffect(() => {
    const onDensity = (e) => setDensity(e.detail || readDensity());
    window.addEventListener("dashboard-density", onDensity);
    return () => window.removeEventListener("dashboard-density", onDensity);
  }, []);

  const title = pageTitles[location.pathname] || "Dashboard";
  const contentPad = density === "compact" ? "p-2 sm:p-4 lg:p-5" : "p-3 sm:p-6 lg:p-8";
  const mainPad =
    density === "compact"
      ? "px-2 py-3 sm:px-4 sm:py-4 lg:px-6"
      : "px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8";

  return (
    <NotificationProvider>
      <InactivityLogoutGuard />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.08),transparent_26%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)] text-text safe-overflow">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-64"
        }`}
      >
        <TopBar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className={mainPad}>
          <div
            className={`rounded-[1.75rem] border border-slate-200/70 bg-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl ${contentPad}`}
          >
            <Outlet />
          </div>
        </main>
      </div>
      </div>
    </NotificationProvider>
  );
}
