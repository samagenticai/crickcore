import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, UserCircle, Swords, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "../../components/dashboard/StatCard";
import { DashboardSkeleton } from "../../components/dashboard/Skeleton";
import { tournamentAPI } from "../../api/tournaments";
import { mediaUrl } from "../../utils/media";

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];

const teamName = (team) => (typeof team === "object" && team ? team.name : null) || "—";

// Compact completed-tournament card for the dashboard: banner, logo, winner,
// runner-up and a Completed badge only.
function CompletedMiniCard({ t }) {
  const banner = mediaUrl(t.bannerImage);
  const logo = mediaUrl(t.tournamentLogo);
  const isStorageArchived = Boolean(t.isStorageArchived);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm"
    >
      {/* Banner + overlapping logo */}
      <div className="relative h-16">
        {banner ? (
          <img src={banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-primary to-emerald-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
        <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow">
          <span aria-hidden>🏆</span>
          {isStorageArchived ? "Archived" : "Completed"}
        </span>
        <div className="absolute -bottom-5 left-3">
          <div className="w-11 h-11 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
            {logo ? (
              <img src={logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>
      </div>

      <div className="pt-7 px-3 pb-3">
        <p className="text-sm font-semibold text-secondary truncate">{t.tournamentName}</p>
        {isStorageArchived ? (
          <p className="text-[11px] text-text-muted mt-1">Archived to optimize storage</p>
        ) : null}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-2 py-1.5 min-w-0">
            <p className="text-[10px] text-text-muted flex items-center gap-1">🏆 Winner</p>
            <p className="text-xs font-bold text-secondary truncate">{teamName(t.winner)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5 min-w-0">
            <p className="text-[10px] text-text-muted flex items-center gap-1">🥈 Runner-up</p>
            <p className="text-xs font-bold text-secondary truncate">{teamName(t.runnerUp)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentAPI
      .getStats()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = data?.stats || {};
  const chartData = (data?.statusBreakdown || []).map((s) => ({
    name: s._id || "Unknown",
    value: s.count,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-r from-primary/8 via-white to-accent/8 p-5 shadow-[0_4px_20px_rgba(22,163,74,0.06)] sm:p-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Tournament command center</p>
          <h2 className="mt-2 text-2xl font-semibold text-secondary">Welcome back! Keep every match moving.</h2>
          <p className="mt-2 text-sm text-text-muted">
            Track recent activity, tournament health, and your latest updates from one polished workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Trophy} label="Tournaments" value={stats.tournaments || 0} color="primary" />
        <StatCard icon={Users} label="Teams" value={stats.teams || 0} color="accent" />
        <StatCard icon={UserCircle} label="Players" value={stats.players || 0} color="blue" />
        <StatCard icon={Swords} label="Matches" value={stats.matches || 0} color="purple" />
        <StatCard icon={MapPin} label="Venues" value={stats.venues || 0} color="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-premium p-5">
          <h3 className="font-semibold text-secondary mb-4">Tournament Status</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">No tournament data yet</p>
          )}
        </div>

        <div className="card-premium p-5">
          <h3 className="font-semibold text-secondary mb-4">Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: "Teams", count: stats.teams || 0 },
              { name: "Players", count: stats.players || 0 },
              { name: "Matches", count: stats.matches || 0 },
              { name: "Venues", count: stats.venues || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-premium p-5">
          <h3 className="font-semibold text-secondary mb-4">Recent Tournaments</h3>
          <div className="space-y-3">
            {(data?.recentTournaments || []).length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No tournaments yet</p>
            ) : (
              data.recentTournaments.map((t) =>
                t.status === "Completed" ? (
                  <CompletedMiniCard key={t._id} t={t} />
                ) : (
                  <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-secondary truncate">{t.tournamentName}</p>
                      <p className="text-xs text-text-muted">{t.city || "—"}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0 ml-2">
                      {t.status}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>

        <div className="card-premium p-5">
          <h3 className="font-semibold text-secondary mb-4">Recent Matches</h3>
          <div className="space-y-3">
            {(data?.recentMatches || []).length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No matches yet</p>
            ) : (
              data.recentMatches.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-secondary truncate">
                      {m.teamA?.name || "TBD"} vs {m.teamB?.name || "TBD"}
                    </p>
                    <p className="text-xs text-text-muted">{m.tournament?.tournamentName}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium shrink-0 ml-2">
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
