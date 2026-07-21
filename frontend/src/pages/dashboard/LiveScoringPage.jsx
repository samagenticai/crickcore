import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Radio, Swords, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { scoringAPI } from "../../api/scoring";
import LiveScoringPanel from "../../components/dashboard/LiveScoringPanel";

const teamLabel = (team, slot) => (team && team.name) || slot?.label || "TBD";

function LiveMatchCard({ match, selected, onSelect }) {
  const ls = match.liveScore || {};

  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        selected
          ? "border-primary/40 bg-primary/5 shadow-md"
          : "border-slate-200/80 bg-white hover:border-primary/25 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
          <Radio className="w-3 h-3 animate-pulse" />
          LIVE
        </span>
        <ChevronRight className={`w-4 h-4 text-text-muted ${selected ? "text-primary" : ""}`} />
      </div>

      <p className="text-sm font-bold text-secondary leading-snug">
        {teamLabel(match.teamA, match.teamASlot)}{" "}
        <span className="text-text-muted font-medium">vs</span>{" "}
        {teamLabel(match.teamB, match.teamBSlot)}
      </p>

      <p className="text-xs text-text-muted mt-1 truncate">
        {match.tournament?.tournamentName || "Tournament"}
        {match.round ? ` · ${match.round}` : ""}
      </p>

      {ls.isInitialized ? (
        <p className="mt-2 text-lg font-extrabold text-secondary">
          {ls.totalRuns ?? 0}/{ls.wickets ?? 0}
          <span className="text-sm font-semibold text-text-muted ml-2">({ls.overs ?? "0.0"} ov)</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-amber-700 font-semibold">Scoring not started</p>
      )}
    </button>
  );
}

export default function LiveScoringPage() {
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const fetchLiveMatches = useCallback(async () => {
    try {
      const { data } = await scoringAPI.getLiveMatches();
      const list = data.data || [];
      setMatches(list);
      setSelectedMatch((prev) => {
        if (!prev) return null;
        return list.find((m) => m._id === prev._id) || prev;
      });
    } catch (err) {
      toast.error(err?.message || "Failed to load live matches");
      setMatches([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchLiveMatches();
      setLoading(false);
    })();
  }, [fetchLiveMatches]);

  useEffect(() => {
    const matchId = location.state?.matchId;
    if (!matchId || matches.length === 0) return;
    const found = matches.find((m) => String(m._id) === String(matchId));
    if (found) setSelectedMatch(found);
  }, [location.state, matches]);

  // Pause sidebar polling while scoring — the panel owns live state after each ball.
  useEffect(() => {
    if (selectedMatch) return undefined;
    const id = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(id);
  }, [fetchLiveMatches, selectedMatch]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-[1.5rem] border border-red-200/60 bg-gradient-to-r from-red-50/80 via-white to-primary/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Radio className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider">Live Scoring</span>
        </div>
        <h2 className="text-2xl font-semibold text-secondary">Score Live Matches</h2>
        <p className="mt-2 text-sm text-text-muted">
          Select a live match to open the scoring panel. Every ball is saved to MongoDB.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading live matches…</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="card-premium py-16 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Swords className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary">No live matches</h3>
          <p className="text-sm text-text-muted mt-1 max-w-sm">
            Start a match from the Matches page to begin live scoring here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          <div className="lg:col-span-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">
              {matches.length} live match{matches.length !== 1 ? "es" : ""}
            </p>
            {matches.map((match) => (
              <LiveMatchCard
                key={match._id}
                match={match}
                selected={selectedMatch?._id === match._id}
                onSelect={setSelectedMatch}
              />
            ))}
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedMatch ? (
                <motion.div
                  key={selectedMatch._id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="card-premium p-4 sm:p-6"
                >
                  <LiveScoringPanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-premium py-20 flex flex-col items-center text-center px-6"
                >
                  <Swords className="w-10 h-10 text-primary/30 mb-3" />
                  <p className="text-sm font-semibold text-secondary">Select a live match</p>
                  <p className="text-xs text-text-muted mt-1">Click a match on the left to open the scoring panel</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
