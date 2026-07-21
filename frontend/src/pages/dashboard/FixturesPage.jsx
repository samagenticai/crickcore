import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Calendar, Trophy, ChevronDown, Clock, Search, Loader2, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "../../api/tournaments";

const STATUS_CONFIG = {
  Scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  Live:       { color: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500",   pulse: true },
  Completed:  { color: "bg-emerald-50 text-emerald-700 border-emerald-200",dot: "bg-emerald-500" },
  Cancelled:  { color: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-400" },
};

const ROUND_COLORS = {
  "Final":       "bg-amber-100 text-amber-800 border-amber-300",
  "Semi Final":  "bg-purple-100 text-purple-700 border-purple-300",
  "Quarter Final": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "Round of 16": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "League":      "bg-slate-100 text-slate-600 border-slate-200",
};

// A "slot" side of the match — either a confirmed team, or a placeholder
// like "Winner Group A" / "Winner QF1" awaiting an earlier result.
function TeamSlot({ team, slot, isWinner, align = "left" }) {
  const justify = align === "right" ? "justify-end" : "";
  const textAlign = align === "right" ? "text-right" : "";

  if (!team) {
    return (
      <div className={`flex-1 flex items-center gap-2 min-w-0 ${justify} ${align === "right" ? "flex-row-reverse" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-3.5 h-3.5 text-slate-300" />
        </div>
        <span className={`text-xs font-medium text-text-muted italic truncate ${textAlign}`}>
          {slot?.label || "TBD"}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex items-center gap-2 min-w-0 ${justify} ${align === "right" ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border ${
          isWinner ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200 bg-primary/10"
        }`}
      >
        {team.logo ? (
          <img src={team.logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <Trophy className="w-4 h-4 text-primary/60" />
        )}
      </div>
      <span className={`text-sm font-semibold truncate flex items-center gap-1 ${textAlign} ${isWinner ? "text-emerald-700" : "text-secondary"}`}>
        {isWinner && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
        {team.name}
      </span>
    </div>
  );
}

function MatchCard({ match, index, onRecordResult }) {
  const [submitting, setSubmitting] = useState(false);
  const statusConf = STATUS_CONFIG[match.status] || STATUS_CONFIG.Scheduled;
  const roundConf = ROUND_COLORS[match.round] || ROUND_COLORS["League"];

  const teamAId = match.teamA?._id;
  const teamBId = match.teamB?._id;
  const winnerId = match.winner?._id || match.winner;
  const bothConfirmed = Boolean(teamAId && teamBId);
  const canRecordResult = bothConfirmed && match.status !== "Completed" && match.status !== "Cancelled";

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "TBD";

  const handleWin = async (winnerTeamId) => {
    setSubmitting(true);
    try {
      await onRecordResult(match._id, winnerTeamId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-premium p-4 hover:shadow-md transition-shadow"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-muted">#{match.matchNumber}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roundConf}`}>
            {match.round}
          </span>
          {match.leg === 2 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              Leg 2
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot} ${statusConf.pulse ? "animate-pulse" : ""}`} />
          {match.status}
        </span>
      </div>

      {/* Teams vs */}
      <div className="flex items-center gap-3 py-2">
        <TeamSlot team={match.teamA} slot={match.teamASlot} isWinner={winnerId === teamAId} align="left" />
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="text-xs font-bold text-text-muted">VS</span>
        </div>
        <TeamSlot team={match.teamB} slot={match.teamBSlot} isWinner={winnerId === teamBId} align="right" />
      </div>

      {/* Record result */}
      {canRecordResult && (
        <div className="flex items-center gap-2 mt-1 mb-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Mark winner:</span>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleWin(teamAId)}
            className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 truncate"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : match.teamA.name}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleWin(teamBId)}
            className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 truncate"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : match.teamB.name}
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Calendar className="w-3.5 h-3.5 text-primary/60" />
          {fmt(match.scheduledDate)}
        </div>
        {match.matchTime && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5 text-primary/60" />
            {match.matchTime}
          </div>
        )}
        {match.overs && (
          <div className="ml-auto text-xs font-medium text-text-muted">
            {match.overs} overs
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RoundGroup({ round, matches, onRecordResult }) {
  const [open, setOpen] = useState(true);
  const roundConf = ROUND_COLORS[round] || ROUND_COLORS["League"];
  const completedCount = matches.filter((m) => m.status === "Completed").length;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full group"
      >
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roundConf}`}>
          {round}
        </span>
        <span className="text-xs text-text-muted">
          {completedCount}/{matches.length} match{matches.length !== 1 ? "es" : ""} played
        </span>
        <div className="flex-1 h-px bg-slate-200" />
        <motion.div animate={{ rotate: open ? 0 : -90 }} className="text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {matches.map((m, i) => (
              <MatchCard key={m._id} match={m} index={i} onRecordResult={onRecordResult} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FixturesPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [searchRound, setSearchRound] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Load user's tournaments
  useEffect(() => {
    const load = async () => {
      setLoadingTournaments(true);
      try {
        const { data } = await tournamentAPI.getAll({ limit: 100 });
        const list = data.data || [];
        setTournaments(list);
        if (list.length > 0) setSelectedTournamentId(list[0]._id);
      } catch (err) {
        toast.error(err.message || "Failed to load tournaments");
      } finally {
        setLoadingTournaments(false);
      }
    };
    load();
  }, []);

  const fetchFixtures = useCallback(async () => {
    if (!selectedTournamentId) return;
    setLoading(true);
    try {
      const { data } = await tournamentAPI.getTournamentFixtures(selectedTournamentId);
      setFixtures(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load fixtures");
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  const handleRecordResult = useCallback(
    async (matchId, winnerTeamId) => {
      try {
        const { data } = await tournamentAPI.recordMatchResult(selectedTournamentId, matchId, winnerTeamId);
        setFixtures(data.data || []);
        // When the last match is recorded the backend auto-completes + locks the
        // tournament and returns the updated doc — reflect that here.
        if (data.tournament) {
          setTournaments((prev) =>
            prev.map((t) => (t._id === data.tournament._id ? { ...t, ...data.tournament } : t))
          );
        }
        toast.success(data.message || "Result recorded — winner advanced to the next round");
      } catch (err) {
        toast.error(err.message || "Failed to record match result");
      }
    },
    [selectedTournamentId]
  );

  // Group fixtures by round
  const filtered = fixtures.filter((m) => {
    const matchesRound = !searchRound || m.round?.toLowerCase().includes(searchRound.toLowerCase());
    const matchesStatus = !filterStatus || m.status === filterStatus;
    return matchesRound && matchesStatus;
  });

  const rounds = [...new Set(filtered.map((m) => m.round || "League"))];
  const groupedByRound = rounds.map((r) => ({
    round: r,
    matches: filtered.filter((m) => (m.round || "League") === r),
  }));

  const selectedTournament = tournaments.find((t) => t._id === selectedTournamentId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Match{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Fixtures
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-0.5">View and manage tournament match schedules</p>
        </div>
      </div>

      {/* Tournament selector */}
      <div className="card-premium p-4">
        {loadingTournaments ? (
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse w-64" />
        ) : tournaments.length === 0 ? (
          <p className="text-sm text-text-muted">No tournaments found. Create one first.</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-semibold text-secondary whitespace-nowrap">Tournament:</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="flex-1 max-w-md px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>{t.tournamentName}</option>
              ))}
            </select>
            {selectedTournament && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted bg-slate-100 px-3 py-1.5 rounded-lg">
                  {selectedTournament.tournamentType}
                </span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                  {fixtures.length} matches
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completed summary banner — final result, no ongoing details */}
      {selectedTournament?.status === "Completed" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-4 border-l-4 border-emerald-500"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">
                  Tournament Completed
                </p>
                <p className="text-xs text-text-muted">
                  🏆 {selectedTournament.winner?.name || "—"} &nbsp;·&nbsp; 🥈 {selectedTournament.runnerUp?.name || "—"}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
              Locked
            </span>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      {fixtures.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by round..."
              value={searchRound}
              onChange={(e) => setSearchRound(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
          >
            <option value="">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Fixtures */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-text-muted">Loading fixtures...</p>
        </div>
      ) : fixtures.length === 0 ? (
        <div className="card-premium flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <p className="text-base font-bold text-secondary">No fixtures yet</p>
            <p className="text-sm text-text-muted mt-1">
              Go to Tournaments, select a tournament, add teams, then generate fixtures.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByRound.map(({ round, matches }) => (
            <RoundGroup key={round} round={round} matches={matches} onRecordResult={handleRecordResult} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
