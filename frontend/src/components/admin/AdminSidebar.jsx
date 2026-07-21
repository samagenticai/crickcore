import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
  Swords,
  MapPin,
  Gavel,
  ClipboardList,
  Handshake,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../dashboard/UserAvatar";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Tournaments", icon: Trophy, path: "/admin/tournaments" },
  { label: "Teams", icon: Users, path: "/admin/teams" },
  { label: "Players", icon: UserCircle, path: "/admin/players" },
  { label: "Matches", icon: Swords, path: "/admin/matches" },
  { label: "Venues", icon: MapPin, path: "/admin/venues" },
  { label: "Umpires", icon: Gavel, path: "/admin/umpires" },
  { label: "Scorers", icon: ClipboardList, path: "/admin/scorers" },
  { label: "Sponsors", icon: Handshake, path: "/admin/sponsors" },
  { label: "Payments", icon: CreditCard, path: "/admin/payments" },
  { label: "Reports", icon: BarChart3, path: "/admin/reports" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
  { label: "Admin Profile", icon: Shield, path: "/admin/profile" },
];

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const content = (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-4"} py-4 border-b border-slate-200/80`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-secondary truncate">Admin Panel</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">System</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onMobileClose}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin"}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-secondary"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`p-3 border-t border-slate-200/80 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 mb-3 min-w-0">
            <UserAvatar user={user} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-secondary truncate">{user.fullName}</p>
              <p className="text-xs text-text-muted truncate">Administrator</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {content}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-100/55 backdrop-blur-[6px] z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-white border-r border-slate-200 lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
