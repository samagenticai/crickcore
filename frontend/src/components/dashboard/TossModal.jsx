import { useEffect, useMemo, useState } from "react";
import { Coins, Play, Swords } from "lucide-react";
import { formatTossDecisionLabel } from "../../utils/toss";
import {
  LiveScoreModal,
  LiveScoreModalAccent,
  LiveScoreModalBody,
  LiveScoreModalFooter,
  LiveScoreModalHeader,
  liveScoreLabelClass,
} from "./live-score/LiveScoreModal";

function teamName(team, slot) {
  return (team && team.name) || slot?.label || "TBD";
}

function teamId(team) {
  if (!team) return null;
  return typeof team === "object" ? team._id : team;
}

export default function TossModal({ open, onClose, match, onConfirm }) {
  const [tossWinnerId, setTossWinnerId] = useState("");
  const [tossDecision, setTossDecision] = useState("");

  const idA = teamId(match?.teamA);
  const idB = teamId(match?.teamB);
  const nameA = teamName(match?.teamA, match?.teamASlot);
  const nameB = teamName(match?.teamB, match?.teamBSlot);

  useEffect(() => {
    if (open && match) {
      setTossWinnerId("");
      setTossDecision("");
    }
  }, [open, match?._id]);

  const canConfirm = useMemo(
    () => Boolean(tossWinnerId && tossDecision && idA && idB),
    [tossWinnerId, tossDecision, idA, idB]
  );

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm?.({
      tossWinner: tossWinnerId,
      tossDecision,
    });
  };

  if (!open) return null;

  return (
    <LiveScoreModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      closeOnBackdrop
      zIndex="z-[110]"
    >
      <LiveScoreModalAccent className="bg-linear-to-r from-amber-400 via-primary to-accent" />
      <LiveScoreModalHeader
        icon={Coins}
        badge="Toss"
        title="Record Toss"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary">{nameA}</span>
            <Swords className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-secondary">{nameB}</span>
          </span>
        }
        onClose={onClose}
      />

      <LiveScoreModalBody>
        {!match ? (
          <p className="text-sm text-text-muted py-8 text-center">Loading match…</p>
        ) : (
          <>
        <p className="text-sm text-text-muted mb-5">
          Select the toss winner and decision before choosing Playing XI. The match cannot start until
          the toss is recorded.
        </p>

        <div className="space-y-5">
          <div>
            <p className={liveScoreLabelClass}>Toss won by</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {[idA, idB].map((id, idx) => {
                const label = idx === 0 ? nameA : nameB;
                const selected = tossWinnerId === String(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTossWinnerId(String(id))}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-colors ${
                      selected
                        ? "border-primary/40 bg-primary/5 text-secondary"
                        : "border-slate-200 bg-white text-secondary hover:border-primary/25"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className={liveScoreLabelClass}>Decision</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {["Bat", "Bowl"].map((dec) => {
                const selected = tossDecision === dec;
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => setTossDecision(dec)}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      selected
                        ? "border-primary/40 bg-primary/5 text-secondary"
                        : "border-slate-200 bg-white text-secondary hover:border-primary/25"
                    }`}
                  >
                    {formatTossDecisionLabel(dec)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
          </>
        )}
      </LiveScoreModalBody>

      <LiveScoreModalFooter>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || !match}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              canConfirm && match
                ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Play className="w-4 h-4" />
            Continue to Match Setup
          </button>
        </div>
      </LiveScoreModalFooter>
    </LiveScoreModal>
  );
}
