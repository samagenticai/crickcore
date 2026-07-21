import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Loader2, Radio } from "lucide-react";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import PublicViewerHeader from "../components/viewer/PublicViewerHeader";
import PointsTableView from "../components/standings/PointsTableView";
import { publicAPI } from "../api/public";
import { useStandings } from "../hooks/useStandings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useViewerAutoRefresh } from "../hooks/useViewerAutoRefresh";
import { pageReveal } from "../utils/animations";
import { getEffectiveTournamentStatus } from "../utils/tournamentViewer";

export default function PublicPointsTablePage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchMeta = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setPageLoading(true);
    setPageError("");
    try {
      const [tRes, fRes] = await Promise.all([
        publicAPI.getTournament(id),
        publicAPI.getFixtures(id),
      ]);
      setTournament(tRes.data.data);
      setFixtures(fRes.data.data || []);
    } catch (err) {
      if (!silent) {
        setPageError(err?.message || "Failed to load tournament");
        setTournament(null);
        setFixtures([]);
      }
    } finally {
      if (!silent) setPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const hasLiveMatch = useMemo(() => fixtures.some((m) => m.status === "Live"), [fixtures]);
  const effectiveStatus = useMemo(
    () => getEffectiveTournamentStatus(tournament, { hasLiveMatch }),
    [tournament, hasLiveMatch]
  );
  const isLive = effectiveStatus === "Live";
  const pollMs = hasLiveMatch || isLive ? 8000 : 12000;

  useViewerAutoRefresh(() => fetchMeta(true), {
    enabled: Boolean(id) && !pageError,
    intervalMs: pollMs,
  });

  const {
    rows,
    qualifyingSpots,
    loading: standingsLoading,
    error: standingsError,
  } = useStandings(id, {
    public: true,
    enabled: Boolean(id) && !pageError,
    pollMs,
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageReveal}
      className="min-h-screen safe-overflow bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.06),transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)]"
    >
      <PublicViewerHeader
        title={tournament?.tournamentName ? `${tournament.tournamentName} — Points Table` : "Points Table"}
        subtitle={tournament ? `${tournament.tournamentType || "Cricket"} standings` : undefined}
        backTo={`/viewer/${id}`}
        backLabel="Tournament"
      />

      <main className="relative safe-overflow">
        <BackgroundDecor />
        <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />

        <div className="section-container relative py-6 sm:py-8 pb-12 sm:pb-16">
          {pageLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading…</p>
            </div>
          ) : pageError ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center max-w-lg mx-auto">
              <p className="text-sm text-red-600 font-medium">{pageError}</p>
              <Link
                to="/viewer"
                className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to tournaments
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold text-secondary">Points Table</h1>
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <Link
                  to={`/viewer/${id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  View fixtures
                </Link>
              </div>

              <PointsTableView
                rows={rows}
                qualifyingSpots={qualifyingSpots}
                loading={standingsLoading}
                error={standingsError}
                variant="public"
                compact={false}
              />
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
