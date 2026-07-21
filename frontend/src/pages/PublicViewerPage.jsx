import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Loader2, Search } from "lucide-react";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import PublicViewerHeader from "../components/viewer/PublicViewerHeader";
import PublicTournamentCard from "../components/viewer/PublicTournamentCard";
import { publicAPI } from "../api/public";
import { useViewerAutoRefresh } from "../hooks/useViewerAutoRefresh";
import { getEffectiveTournamentStatus } from "../utils/tournamentViewer";
import { getTournamentVenue } from "../utils/tournamentVenue";
import { pageReveal } from "../utils/animations";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "Live", label: "Live" },
];

function ViewerEmptyState({ hasSearch, statusFilter }) {
  const isFiltered = hasSearch || statusFilter !== "all";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-10 sm:p-14 text-center max-w-md mx-auto shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
        {isFiltered ? (
          <Search className="w-8 h-8 text-primary" />
        ) : (
          <CalendarClock className="w-8 h-8 text-primary" />
        )}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-secondary">
        {isFiltered ? "No matching tournaments" : "No tournaments available"}
      </h3>
      <p className="mt-2 text-sm text-text-muted leading-relaxed">
        {isFiltered
          ? "Try a different search term or switch the status filter."
          : "Tournaments created from the Organizer Dashboard will appear here automatically once they are public and not completed."}
      </p>
    </div>
  );
}

export default function PublicViewerPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTournaments = useCallback(async () => {
    setError("");
    try {
      const params = { limit: 100 };
      if (statusFilter === "Upcoming" || statusFilter === "Live") {
        params.status = statusFilter;
      }
      const { data } = await publicAPI.getViewerTournaments(params);
      // Real MongoDB records only — never Completed
      const list = (data.data || []).filter((t) => t?._id && t.status !== "Completed");
      setTournaments(list);
    } catch (err) {
      setError(err?.message || "Failed to load tournaments");
      setTournaments([]);
    }
  }, [statusFilter]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTournaments();
      setLoading(false);
    })();
  }, [fetchTournaments]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchTournaments();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchTournaments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tournaments.filter((t) => {
      const effectiveStatus = getEffectiveTournamentStatus(t, { hasLiveMatch: t.hasLiveMatch });
      if (statusFilter === "Upcoming" && effectiveStatus !== "Upcoming") return false;
      if (statusFilter === "Live" && effectiveStatus !== "Live") return false;
      if (!q) return true;
      const venue = getTournamentVenue(t);
      return (
        t.tournamentName?.toLowerCase().includes(q) ||
        venue?.venueName?.toLowerCase().includes(q) ||
        venue?.city?.toLowerCase().includes(q) ||
        venue?.groundAddress?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q) ||
        t.groundName?.toLowerCase().includes(q)
      );
    });
  }, [tournaments, search, statusFilter]);

  const liveCount = useMemo(
    () =>
      tournaments.filter(
        (t) => getEffectiveTournamentStatus(t, { hasLiveMatch: t.hasLiveMatch }) === "Live"
      ).length,
    [tournaments]
  );

  const hasUpcomingNearStart = useMemo(
    () =>
      tournaments.some(
        (t) =>
          t.status === "Upcoming" &&
          t.startDate &&
          new Date(t.startDate).getTime() - Date.now() <= 60 * 60 * 1000
      ),
    [tournaments]
  );

  useViewerAutoRefresh(() => fetchTournaments(), {
    enabled: true,
    intervalMs: hasUpcomingNearStart || liveCount > 0 ? 15000 : 30000,
  });

  const hasSearch = search.trim().length > 0;

  return (
    <motion.div
      initial={false}
      animate="visible"
      variants={pageReveal}
      className="min-h-screen safe-overflow bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.06),transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)]"
    >
      <PublicViewerHeader title="Cricket Tournaments" subtitle="Live scores, fixtures & schedules" />

      <main className="relative safe-overflow">
        <BackgroundDecor />
        <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />

        <div className="section-container relative py-6 sm:py-8 pb-12 sm:pb-16">
          {liveCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex mb-6"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-sm font-semibold">
                <span className="viewer-live-dot w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {liveCount} live now
              </span>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tournaments…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-secondary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
              />
            </div>

            <div className="flex gap-1.5 rounded-xl bg-white border border-slate-200/80 p-1 overflow-x-auto">
              {STATUS_FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === id
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading tournaments…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-10 text-center max-w-lg mx-auto">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => fetchTournaments()}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <ViewerEmptyState hasSearch={hasSearch} statusFilter={statusFilter} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {filtered.map((tournament, index) => (
                <PublicTournamentCard key={tournament._id} tournament={tournament} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
