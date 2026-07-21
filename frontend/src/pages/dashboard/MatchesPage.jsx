import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Calendar, Clock, MapPin, Search, Trophy, LayoutGrid, List,
  Eye, Play, ClipboardList, TrendingUp, CheckCircle2, Radio, CalendarClock,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "../../api/tournaments";
import MatchSetupModal from "../../components/dashboard/MatchSetupModal";
import TossModal from "../../components/dashboard/TossModal";
import MatchScorecardModal from "../../components/dashboard/MatchScorecardModal";

// Match statuses as defined by the backend Match model.
const STATUS_CONFIG = {
  Scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  Live:      { color: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500", pulse: true },
  Completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { color: "bg-orange-50 text-orange-700 border-orange-200",    dot: "bg-orange-400" },
};

const FILTERS = ["All", "Scheduled", "Live", "Completed", "Cancelled"];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBD";

// Team A/B may be unresolved knockout placeholders (e.g. "Winner Group A").
const teamLabel = (team, slot) =>
  (team && team.name) || slot?.label || "TBD";

const initials = (name) => {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const groundOf = (tournament) => {
  const v = tournament?.venue;
  if (v && typeof v === "object" && v.venueName) return v.venueName;
  return tournament?.groundName || (typeof v === "string" ? v : null) || tournament?.city || "Venue TBD";
};

// ── Small building blocks ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.Scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${conf.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${conf.pulse ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

function TeamBadge({ team, slot, align = "left" }) {
  const name = teamLabel(team, slot);
  const resolved = Boolean(team && team.name);
  return (
    <div className={`flex flex-col items-center gap-2 flex-1 min-w-0 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
        {team?.logo ? (
          <img src={team.logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className={`text-base font-extrabold ${resolved ? "text-primary" : "text-primary/40"}`}>
            {resolved ? initials(name) : "?"}
          </span>
        )}
      </div>
      <p className={`text-sm font-bold text-center leading-tight line-clamp-2 w-full ${resolved ? "text-secondary" : "text-text-muted italic"}`}>
        {name}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-4 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-secondary leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function ActionButtons({ match, variant = "card", onStart, onView, onScorecard }) {
  const isCompleted = match.status === "Completed";
  const isLive = match.status === "Live";
  const canScorecard = isCompleted || isLive;
  const teamsResolved = Boolean(match.teamA?._id || match.teamA) && Boolean(match.teamB?._id || match.teamB);
  const canStart = match.status === "Scheduled" && teamsResolved;
  const base = variant === "card" ? "flex-1 justify-center py-2 text-xs" : "px-3 py-1.5 text-xs";

  return (
    <>
      <button
        type="button"
        onClick={() => onView?.(match)}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors ${base}`}
      >
        <Eye className="w-3.5 h-3.5" />
        View
      </button>
      <button
        type="button"
        disabled={!canStart}
        onClick={() => canStart && onStart?.(match)}
        title={!teamsResolved ? "Both teams must be confirmed" : undefined}
        className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors ${base} ${
          canStart ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-slate-50 text-slate-300 cursor-not-allowed"
        }`}
      >
        <Play className="w-3.5 h-3.5" />
        Start
      </button>
      <button
        type="button"
        disabled={!canScorecard}
        onClick={() => canScorecard && onScorecard?.(match)}
        title={
          canScorecard
            ? "View scorecard"
            : match.status === "Scheduled"
              ? "Available once the match starts"
              : "Scorecard unavailable"
        }
        className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors ${base} ${
          canScorecard ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-50 text-slate-300 cursor-not-allowed"
        }`}
      >
        <ClipboardList className="w-3.5 h-3.5" />
        Scorecard
      </button>
    </>
  );
}

// ── Match card ────────────────────────────────────────────────────────────
function MatchCard({ match, tournamentName, ground, onStartMatch, onViewMatch, onScorecard }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-premium overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-1.5 min-w-0">
          <Trophy className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
          <span className="text-xs font-semibold text-text-muted truncate">{tournamentName}</span>
        </div>
        <StatusBadge status={match.status} />
      </div>

      <div className="flex items-center gap-3 px-4 py-5">
        <TeamBadge team={match.teamA} slot={match.teamASlot} />
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-[10px] font-bold text-text-muted">VS</span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md mt-1">
            <Swords className="w-4 h-4 text-white" />
          </div>
        </div>
        <TeamBadge team={match.teamB} slot={match.teamBSlot} align="right" />
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Calendar className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
          <span className="truncate">{fmtDate(match.scheduledDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
          <span className="truncate">{match.matchTime || "TBD"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted col-span-2">
          <MapPin className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
          <span className="truncate">{ground}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 p-3">
        <ActionButtons
          match={match}
          variant="card"
          onStart={onStartMatch}
          onView={onViewMatch}
          onScorecard={onScorecard}
        />
      </div>
    </motion.div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────
function MatchRow({ match, tournamentName, ground, onStartMatch, onViewMatch, onScorecard }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-secondary">
          <span className="truncate max-w-[120px]">{teamLabel(match.teamA, match.teamASlot)}</span>
          <span className="text-[10px] text-text-muted">vs</span>
          <span className="truncate max-w-[120px]">{teamLabel(match.teamB, match.teamBSlot)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-text-muted hidden md:table-cell truncate max-w-[160px]">{tournamentName}</td>
      <td className="px-4 py-3 text-text-muted hidden lg:table-cell whitespace-nowrap">
        {fmtDate(match.scheduledDate)} · {match.matchTime || "TBD"}
      </td>
      <td className="px-4 py-3 text-text-muted hidden xl:table-cell truncate max-w-[180px]">{ground}</td>
      <td className="px-4 py-3"><StatusBadge status={match.status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <ActionButtons
            match={match}
            variant="table"
            onStart={onStartMatch}
            onView={onViewMatch}
            onScorecard={onScorecard}
          />
        </div>
      </td>
    </motion.tr>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="card-premium overflow-hidden p-4 space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
      </div>
      <div className="flex items-center gap-3 py-3">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="w-9 h-9 bg-slate-200 rounded-full animate-pulse" />
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded animate-pulse" />
      <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState("cards"); // "cards" | "table"
  const [startFlow, setStartFlow] = useState(null);
  const [scorecardMatch, setScorecardMatch] = useState(null);

  const handleViewMatch = useCallback(
    (match) => {
      if (!selectedId || !match?._id) return;
      navigate(`/viewer/${selectedId}/match/${match._id}`);
    },
    [selectedId, navigate]
  );

  const handleOpenScorecard = useCallback((match) => {
    setScorecardMatch(match);
  }, []);

  const handleCloseScorecard = useCallback(() => {
    setScorecardMatch(null);
  }, []);

  const handleStartMatch = useCallback((match) => {
    setStartFlow({ match, step: "toss", toss: null });
  }, []);

  const handleTossConfirm = useCallback((tossData) => {
    setStartFlow((prev) => (prev ? { ...prev, step: "setup", toss: tossData } : null));
  }, []);

  const handleStartFlowClose = useCallback(() => {
    setStartFlow(null);
  }, []);

  // Load the user's tournaments (reuses the tournaments API).
  useEffect(() => {
    const load = async () => {
      setLoadingTournaments(true);
      try {
        const { data } = await tournamentAPI.getAll({ limit: 100 });
        const list = data.data || [];
        setTournaments(list);
        if (list.length > 0) setSelectedId(list[0]._id);
      } catch (err) {
        toast.error(err?.message || "Failed to load tournaments");
      } finally {
        setLoadingTournaments(false);
      }
    };
    load();
  }, []);

  // Load the real matches (fixtures) for the selected tournament.
  const fetchMatches = useCallback(async () => {
    if (!selectedId) {
      setMatches([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await tournamentAPI.getTournamentFixtures(selectedId);
      setMatches(data.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load matches");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleMatchStarted = useCallback(
    (startedMatch) => {
      const matchId = startedMatch?._id;
      setStartFlow(null);
      fetchMatches();
      if (matchId) {
        navigate("/dashboard/live-scoring", { state: { matchId: String(matchId) } });
      }
    },
    [fetchMatches, navigate]
  );

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t._id === selectedId) || null,
    [tournaments, selectedId]
  );
  const tournamentName = selectedTournament?.tournamentName || "Tournament";
  const ground = groundOf(selectedTournament);

  const stats = useMemo(() => {
    const by = (s) => matches.filter((m) => m.status === s).length;
    return {
      total: matches.length,
      scheduled: by("Scheduled"),
      live: by("Live"),
      completed: by("Completed"),
    };
  }, [matches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const a = teamLabel(m.teamA, m.teamASlot).toLowerCase();
      const b = teamLabel(m.teamB, m.teamBSlot).toLowerCase();
      return (
        a.includes(q) ||
        b.includes(q) ||
        tournamentName.toLowerCase().includes(q) ||
        ground.toLowerCase().includes(q) ||
        String(m.round || "").toLowerCase().includes(q)
      );
    });
  }, [matches, search, statusFilter, tournamentName, ground]);

  const hasTournaments = tournaments.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Hero header */}
      <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-r from-primary/8 via-white to-accent/8 p-5 shadow-[0_4px_20px_rgba(22,163,74,0.06)] sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Match center</p>
            <h2 className="mt-2 text-2xl font-semibold text-secondary">Match Management</h2>
            <p className="mt-2 text-sm text-text-muted">
              Real fixtures generated from your tournaments — track schedules, live games, and results.
            </p>
          </div>

          {/* Tournament selector */}
          {hasTournaments && (
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition cursor-pointer"
              >
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>{t.tournamentName}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Matches" value={stats.total} color="bg-primary/10 text-primary" />
        <StatCard icon={CalendarClock} label="Scheduled" value={stats.scheduled} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Radio} label="Live" value={stats.live} color="bg-red-50 text-red-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Toolbar */}
      <div className="card-premium p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, round or ground..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-secondary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === f ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`p-1.5 rounded-lg transition-colors ${
                view === "cards" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-secondary"
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                view === "table" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-secondary"
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loadingTournaments || loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !hasTournaments ? (
        <EmptyState
          title="No tournaments yet"
          description="Create a tournament and generate fixtures to see matches here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches found"
          description={
            search || statusFilter !== "All"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "No fixtures have been generated for this tournament yet. Generate fixtures to schedule matches."
          }
          onClear={search || statusFilter !== "All" ? () => { setSearch(""); setStatusFilter("All"); } : null}
        />
      ) : (
        <AnimatePresence mode="wait">
          {view === "cards" ? (
            <motion.div
              key="cards"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filtered.map((m) => (
                  <MatchCard
                    key={m._id}
                    match={m}
                    tournamentName={tournamentName}
                    ground={ground}
                    onStartMatch={handleStartMatch}
                    onViewMatch={handleViewMatch}
                    onScorecard={handleOpenScorecard}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-premium overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="text-left px-4 py-3 font-semibold text-secondary">Match</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted hidden md:table-cell">Tournament</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted hidden lg:table-cell">Date &amp; Time</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted hidden xl:table-cell">Ground</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <MatchRow
                        key={m._id}
                        match={m}
                        tournamentName={tournamentName}
                        ground={ground}
                        onStartMatch={handleStartMatch}
                        onViewMatch={handleViewMatch}
                        onScorecard={handleOpenScorecard}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <MatchScorecardModal
        open={Boolean(scorecardMatch)}
        onClose={handleCloseScorecard}
        match={scorecardMatch}
        tournamentId={selectedId}
      />

      <TossModal
        open={startFlow?.step === "toss"}
        onClose={handleStartFlowClose}
        match={startFlow?.match}
        onConfirm={handleTossConfirm}
      />

      <MatchSetupModal
        open={startFlow?.step === "setup"}
        onClose={handleStartFlowClose}
        match={startFlow?.match}
        tournamentId={selectedId}
        tossWinner={startFlow?.toss?.tossWinner}
        tossDecision={startFlow?.toss?.tossDecision}
        onStarted={handleMatchStarted}
      />
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ title, description, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium py-16 flex flex-col items-center text-center px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Swords className="w-8 h-8 text-primary/60" />
      </div>
      <h3 className="text-lg font-semibold text-secondary">{title}</h3>
      <p className="text-sm text-text-muted mt-1 max-w-sm">{description}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
        >
          Clear filters
        </button>
      )}
    </motion.div>
  );
}
