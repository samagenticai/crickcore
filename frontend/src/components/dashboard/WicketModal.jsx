import { useEffect, useMemo, useState } from "react";
import { Loader2, UserX } from "lucide-react";
import { DISMISSAL_TYPES } from "./live-score/ScorecardParts";
import {
  LiveScoreModal,
  LiveScoreModalAccent,
  LiveScoreModalBody,
  LiveScoreModalHeader,
  liveScoreFieldClass,
  liveScoreLabelClass,
} from "./live-score/LiveScoreModal";
import {
  filterAvailableNewBatsmen,
  formatPlayerSelectLabel,
  playerId,
} from "../../utils/playerRoles";

export default function WicketModal({
  open,
  striker,
  nonStriker,
  availableBatsmen,
  dismissedPlayerIds = [],
  unavailableBatsmanIds = [],
  onClose,
  onConfirm,
  submitting,
}) {
  const [dismissedId, setDismissedId] = useState("");
  const [newBatsmanId, setNewBatsmanId] = useState("");
  const [dismissalType, setDismissalType] = useState("Bowled");

  useEffect(() => {
    if (!open) return;
    setDismissedId("");
    setNewBatsmanId("");
    setDismissalType("Bowled");
  }, [open]);

  const nextBatsmen = useMemo(
    () =>
      filterAvailableNewBatsmen(availableBatsmen, {
        striker,
        nonStriker,
        dismissedIds: dismissedPlayerIds,
        unavailableIds: unavailableBatsmanIds,
      }),
    [availableBatsmen, striker, nonStriker, dismissedPlayerIds, unavailableBatsmanIds]
  );

  const handleConfirm = () => {
    if (submitting || !dismissedId || !newBatsmanId) return;
    onConfirm({ dismissedPlayerId: dismissedId, newBatsmanId, dismissalType });
  };

  return (
    <LiveScoreModal open={open} onClose={onClose} maxWidth="max-w-md" zIndex="z-[110]">
      <LiveScoreModalAccent className="bg-linear-to-r from-red-500 via-red-400 to-orange-400" />
      <LiveScoreModalHeader
        icon={UserX}
        title="Record Wicket"
        subtitle="Select the dismissed batsman and who comes in next"
        onClose={onClose}
      />
      <LiveScoreModalBody>
        <div className="space-y-4">
          <div>
            <label className={liveScoreLabelClass}>Who is out?</label>
            <select
              value={dismissedId}
              onChange={(e) => setDismissedId(e.target.value)}
              className={liveScoreFieldClass}
            >
              <option value="">Select batsman</option>
              {striker && (
                <option value={playerId(striker)}>
                  {formatPlayerSelectLabel(striker, "On strike")}
                </option>
              )}
              {nonStriker && (
                <option value={playerId(nonStriker)}>
                  {formatPlayerSelectLabel(nonStriker, "Non-strike")}
                </option>
              )}
            </select>
          </div>

          <div>
            <label className={liveScoreLabelClass}>Dismissal type</label>
            <select
              value={dismissalType}
              onChange={(e) => setDismissalType(e.target.value)}
              className={liveScoreFieldClass}
            >
              {DISMISSAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={liveScoreLabelClass}>New batsman</label>
            <select
              value={newBatsmanId}
              onChange={(e) => setNewBatsmanId(e.target.value)}
              className={liveScoreFieldClass}
            >
              <option value="">Select next batsman</option>
              {nextBatsmen.length === 0 ? (
                <option value="" disabled>
                  No available batsmen
                </option>
              ) : (
                nextBatsmen.map((p) => (
                  <option key={playerId(p)} value={playerId(p)}>
                    {formatPlayerSelectLabel(p)}
                  </option>
                ))
              )}
            </select>
            <p className="mt-1.5 text-xs text-text-muted">
              Only players who have not yet batted are listed (Batsmen → Wicket Keepers → All-Rounders → Bowlers).
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!dismissedId || !newBatsmanId || submitting || nextBatsmen.length === 0}
            className="mt-2 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Confirm Wicket"}
          </button>
        </div>
      </LiveScoreModalBody>
    </LiveScoreModal>
  );
}
