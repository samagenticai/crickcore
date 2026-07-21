import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Search, Trophy, Crown, Users, CheckCircle2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "../../api/tournaments";
import { useStandings } from "../../hooks/useStandings";
import PointsTableView from "../../components/standings/PointsTableView";

function SummaryStatCard({ icon: Icon, label, value, tone = "bg-primary/10 text-primary" }) {
  return (
    <div className="card-premium p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-secondary tabular-nums leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function PointsTablePage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [search, setSearch] = useState("");
  const [fixtureStats, setFixtureStats] = useState({ completed: 0, total: 0 });

  const selectedTournament = tournaments.find((t) => t._id === selectedTournamentId);
  const isLive = selectedTournament?.status === "Live";

  const {
    rows,
    qualifyingSpots,
    loading,
    error,
    refresh,
    updatedAt,
  } = useStandings(selectedTournamentId, {
    enabled: Boolean(selectedTournamentId),
    pollMs: selectedTournamentId ? (isLive ? 8000 : 12000) : 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoadingTournaments(true);
      try {
        const { data } = await tournamentAPI.getAll({ limit: 100 });
        const list = data.data || [];
        setTournaments(list);
        if (list.length > 0) setSelectedTournamentId(list[0]._id);
      } catch (err) {
        toast.error(err.message || "Failed to load tournaments");
      } finally {
        setLoadingTournaments(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) {
      setFixtureStats({ completed: 0, total: 0 });
      return;
    }

    let cancelled = false;
    tournamentAPI
      .getTournamentFixtures(selectedTournamentId)
      .then(({ data }) => {
        if (cancelled) return;
        const fixtures = data.data || [];
        setFixtureStats({
          completed: fixtures.filter((m) => m.status === "Completed").length,
          total: fixtures.filter((m) => (m.teamA?._id || m.teamA) && (m.teamB?._id || m.teamB)).length,
        });
      })
      .catch(() => {
        if (!cancelled) setFixtureStats({ completed: 0, total: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTournamentId, updatedAt]);

  const leader = rows.find((r) => r.position === 1);
  const hasTeams = rows.length > 0;

  const lastUpdatedLabel = useMemo(() => {
    if (!updatedAt) return null;
    return new Date(updatedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [updatedAt]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Points{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Table
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Standings and net run rate — updated automatically after every completed match
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdatedLabel && (
            <span className="text-xs text-text-muted hidden sm:inline">Updated {lastUpdatedLabel}</span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={loading || !selectedTournamentId}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {leader && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-primary/5 border border-amber-200">
              <Crown className="w-4 h-4 text-amber-500" />
              <div className="leading-tight">
                <p className="text-[11px] text-text-muted">Table Leader</p>
                <p className="text-sm font-bold text-secondary">{leader.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-premium p-4">
        {loadingTournaments ? (
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse w-64" />
        ) : tournaments.length === 0 ? (
          <p className="text-sm text-text-muted">No tournaments found. Create one first.</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-semibold text-secondary whitespace-nowrap">Tournament:</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="flex-1 max-w-md px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>{t.tournamentName}</option>
              ))}
            </select>
            {selectedTournament && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted bg-slate-100 px-3 py-1.5 rounded-lg">
                  {selectedTournament.tournamentType}
                </span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                  {rows.length} teams
                </span>
                {isLive && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                    Live
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {hasTeams && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStatCard icon={Users} label="Teams" value={rows.length} />
          <SummaryStatCard
            icon={BarChart3}
            label="Fixtures"
            value={fixtureStats.total}
            tone="bg-blue-50 text-blue-600"
          />
          <SummaryStatCard
            icon={CheckCircle2}
            label="Completed Matches"
            value={fixtureStats.completed}
            tone="bg-emerald-50 text-emerald-600"
          />
          <SummaryStatCard
            icon={Trophy}
            label="Leader Points"
            value={leader?.points ?? 0}
            tone="bg-amber-50 text-amber-600"
          />
        </div>
      )}

      {hasTeams && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search teams or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
          />
        </div>
      )}

      <PointsTableView
        rows={rows}
        qualifyingSpots={qualifyingSpots}
        loading={loading}
        error={error}
        search={search}
        variant="dashboard"
      />
    </motion.div>
  );
}
