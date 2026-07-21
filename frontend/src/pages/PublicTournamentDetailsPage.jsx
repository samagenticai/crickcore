import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Loader2, Radio, Swords, Trophy, BarChart3 } from "lucide-react";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import PublicViewerHeader from "../components/viewer/PublicViewerHeader";
import PublicLiveTicker from "../components/viewer/PublicLiveTicker";
import PublicTournamentHeroStatus from "../components/viewer/PublicTournamentHeroStatus";
import TournamentVenueDetails from "../components/dashboard/TournamentVenueDetails";
import PublicSponsorsSection from "../components/viewer/PublicSponsorsSection";
import PublicFixtureCard, { sortFixtures } from "../components/viewer/PublicFixtureCard";
import { VIEWER_LIVE_BADGE } from "../components/viewer/viewerUi";
import { publicAPI } from "../api/public";
import { useViewerAutoRefresh } from "../hooks/useViewerAutoRefresh";
import { useCountdown } from "../hooks/useCountdown";
import {
  getEffectiveTournamentStatus,
  shouldPollForTournamentStart,
} from "../utils/tournamentViewer";
import { mediaUrl } from "../utils/media";
import { pageReveal } from "../utils/animations";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

const TOURNAMENT_STATUS = {
  Live: "bg-red-50 text-red-700 border-red-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
};

import { tournamentVenueLabel } from "../utils/tournamentVenue";

export default function PublicTournamentDetailsPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const [tRes, fRes] = await Promise.all([
        publicAPI.getTournament(id),
        publicAPI.getFixtures(id),
      ]);
      setTournament(tRes.data.data);
      setFixtures(fRes.data.data || []);
    } catch (err) {
      if (!silent) {
        setError(err?.message || "Failed to load tournament");
        setTournament(null);
        setFixtures([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasLiveMatch = useMemo(
    () => fixtures.some((m) => m.status === "Live"),
    [fixtures]
  );

  const effectiveStatus = useMemo(
    () => getEffectiveTournamentStatus(tournament, { hasLiveMatch }),
    [tournament, hasLiveMatch]
  );

  const isLive = effectiveStatus === "Live";
  const isUpcoming = effectiveStatus === "Upcoming";

  const countdownParts = useCountdown(tournament?.startDate, {
    enabled: isUpcoming && Boolean(tournament?.startDate),
  });

  useEffect(() => {
    if (countdownParts?.isPast && isUpcoming) {
      fetchData(true);
    }
  }, [countdownParts?.isPast, isUpcoming, fetchData]);

  const hasLiveScoring = useMemo(
    () => fixtures.some((m) => m.status === "Live" && m.liveScore?.isInitialized),
    [fixtures]
  );

  const shouldPoll = useMemo(
    () => shouldPollForTournamentStart(tournament, fixtures) || isLive,
    [tournament, fixtures, isLive]
  );

  useViewerAutoRefresh(() => fetchData(true), {
    enabled: shouldPoll,
    intervalMs: hasLiveScoring ? 5000 : isLive ? 5000 : 12000,
  });

  const sortedFixtures = useMemo(() => sortFixtures(fixtures), [fixtures]);

  const banner = mediaUrl(tournament?.bannerImage);
  const logo = mediaUrl(tournament?.tournamentLogo);
  const statusClass = TOURNAMENT_STATUS[effectiveStatus] || TOURNAMENT_STATUS.Upcoming;

  const ticker = (
    <PublicLiveTicker fixtures={fixtures} visible={isLive} tournamentName={tournament?.tournamentName} />
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageReveal}
      className="min-h-screen safe-overflow bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.06),transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)]"
    >
      <PublicViewerHeader
        title={tournament?.tournamentName || "Tournament"}
        subtitle={tournament ? `${tournament.tournamentType || "Cricket"} · ${tournamentVenueLabel(tournament)}` : undefined}
        backTo="/viewer"
        backLabel="All tournaments"
        ticker={ticker}
      />

      <main className="relative safe-overflow">
        <BackgroundDecor />
        <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />

        <div className="section-container relative py-6 sm:py-8 pb-12 sm:pb-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center max-w-lg mx-auto">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <Link to="/viewer" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="w-4 h-4" />
                Back to tournaments
              </Link>
            </div>
          ) : tournament ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="relative h-36 sm:h-44 bg-slate-100">
                  {banner ? (
                    <img src={banner} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/80 via-primary to-accent/60" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/40" />
                  <PublicTournamentHeroStatus isLive={isLive} countdownParts={countdownParts} />
                  <div className="absolute top-3 right-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
                      {effectiveStatus}
                    </span>
                  </div>
                  <div className="absolute -bottom-8 left-4 sm:left-5">
                    <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                      {logo ? (
                        <img src={logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-7 h-7 text-primary" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-10 sm:pt-11 px-4 sm:px-5 pb-4 sm:pb-5">
                  {!isLive && !isUpcoming && (
                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary/70" />
                        {fmtDate(tournament.startDate)} – {fmtDate(tournament.endDate)}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-wrap gap-3 text-xs sm:text-sm text-text-muted ${!isLive && !isUpcoming ? "mt-0" : ""}`}>
                    {isUpcoming && !countdownParts?.isPast && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary/70" />
                        {fmtDate(tournament.startDate)} – {fmtDate(tournament.endDate)}
                      </span>
                    )}
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        Tournament is live
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <TournamentVenueDetails tournament={tournament} />
                  </div>
                  {tournament.description && (
                    <p className="mt-3 text-sm text-text-muted leading-relaxed line-clamp-3">
                      {tournament.description}
                    </p>
                  )}
                  <div className="mt-5">
                    <PublicSponsorsSection sponsors={tournament.sponsors} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Swords className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-secondary">Fixtures</h2>
                  <Link
                    to={`/viewer/${id}/points`}
                    className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Points Table
                  </Link>
                  {hasLiveMatch && (
                    <span className={`${VIEWER_LIVE_BADGE} !text-[10px] !py-1 !px-2.5`}>
                      <span className="viewer-live-dot w-1.5 h-1.5 rounded-full bg-white" />
                      Live
                    </span>
                  )}
                  <span className="text-xs font-semibold text-text-muted ml-auto">
                    {sortedFixtures.length} match{sortedFixtures.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {sortedFixtures.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
                    <p className="text-sm text-text-muted">No fixtures scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {sortedFixtures.map((match) => (
                      <PublicFixtureCard
                        key={match._id}
                        match={match}
                        tournamentName={tournament.tournamentName}
                        tournament={tournament}
                        tournamentId={id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </motion.div>
  );
}
