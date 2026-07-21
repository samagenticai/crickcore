import { useEffect, useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { scoringAPI } from "../../api/scoring";
import { useInFlightLock } from "../../hooks/useInFlightLock";
import { getChasingTeamId, resolveChaseTarget } from "../../utils/liveScore";
import { resolveBattingTeamFromToss } from "../../utils/toss";
import {
  bowlingLimitMessage,
  buildBowlerSelectOptions,
  getMaxOversPerBowler,
} from "../../utils/bowlingLimits";
import {
  filterEligibleBowlers,
  formatPlayerSelectLabel,
  playerId,
  sortPlayersByRole,
} from "../../utils/playerRoles";
import {
  LiveScoreModal,
  LiveScoreModalBody,
  LiveScoreModalHeader,
  liveScoreFieldClass,
  liveScoreLabelClass,
} from "./live-score/LiveScoreModal";

const teamLabel = (team) => team?.name || "Team";

export default function ScoringInitModal({ open, match, liveScore, onClose, onInitialized }) {
  const [battingTeamId, setBattingTeamId] = useState("");
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const { isLocked, withLock } = useInFlightLock();

  const teamAId = match?.teamA?._id || match?.teamA;
  const teamBId = match?.teamB?._id || match?.teamB;
  const xiA = useMemo(() => sortPlayersByRole(match?.teamAPlayingXI || []), [match?.teamAPlayingXI]);
  const xiB = useMemo(() => sortPlayersByRole(match?.teamBPlayingXI || []), [match?.teamBPlayingXI]);

  const isSecondInnings = Boolean(liveScore?.awaitingSecondInnings);
  const tossBattingId = useMemo(
    () => (match ? resolveBattingTeamFromToss(match) : null),
    [match]
  );
  const chasingTeamId = useMemo(
    () => (isSecondInnings ? getChasingTeamId(match, liveScore) : null),
    [isSecondInnings, match, liveScore]
  );

  const effectiveBattingId = useMemo(() => {
    if (isSecondInnings) {
      return chasingTeamId || (liveScore?.battingTeam ? String(liveScore.battingTeam) : "");
    }
    return battingTeamId;
  }, [isSecondInnings, chasingTeamId, liveScore?.battingTeam, battingTeamId]);

  const battingXI =
    effectiveBattingId === String(teamAId)
      ? xiA
      : effectiveBattingId === String(teamBId)
        ? xiB
        : [];
  const bowlingXI =
    effectiveBattingId === String(teamAId)
      ? xiB
      : effectiveBattingId === String(teamBId)
        ? xiA
        : [];
  const eligibleBowlers = filterEligibleBowlers(bowlingXI);
  const matchOvers = match?.overs ?? 20;
  const maxOversPerBowler = getMaxOversPerBowler(matchOvers);
  const bowlerOptions = buildBowlerSelectOptions(bowlingXI, null, matchOvers);
  const selectableBowlers = bowlerOptions.filter((o) => !o.atLimit);

  useEffect(() => {
    if (open && match) {
      const defaultBatting = isSecondInnings
        ? String(chasingTeamId || liveScore?.battingTeam || "")
        : String(tossBattingId || teamAId || "");
      setBattingTeamId(defaultBatting);
      setStrikerId("");
      setNonStrikerId("");
      setBowlerId("");
    }
  }, [open, match, teamAId, isSecondInnings, chasingTeamId, liveScore?.battingTeam, tossBattingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error("Select striker, non-striker, and bowler");
      return;
    }
    const pickedBowler = bowlerOptions.find((o) => o.id === bowlerId);
    if (pickedBowler?.atLimit) {
      toast.error(bowlingLimitMessage(matchOvers));
      return;
    }
    if (!effectiveBattingId) {
      toast.error("Could not determine the chasing team for second innings");
      return;
    }
    try {
      await withLock(async () => {
        const { data } = await scoringAPI.initScoring(match._id, {
          battingTeamId: effectiveBattingId,
          strikerId,
          nonStrikerId,
          bowlerId,
        });
        toast.success(isSecondInnings ? "Second innings started" : "Scoring started");
        onInitialized?.(data.data);
        onClose();
      });
    } catch (err) {
      toast.error(err?.message || "Failed to initialize scoring");
    }
  };

  if (!match) return null;

  const chasingTeamName = useMemo(() => {
    const id = effectiveBattingId || chasingTeamId;
    if (!id) return "Chasing team";
    return id === String(teamAId) ? teamLabel(match.teamA) : teamLabel(match.teamB);
  }, [effectiveBattingId, chasingTeamId, teamAId, match]);

  const tossBattingName =
    tossBattingId === String(teamAId) ? teamLabel(match.teamA) : teamLabel(match.teamB);

  const chaseTarget = resolveChaseTarget(liveScore);

  const subtitle = [
    `${teamLabel(match.teamA)} vs ${teamLabel(match.teamB)}`,
    isSecondInnings && chaseTarget != null ? `Target: ${chaseTarget} runs` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <LiveScoreModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      closeOnBackdrop={!isLocked}
    >
      <LiveScoreModalHeader
        icon={Play}
        badge={isSecondInnings ? "2nd Innings" : "Setup"}
        title={isSecondInnings ? "Start Second Innings" : "Initialize Scoring"}
        subtitle={subtitle}
        onClose={isLocked ? undefined : onClose}
      />
      <LiveScoreModalBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={liveScoreLabelClass}>Batting team</label>
            {isSecondInnings ? (
              <p className={`${liveScoreFieldClass} font-semibold bg-slate-50`}>{chasingTeamName}</p>
            ) : tossBattingId ? (
              <p className={`${liveScoreFieldClass} font-semibold bg-slate-50`}>
                {tossBattingName}
                <span className="block text-xs font-normal text-text-muted mt-1">
                  Set from toss — {match.tossDecision === "Bat" ? "chose to bat first" : "chose to bowl first"}
                </span>
              </p>
            ) : (
              <select
                value={battingTeamId}
                onChange={(e) => {
                  setBattingTeamId(e.target.value);
                  setStrikerId("");
                  setNonStrikerId("");
                  setBowlerId("");
                }}
                className={liveScoreFieldClass}
              >
                <option value={String(teamAId)}>{teamLabel(match.teamA)}</option>
                <option value={String(teamBId)}>{teamLabel(match.teamB)}</option>
              </select>
            )}
          </div>

          <div>
            <label className={liveScoreLabelClass}>Striker</label>
            <select
              value={strikerId}
              onChange={(e) => setStrikerId(e.target.value)}
              className={liveScoreFieldClass}
            >
              <option value="">Select striker</option>
                    {battingXI.map((p) => (
                      <option key={playerId(p)} value={playerId(p)} disabled={playerId(p) === nonStrikerId}>
                        {formatPlayerSelectLabel(p)}
                      </option>
                    ))}
            </select>
          </div>

          <div>
            <label className={liveScoreLabelClass}>Non-striker</label>
            <select
              value={nonStrikerId}
              onChange={(e) => setNonStrikerId(e.target.value)}
              className={liveScoreFieldClass}
            >
              <option value="">Select non-striker</option>
              {battingXI.map((p) => (
                <option key={playerId(p)} value={playerId(p)} disabled={playerId(p) === strikerId}>
                        {formatPlayerSelectLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={liveScoreLabelClass}>Opening bowler</label>
            <select
              value={bowlerId}
              onChange={(e) => setBowlerId(e.target.value)}
              className={liveScoreFieldClass}
            >
              <option value="">Select bowler (Bowler or All-Rounder only)</option>
              {bowlerOptions.map(({ id, atLimit, label }) => (
                <option key={id} value={id} disabled={atLimit}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-text-muted">
              Max {maxOversPerBowler} over{maxOversPerBowler === 1 ? "" : "s"} per bowler this innings
            </p>
            {bowlingXI.length > 0 && eligibleBowlers.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-700">
                No eligible bowlers in this XI. Assign Bowler or All-Rounder roles first.
              </p>
            )}
            {eligibleBowlers.length > 0 && selectableBowlers.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-700">
                All eligible bowlers have reached the maximum bowling limit ({maxOversPerBowler} overs).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isLocked ||
              !strikerId ||
              !nonStrikerId ||
              !bowlerId ||
              eligibleBowlers.length === 0
            }
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
          >
            {isLocked ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isSecondInnings ? "Start 2nd Innings" : "Start Scoring"}
          </button>
        </form>
      </LiveScoreModalBody>
    </LiveScoreModal>
  );
}
