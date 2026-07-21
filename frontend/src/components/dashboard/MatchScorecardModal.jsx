import { useCallback, useEffect, useState } from "react";
import { X, ExternalLink, Loader2, ClipboardList } from "lucide-react";
import DashboardFormModal, { DASHBOARD_MODAL_MAX_HEIGHT } from "./DashboardFormModal";
import MatchSummaryPanel from "./MatchSummaryPanel";
import { matchesAPI } from "../../api/matches";

export default function MatchScorecardModal({ open, onClose, match, tournamentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const matchId = match?._id;

  const fetchSummary = useCallback(async () => {
    if (!matchId || !open) return;
    setLoading(true);
    setError("");
    try {
      const { data: res } = await matchesAPI.getSummary(matchId);
      setData(res.data);
    } catch (err) {
      setError(err?.message || "Failed to load scorecard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [matchId, open]);

  useEffect(() => {
    if (open) fetchSummary();
    else {
      setData(null);
      setError("");
    }
  }, [open, fetchSummary]);

  const openViewer = () => {
    if (!tournamentId || !matchId) return;
    const url = `/viewer/${tournamentId}/match/${matchId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardFormModal
      open={open}
      onClose={onClose}
      zIndex={75}
      maxWidthClass="max-w-5xl"
      maxHeightClass={DASHBOARD_MODAL_MAX_HEIGHT}
      header={
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-secondary truncate">Scorecard</h2>
              <p className="text-xs text-text-muted truncate">
                {match?.teamA?.name || "TBD"} vs {match?.teamB?.name || "TBD"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openViewer}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Viewer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      }
      footer={
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={openViewer}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Viewer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-text-muted">Loading scorecard…</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchSummary}
            className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15"
          >
            Retry
          </button>
        </div>
      ) : (
        <MatchSummaryPanel data={data} />
      )}
    </DashboardFormModal>
  );
}
