import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import PublicViewerHeader from "../components/viewer/PublicViewerHeader";
import PublicMatchHeader from "../components/viewer/PublicMatchHeader";
import PublicSponsorsSection from "../components/viewer/PublicSponsorsSection";
import RecentDeliveriesStrip from "../components/viewer/RecentDeliveriesStrip";
import PublicMatchResult from "../components/viewer/PublicMatchResult";
import LiveScorecard from "../components/dashboard/live-score/LiveScorecard";
import PublicPlayingXIColumn from "../components/viewer/PublicPlayingXIColumn";
import PublicSquadColumn from "../components/viewer/PublicSquadColumn";
import { teamId } from "../components/viewer/PublicMatchTeamBadge";
import { publicAPI } from "../api/public";
import { useViewerAutoRefresh } from "../hooks/useViewerAutoRefresh";
import { battingTeamName, hasLiveScoring, hasMatchResult, resolveChaseTarget } from "../utils/liveScore";
import { pageReveal } from "../utils/animations";

const ALL_TABS = [
  { id: "liveScore", label: "Live Score" },
  { id: "playingXI", label: "Playing XI" },
  { id: "squads", label: "Squads" },
];

const RESULT_TAB = { id: "liveScore", label: "Match Result" };

const teamLabel = (team, slot) => (team && team.name) || slot?.label || "TBD";

export default function PublicMatchDetailsPage() {
  const { tournamentId, matchId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);
  const [squadA, setSquadA] = useState([]);
  const [squadB, setSquadB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [squadsLoading, setSquadsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("playingXI");

  const fetchMatchData = useCallback(async (silent = false) => {
    if (!tournamentId || !matchId) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const [tRes, mRes] = await Promise.all([
        publicAPI.getTournament(tournamentId),
        publicAPI.getMatch(tournamentId, matchId),
      ]);
      const m = mRes.data.data;
      setTournament(tRes.data.data);
      setMatch(m);
      if (!silent) {
        const defaultTab = hasMatchResult(m)
          ? "liveScore"
          : m?.status === "Live" &&
              (m?.liveScore?.isInitialized || m?.liveScore?.awaitingSecondInnings)
            ? "liveScore"
            : "playingXI";
        setTab(defaultTab);
      }
    } catch (err) {
      if (!silent) {
        setError(err?.message || "Failed to load match");
        setTournament(null);
        setMatch(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tournamentId, matchId]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const isLiveScoring = hasLiveScoring(match);
  const shouldPoll = match?.status === "Live" || match?.status === "Scheduled";
  const pollInterval =
    match?.status === "Live" ? 5000 : match?.status === "Scheduled" ? 8000 : 15000;

  useViewerAutoRefresh(() => fetchMatchData(true), {
    enabled: shouldPoll,
    intervalMs: pollInterval,
  });

  const isMatchResult = hasMatchResult(match);

  const tabs = useMemo(() => {
    if (match?.status === "Live") return ALL_TABS;
    if (isMatchResult) return [RESULT_TAB, ...ALL_TABS.filter((t) => t.id !== "liveScore")];
    return ALL_TABS.filter((t) => t.id !== "liveScore");
  }, [match?.status, isMatchResult]);

  const awaitingSecondInnings =
    match?.liveScore?.awaitingSecondInnings && !match?.liveScore?.isInitialized;
  const chaseTarget = resolveChaseTarget(match?.liveScore);
  const firstInningsTeamName = useMemo(() => {
    const firstBatId = match?.liveScore?.firstInnings?.battingTeam;
    if (!firstBatId || !match) return "1st Innings";
    const batId = String(firstBatId);
    const aId = String(match.teamA?._id || match.teamA);
    return batId === aId ? teamLabel(match.teamA, match.teamASlot) : teamLabel(match.teamB, match.teamBSlot);
  }, [match]);

  const liveScoreView = isLiveScoring && (
    awaitingSecondInnings ? (
      <div className="space-y-4 min-w-0">
        <div className="rounded-[14px] border border-amber-200/80 bg-amber-50/50 p-6 sm:p-8 text-center shadow-sm min-w-0 viewer-fade-in">
          <p className="text-sm font-semibold text-amber-900">Innings break</p>
          {match.liveScore?.firstInnings && (
            <p className="text-2xl font-extrabold text-secondary tabular-nums mt-3">
              {match.liveScore.firstInnings.runs}/{match.liveScore.firstInnings.wickets}
              <span className="text-sm font-medium text-text-muted ml-2">
                ({match.liveScore.firstInnings.overs} ov)
              </span>
            </p>
          )}
          {chaseTarget != null && (
            <p className="text-sm text-amber-800 mt-3">
              Target: <span className="font-bold text-lg">{chaseTarget}</span>
            </p>
          )}
          <p className="text-xs text-text-muted mt-4">Second innings will begin shortly</p>
        </div>
        {match.scorecard?.batting?.length > 0 && (
          <LiveScorecard
            variant="viewer"
            scorecard={match.scorecard}
            battingTeamName={`${firstInningsTeamName} (1st Innings)`}
            liveScore={{
              ...match.liveScore,
              totalRuns: match.liveScore?.firstInnings?.runs ?? 0,
              wickets: match.liveScore?.firstInnings?.wickets ?? 0,
              overs: match.liveScore?.firstInnings?.overs ?? "0.0",
            }}
            matchOvers={match?.overs ?? 20}
            teamAName={teamLabel(match.teamA, match.teamASlot)}
            teamBName={teamLabel(match.teamB, match.teamBSlot)}
            match={match}
          />
        )}
      </div>
    ) : (
      <LiveScorecard
        variant="viewer"
        scorecard={match.scorecard}
        battingTeamName={battingTeamName(match)}
        liveScore={match.liveScore}
        matchOvers={match?.overs ?? 20}
        teamAName={teamLabel(match.teamA, match.teamASlot)}
        teamBName={teamLabel(match.teamB, match.teamBSlot)}
        lastWicket={match.lastWicket}
        recentBalls={match.recentBalls}
        match={match}
      />
    )
  );

  useEffect(() => {
    if (!match || !tournamentId || tab !== "squads") return;

    const idA = teamId(match.teamA);
    const idB = teamId(match.teamB);
    if (!idA && !idB) return;

    (async () => {
      setSquadsLoading(true);
      try {
        const [resA, resB] = await Promise.all([
          idA ? publicAPI.getTeamSquad(tournamentId, idA) : Promise.resolve({ data: { data: { players: [] } } }),
          idB ? publicAPI.getTeamSquad(tournamentId, idB) : Promise.resolve({ data: { data: { players: [] } } }),
        ]);
        setSquadA(resA.data.data?.players || []);
        setSquadB(resB.data.data?.players || []);
      } catch {
        setSquadA([]);
        setSquadB([]);
      } finally {
        setSquadsLoading(false);
      }
    })();
  }, [match, tournamentId, tab]);

  const isLive = match?.status === "Live";
  const isCompleted = match?.status === "Completed";
  const playingXIA = match?.matchResult?.playingXI?.teamA || match?.teamAPlayingXI || [];
  const playingXIB = match?.matchResult?.playingXI?.teamB || match?.teamBPlayingXI || [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageReveal}
      className="min-h-screen safe-overflow bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.06),transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)]"
    >
      <PublicViewerHeader
        title="Match Details"
        subtitle={tournament?.tournamentName}
        backTo={`/viewer/${tournamentId}`}
        backLabel="Fixtures"
      />

      <main className="relative safe-overflow">
        <BackgroundDecor />
        <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />

        <div className="section-container relative py-6 sm:py-8 pb-12 sm:pb-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading match…</p>
            </div>
          ) : error || !match ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center max-w-lg mx-auto shadow-sm">
              <p className="text-sm text-red-600 font-medium">{error || "Match not found"}</p>
              <Link
                to={tournamentId ? `/viewer/${tournamentId}` : "/viewer"}
                className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to fixtures
              </Link>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <PublicMatchHeader
                match={match}
                tournament={tournament}
                belowScoreboard={
                  isLiveScoring && !awaitingSecondInnings ? (
                    <RecentDeliveriesStrip recentBalls={match.recentBalls} />
                  ) : null
                }
              />

              <PublicSponsorsSection sponsors={tournament?.sponsors} title="Match Sponsors" />

              <div className="flex gap-1 rounded-[14px] bg-white border border-slate-200/70 p-1 shadow-sm min-w-0 overflow-hidden">
                {tabs.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex-1 min-w-0 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                      tab === id
                        ? "bg-primary/10 text-primary"
                        : "text-text-muted hover:text-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "liveScore" && (
                isMatchResult ? (
                  <PublicMatchResult matchResult={match.matchResult} match={match} />
                ) : isLiveScoring ? (
                  liveScoreView
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm text-text-muted">Live score will appear once scoring begins.</p>
                  </div>
                )
              )}

              {tab === "playingXI" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <PublicPlayingXIColumn
                    team={match.teamA}
                    slot={match.teamASlot}
                    players={playingXIA}
                    loading={false}
                    isLive={isLive}
                    isCompleted={isCompleted}
                    showMatchStats={isMatchResult}
                  />
                  <PublicPlayingXIColumn
                    team={match.teamB}
                    slot={match.teamBSlot}
                    players={playingXIB}
                    loading={false}
                    isLive={isLive}
                    isCompleted={isCompleted}
                    showMatchStats={isMatchResult}
                  />
                </div>
              )}

              {tab === "squads" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <PublicSquadColumn
                    team={match.teamA}
                    slot={match.teamASlot}
                    players={squadA}
                    loading={squadsLoading}
                  />
                  <PublicSquadColumn
                    team={match.teamB}
                    slot={match.teamBSlot}
                    players={squadB}
                    loading={squadsLoading}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
