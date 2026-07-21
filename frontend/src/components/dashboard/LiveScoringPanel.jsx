import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CircleDot,
  Flag,
  Loader2,
  Play,
  Radio,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { scoringAPI } from "../../api/scoring";
import { useInFlightLock } from "../../hooks/useInFlightLock";
import {
  collectUnavailableBatsmanIds,
  sortPlayersByRole,
} from "../../utils/playerRoles";
import {
  bowlingLimitMessage,
  buildBowlerSelectOptions,
  consecutiveOverMessage,
  getMaxOversPerBowler,
} from "../../utils/bowlingLimits";
import { getConsecutiveOverExcludedBowlerId } from "../../utils/bowlingRotation";
import { formatMatchUmpiresLine } from "../../utils/umpireDisplay";
import { formatMatchScorerLine } from "../../utils/scorerDisplay";
import { resolveChaseTarget } from "../../utils/liveScore";
import { formatTossResult } from "../../utils/toss";
import LiveScorecard from "./live-score/LiveScorecard";
import PublicSponsorsSection from "../viewer/PublicSponsorsSection";
import {
  LiveScoreModal,
  LiveScoreModalAccent,
  LiveScoreModalBody,
  LiveScoreModalHeader,
} from "./live-score/LiveScoreModal";
import ScoringInitModal from "./ScoringInitModal";
import WicketModal from "./WicketModal";

const SCORE_BUTTONS = [
  { type: "runs", runs: 0, label: "0", tone: "bg-slate-100 text-secondary hover:bg-slate-200 border-slate-200" },
  { type: "runs", runs: 1, label: "1", tone: "bg-white text-secondary hover:bg-slate-50 border-slate-200" },
  { type: "runs", runs: 2, label: "2", tone: "bg-white text-secondary hover:bg-slate-50 border-slate-200" },
  { type: "runs", runs: 3, label: "3", tone: "bg-white text-secondary hover:bg-slate-50 border-slate-200" },
  { type: "runs", runs: 4, label: "4", tone: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200" },
  { type: "runs", runs: 6, label: "6", tone: "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200" },
  { type: "wide", label: "Wd", tone: "bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200" },
  { type: "no_ball", label: "Nb", tone: "bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200" },
  { type: "bye", label: "Bye", tone: "bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200" },
  { type: "leg_bye", label: "Lb", tone: "bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200" },
  { type: "wicket", label: "W", tone: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" },
];

const ballLabel = (ball) => {
  if (ball.type === "wicket") return "W";
  if (ball.type === "wide") return ball.runs > 1 ? `Wd+${ball.runs - 1}` : "Wd";
  if (ball.type === "no_ball") return ball.batsmanRuns ? `Nb+${ball.batsmanRuns}` : "Nb";
  if (ball.type === "bye") return `B${ball.runs}`;
  if (ball.type === "leg_bye") return `Lb${ball.runs}`;
  return String(ball.runs);
};

const teamName = (team) => team?.name || "Team";

export default function LiveScoringPanel({ match: initialMatch, onClose }) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initOpen, setInitOpen] = useState(false);
  const [wicketOpen, setWicketOpen] = useState(false);
  const [bowlerSelectOpen, setBowlerSelectOpen] = useState(false);
  const [endInningsOpen, setEndInningsOpen] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState("");
  const { isLocked, withLock } = useInFlightLock();
  const fetchedRef = useRef(false);

  const match = scoreData?.match || initialMatch;
  const liveScore = scoreData?.liveScore;
  const recentBalls = scoreData?.recentBalls || [];
  const scorecard = scoreData?.scorecard;

  const syncScoreData = useCallback((payload) => {
    setScoreData({
      match: payload.match,
      liveScore: payload.liveScore,
      recentBalls: payload.recentBalls,
      scorecard: payload.scorecard,
    });
  }, []);

  const fetchScore = useCallback(async () => {
    if (!initialMatch?._id) return;
    try {
      const { data } = await scoringAPI.getMatchScore(initialMatch._id);
      syncScoreData(data.data);
      const ls = data.data?.liveScore;
      if (!ls?.isInitialized && (ls?.awaitingSecondInnings || !ls?.firstInnings?.runs)) {
        setInitOpen(true);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to load score");
    } finally {
      setLoading(false);
    }
  }, [initialMatch?._id, syncScoreData]);

  useEffect(() => {
    if (!initialMatch?._id) return;
    fetchedRef.current = false;
    setLoading(true);
  }, [initialMatch?._id]);

  useEffect(() => {
    if (!initialMatch?._id || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchScore();
  }, [initialMatch?._id, fetchScore]);

  const bowlingXI = useMemo(() => {
    if (!match || !liveScore?.bowlingTeam) return [];
    const bowlId = String(liveScore.bowlingTeam);
    const aId = String(match.teamA?._id || match.teamA);
    const xi = bowlId === aId ? (match.teamAPlayingXI || []) : (match.teamBPlayingXI || []);
    return sortPlayersByRole(xi);
  }, [match, liveScore]);

  const battingXI = useMemo(() => {
    if (!match || !liveScore?.battingTeam) return [];
    const batId = String(liveScore.battingTeam);
    const aId = String(match.teamA?._id || match.teamA);
    const xi = batId === aId ? (match.teamAPlayingXI || []) : (match.teamBPlayingXI || []);
    return sortPlayersByRole(xi);
  }, [match, liveScore]);

  const battingTeamName = useMemo(() => {
    if (!match || !liveScore?.battingTeam) return "Batting";
    const batId = String(liveScore.battingTeam);
    const aId = String(match.teamA?._id || match.teamA);
    return aId === batId ? teamName(match.teamA) : teamName(match.teamB);
  }, [match, liveScore]);

  const matchOvers = match?.overs ?? 20;
  const maxOversPerBowler = useMemo(() => getMaxOversPerBowler(matchOvers), [matchOvers]);
  const excludeConsecutiveBowler = useMemo(
    () => getConsecutiveOverExcludedBowlerId(liveScore),
    [liveScore]
  );
  const bowlerOptions = useMemo(
    () => buildBowlerSelectOptions(bowlingXI, scorecard, matchOvers, excludeConsecutiveBowler),
    [bowlingXI, scorecard, matchOvers, excludeConsecutiveBowler]
  );
  const selectableBowlers = useMemo(
    () => bowlerOptions.filter((o) => !o.atLimit && !o.consecutiveBlocked),
    [bowlerOptions]
  );
  useEffect(() => {
    if (
      liveScore?.overBreakPending &&
      liveScore?.isInitialized &&
      !liveScore?.awaitingSecondInnings
    ) {
      setBowlerSelectOpen(true);
      setSelectedBowler("");
    }
  }, [liveScore?.overBreakPending, liveScore?.isInitialized, liveScore?.awaitingSecondInnings]);

  useEffect(() => {
    if (liveScore?.awaitingSecondInnings && !liveScore?.isInitialized) {
      setBowlerSelectOpen(false);
      setInitOpen(true);
    }
  }, [liveScore?.awaitingSecondInnings, liveScore?.isInitialized]);

  useEffect(() => {
    if (!selectedBowler) return;
    const picked = bowlerOptions.find((o) => o.id === selectedBowler);
    if (picked?.atLimit) setSelectedBowler("");
  }, [bowlerOptions, selectedBowler]);

  const unavailableBatsmanIds = useMemo(
    () => collectUnavailableBatsmanIds(liveScore, scorecard),
    [liveScore, scorecard]
  );

  const chaseTarget = useMemo(() => resolveChaseTarget(liveScore), [liveScore]);
  const tossText = useMemo(() => formatTossResult(match), [match]);
  const firstInningsBattingTeamName = useMemo(() => {
    if (!match || !liveScore?.firstInnings?.battingTeam) return "1st Innings";
    const batId = String(liveScore.firstInnings.battingTeam);
    const aId = String(match.teamA?._id || match.teamA);
    return aId === batId ? teamName(match.teamA) : teamName(match.teamB);
  }, [match, liveScore]);
  const umpiresLine = useMemo(() => formatMatchUmpiresLine(match), [match]);
  const scorerLine = useMemo(() => formatMatchScorerLine(match), [match]);

  const lastWicket = useMemo(() => {
    const out = scorecard?.batting?.filter((b) => b.status === "out");
    const last = out?.[out.length - 1];
    if (!last) return null;
    return {
      playerName: last.name,
      dismissalType: last.dismissal?.type || last.dismissal?.text || "Out",
    };
  }, [scorecard]);

  const labeledRecentBalls = useMemo(
    () => recentBalls.map((b) => ({ ...b, label: b.label || ballLabel(b) })),
    [recentBalls]
  );

  const applyScoreResponse = useCallback((data) => {
    syncScoreData(data);
    if (data.needsBowlerChange) {
      setBowlerSelectOpen(true);
      setSelectedBowler("");
    }
    if (data.awaitingSecondInnings) {
      setBowlerSelectOpen(false);
      setInitOpen(true);
      toast.info("First innings complete — set up second innings");
    }
    if (data.matchComplete) {
      setBowlerSelectOpen(false);
      toast.success(data.match?.resultSummary || "Match completed");
    }
  }, [syncScoreData]);

  const recordBall = useCallback(
    async (payload) => {
      try {
        return await withLock(async () => {
          const { data } = await scoringAPI.recordBall(initialMatch._id, payload);
          applyScoreResponse(data.data);
          return data;
        });
      } catch (err) {
        toast.error(err?.message || "Failed to record ball");
        return null;
      }
    },
    [applyScoreResponse, initialMatch._id, withLock]
  );

  const handleScoreClick = (btn) => {
    if (!liveScore?.isInitialized || scoringDisabled) return;
    if (btn.type === "wicket") {
      setWicketOpen(true);
      return;
    }
    void recordBall({
      type: btn.type,
      runs: btn.runs ?? (btn.type === "bye" || btn.type === "leg_bye" ? 1 : 0),
    });
  };

  const handleWicket = async ({ dismissedPlayerId, newBatsmanId, dismissalType }) => {
    const result = await recordBall({
      type: "wicket",
      dismissedPlayerId,
      newBatsmanId,
      dismissalType,
    });
    if (result) setWicketOpen(false);
  };

  const handleBowlerChange = async () => {
    if (!selectedBowler || isLocked) return;
    const picked = bowlerOptions.find((o) => o.id === selectedBowler);
    if (picked?.atLimit) {
      toast.error(bowlingLimitMessage(matchOvers));
      return;
    }
    if (picked?.consecutiveBlocked) {
      toast.error(consecutiveOverMessage);
      return;
    }
    try {
      await withLock(async () => {
        const { data } = await scoringAPI.updateBowler(initialMatch._id, selectedBowler);
        syncScoreData(data.data);
        setBowlerSelectOpen(false);
        setSelectedBowler("");
        toast.success("Bowler updated");
      });
    } catch (err) {
      toast.error(err?.message || "Failed to update bowler");
    }
  };

  const handleEndInnings = async () => {
    try {
      await withLock(async () => {
        const { data } = await scoringAPI.endInnings(initialMatch._id);
        applyScoreResponse(data.data);
        setEndInningsOpen(false);
        toast.success("First innings ended");
      });
    } catch (err) {
      toast.error(err?.message || "Failed to end innings");
      if (err?.status === 404) {
        toast.error("Match not found — close and reopen live scoring from the matches list");
      }
    }
  };

  const matchCompleted = match?.status === "Completed";
  const canEndInnings =
    liveScore?.isInitialized &&
    !liveScore?.inningsLocked &&
    (liveScore?.inningsNumber ?? 1) === 1 &&
    !matchCompleted;
  const scoringDisabled = isLocked || bowlerSelectOpen || matchCompleted || liveScore?.inningsLocked;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading live scorecard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 mb-2">
              <Radio className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-secondary leading-tight">
              {teamName(match?.teamA)} vs {teamName(match?.teamB)}
            </h2>
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-primary/70 shrink-0" />
              {match?.tournament?.tournamentName || "Tournament"}
              {match?.round ? ` · ${match.round}` : ""}
            </p>
            {tossText && (
              <p className="text-xs text-text-muted mt-1.5">{tossText}</p>
            )}
            {umpiresLine && (
              <p className="text-xs text-text-muted mt-1">{umpiresLine}</p>
            )}
            {scorerLine && (
              <p className="text-xs text-text-muted mt-1">{scorerLine}</p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLocked}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-text-muted disabled:opacity-50 shrink-0"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <PublicSponsorsSection
          sponsors={match?.tournament?.sponsors}
          title="Sponsors"
        />

        {matchCompleted && match?.resultSummary && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-sm font-bold text-emerald-900">{match.resultSummary}</p>
          </div>
        )}

        {liveScore?.awaitingSecondInnings && !liveScore?.isInitialized && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center">
            <p className="text-sm font-semibold text-amber-900">First innings complete</p>
            {liveScore?.firstInnings && (
              <p className="text-2xl font-extrabold text-secondary tabular-nums mt-2">
                {liveScore.firstInnings.runs}/{liveScore.firstInnings.wickets}
                <span className="text-sm font-medium text-text-muted ml-2">
                  ({liveScore.firstInnings.overs} ov)
                </span>
              </p>
            )}
            {chaseTarget != null && (
              <p className="text-sm text-amber-800 mt-2">
                Target: <span className="font-bold">{chaseTarget}</span>
                {liveScore?.firstInnings?.runs != null && (
                  <span className="text-text-muted font-normal">
                    {" "}
                    (1st innings: {liveScore.firstInnings.runs})
                  </span>
                )}
              </p>
            )}
            <button
              type="button"
              onClick={() => setInitOpen(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              <Play className="w-4 h-4" />
              Start 2nd Innings
            </button>
            {scorecard?.batting?.length > 0 && (
              <div className="mt-6 text-left">
                <LiveScorecard
                  variant="details"
                  scorecard={scorecard}
                  battingTeamName={`${firstInningsBattingTeamName} (1st Innings)`}
                  liveScore={{
                    ...liveScore,
                    totalRuns: liveScore.firstInnings?.runs ?? 0,
                    wickets: liveScore.firstInnings?.wickets ?? 0,
                    overs: liveScore.firstInnings?.overs ?? "0.0",
                  }}
                  matchOvers={match?.overs ?? 20}
                  teamAName={teamName(match?.teamA)}
                  teamBName={teamName(match?.teamB)}
                  match={match}
                />
              </div>
            )}
          </div>
        )}

        {liveScore?.isInitialized ? (
          <>
            <LiveScorecard
              variant="compact"
              scorecard={scorecard}
              battingTeamName={battingTeamName}
              liveScore={liveScore}
              matchOvers={match?.overs ?? 20}
              teamAName={teamName(match?.teamA)}
              teamBName={teamName(match?.teamB)}
              lastWicket={lastWicket}
              recentBalls={labeledRecentBalls}
              match={match}
            />

            {bowlerSelectOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4"
              >
                <p className="text-xs font-bold text-amber-900 mb-1">Select next bowler</p>
                <p className="text-[11px] text-amber-800/90 mb-3">
                  Max {maxOversPerBowler} over{maxOversPerBowler === 1 ? "" : "s"} per bowler. A bowler
                  cannot bowl two consecutive overs.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedBowler}
                    onChange={(e) => setSelectedBowler(e.target.value)}
                    disabled={isLocked || selectableBowlers.length === 0}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-amber-200 text-sm bg-white"
                  >
                    <option value="">Select bowler</option>
                    {bowlerOptions.map(({ id, atLimit, consecutiveBlocked, label }) => (
                      <option key={id} value={id} disabled={atLimit || consecutiveBlocked}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBowlerChange}
                    disabled={!selectedBowler || isLocked || selectableBowlers.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {isLocked ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Set Bowler"}
                  </button>
                </div>
                {selectableBowlers.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-900">
                    No eligible bowler available. Please select another bowler.
                  </p>
                )}
              </motion.div>
            )}

            <div className="rounded-2xl border border-primary/20 bg-linear-to-b from-primary/5 to-white shadow-sm">
              <div className="px-4 py-3 border-b border-primary/10 bg-primary/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-secondary">Record Ball</h3>
                </div>
                <div className="flex items-center gap-2">
                  {canEndInnings && (
                    <button
                      type="button"
                      onClick={() => setEndInningsOpen(true)}
                      disabled={isLocked}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 disabled:opacity-50"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      End Innings
                    </button>
                  )}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving…
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-11 gap-2">
                  {SCORE_BUTTONS.map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      disabled={scoringDisabled}
                      onClick={() => handleScoreClick(btn)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-45 disabled:pointer-events-none ${btn.tone}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : !liveScore?.awaitingSecondInnings ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <CircleDot className="w-8 h-8 text-primary/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-secondary">Initialize scoring to begin</p>
            <button
              type="button"
              onClick={() => setInitOpen(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              <Play className="w-4 h-4" />
              Setup Innings
            </button>
          </div>
        ) : null}

      {liveScore?.isInitialized && (
        <LiveScorecard
          variant="details"
          scorecard={scorecard}
          battingTeamName={battingTeamName}
          liveScore={liveScore}
          matchOvers={match?.overs ?? 20}
          teamAName={teamName(match?.teamA)}
          teamBName={teamName(match?.teamB)}
          match={match}
        />
      )}

      <ScoringInitModal
        open={initOpen}
        match={match}
        liveScore={liveScore}
        onClose={() => setInitOpen(false)}
        onInitialized={(data) => {
          syncScoreData(data);
          setInitOpen(false);
          setBowlerSelectOpen(false);
          setSelectedBowler("");
        }}
      />

      <LiveScoreModal
        open={endInningsOpen}
        onClose={isLocked ? undefined : () => setEndInningsOpen(false)}
        maxWidth="max-w-sm"
        closeOnBackdrop={!isLocked}
      >
        <LiveScoreModalAccent className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-400" />
        <LiveScoreModalHeader
          icon={Flag}
          badge="Innings"
          title="End first innings?"
          onClose={isLocked ? undefined : () => setEndInningsOpen(false)}
        />
        <LiveScoreModalBody>
          <p className="text-sm leading-relaxed text-text-muted">
            This will lock the current score at{" "}
            <span className="font-bold text-secondary">
              {liveScore?.totalRuns ?? 0}/{liveScore?.wickets ?? 0}
            </span>{" "}
            and prepare the chase. No more runs can be added to this innings.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setEndInningsOpen(false)}
              disabled={isLocked}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEndInnings}
              disabled={isLocked}
              className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isLocked ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "End Innings"}
            </button>
          </div>
        </LiveScoreModalBody>
      </LiveScoreModal>

      <WicketModal
        open={wicketOpen}
        striker={liveScore?.striker}
        nonStriker={liveScore?.nonStriker}
        availableBatsmen={battingXI}
        unavailableBatsmanIds={unavailableBatsmanIds}
        onClose={() => !isLocked && setWicketOpen(false)}
        onConfirm={handleWicket}
        submitting={isLocked}
      />
    </div>
  );
}
