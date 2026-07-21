import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trophy, Filter, LayoutGrid, List, RotateCcw,
  Pencil, Trash2, Zap, Copy,
  TrendingUp, Clock, CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "../../api/tournaments";
import { useTournamentsQuery } from "../../hooks/useTournamentsQuery";
import TournamentFormModal from "../../components/dashboard/TournamentFormModal";
import TournamentCard from "../../components/dashboard/TournamentCard";
import GenerateFixturesModal from "../../components/dashboard/GenerateFixturesModal";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import EmptyState from "../../components/dashboard/EmptyState";
import { TableSkeleton } from "../../components/dashboard/Skeleton";
import TournamentDetailsModal from "../../components/dashboard/TournamentDetailsModal";
import { getTournamentVenue } from "../../utils/tournamentVenue";

import { TOURNAMENT_TYPES } from "../../constants/tournamentTypes";

const STATUS_OPTIONS = ["", "Draft", "Upcoming", "Live", "Completed", "Cancelled"];
const TYPE_OPTIONS = ["", ...TOURNAMENT_TYPES];

const STATUS_TABLE = {
  Draft: "bg-slate-100 text-slate-600",
  Upcoming: "bg-blue-50 text-blue-700",
  Live: "bg-red-50 text-red-700 font-semibold",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-orange-50 text-orange-700",
};

// Animated stat card
function StatCard({ icon: Icon, label, value, color, loading }) {
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
        {loading ? (
          <div className="h-6 w-10 bg-slate-200 rounded animate-pulse mb-0.5" />
        ) : (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-secondary leading-none"
          >
            {value}
          </motion.p>
        )}
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="card-premium overflow-hidden">
      <div className="h-28 bg-slate-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2 mt-6">
          <div className="h-5 flex-1 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-14 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-4 w-20 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="h-3 bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
        <div className="h-1.5 bg-slate-200 rounded animate-pulse mt-3" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState("cards"); // "cards" | "table"
  const [showDeleted, setShowDeleted] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    tournamentType: "",
    page: 1,
  });

  const {
    tournaments,
    stats,
    pagination,
    loading,
    statsLoading,
    error: fetchError,
    refresh,
  } = useTournamentsQuery({
    search: filters.search,
    status: filters.status,
    tournamentType: filters.tournamentType,
    page: filters.page,
    showDeleted,
  });

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fixturesTarget, setFixturesTarget] = useState(null);
  const [confirmState, setConfirmState] = useState(null); // { type, tournament }
  const [actionLoading, setActionLoading] = useState(false);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await tournamentAPI.create(formData);
      const newTournament = data.data;
      setModalOpen(false);
      await refresh();
      if (data.meta?.message) {
        toast.info(data.meta.message);
      }
      toast.success("Tournament created! Redirecting to team management…");
      // Redirect to the Teams page with the new tournament pre-selected
      navigate("/dashboard/teams", { state: { tournament: newTournament } });
    } catch (err) {
      toast.error(err.message || "Failed to create tournament");
      if (err.errors?.length) {
        err.errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    try {
      await tournamentAPI.update(editing._id, formData);
      toast.success("Tournament updated successfully!");
      setModalOpen(false);
      setEditing(null);
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update tournament");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmState?.tournament) return;
    const { _id, tournamentName } = confirmState.tournament;
    setActionLoading(true);
    try {
      await tournamentAPI.permanentDelete(_id);
      toast.success(`"${tournamentName}" and all related data permanently deleted`);
      setConfirmState(null);
      await refresh();
    } catch (err) {
      // Surface the actual backend error message.
      toast.error(err?.message || "Failed to delete tournament");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await tournamentAPI.restore(id);
      toast.success("Tournament restored");
      await refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (tournament) => {
    try {
      await tournamentAPI.duplicate(tournament._id);
      toast.success(`"${tournament.tournamentName}" duplicated`);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleArchive = async (tournament) => {
    try {
      const { data } = await tournamentAPI.archive(tournament._id);
      toast.success(data.message);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePublish = async (tournament) => {
    try {
      const { data } = await tournamentAPI.publish(tournament._id);
      toast.success(data.message);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Filter helpers ───────────────────────────────────────────────────────

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const setPage = (p) =>
    setFilters((prev) => ({ ...prev, page: p }));

  // ── Table row actions ────────────────────────────────────────────────────

  const tableActions = (t) => (
    <div className="flex items-center justify-end gap-1">
      {showDeleted ? (
        <button
          type="button"
          onClick={() => handleRestore(t._id)}
          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary text-xs"
          title="Restore"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => { setEditing(t); setModalOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setFixturesTarget(t)}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
            title="Generate Fixtures"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicate(t)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmState({ type: "delete", tournament: t })}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Tournament{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Organize, schedule, and manage your cricket tournaments
          </p>
        </div>
        {!showDeleted && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          >
            <Plus className="w-4 h-4" />
            Create Tournament
          </motion.button>
        )}
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Total" value={stats.total} color="bg-primary/10 text-primary" loading={statsLoading} />
        <StatCard icon={Clock} label="Upcoming" value={stats.upcoming} color="bg-blue-100 text-blue-600" loading={statsLoading} />
        <StatCard icon={TrendingUp} label="Live" value={stats.live} color="bg-red-100 text-red-600" loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="bg-emerald-100 text-emerald-600" loading={statsLoading} />
      </div>

      {/* ── Search + filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search tournaments, city, venue..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all min-w-[130px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || "All Status"}</option>
          ))}
        </select>
        <select
          value={filters.tournamentType}
          onChange={(e) => setFilter("tournamentType", e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all min-w-[140px]"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t || "All Types"}</option>
          ))}
        </select>
        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`px-3 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${view === "cards" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`px-3 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${view === "table" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        {/* Trash toggle */}
        <button
          type="button"
          onClick={() => { setShowDeleted(!showDeleted); setFilters((f) => ({ ...f, page: 1 })); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${showDeleted
              ? "bg-orange-50 border-orange-200 text-orange-600"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
        >
          <Filter className="w-4 h-4" />
          {showDeleted ? "Trash" : "Active"}
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          view === "cards" ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </motion.div>
          ) : (
            <div className="card-premium p-4"><TableSkeleton /></div>
          )
        ) : tournaments.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Trophy}
              title={showDeleted ? "Trash is empty" : "No tournaments yet"}
              description={
                showDeleted
                  ? "Deleted tournaments will appear here."
                  : "Create your first tournament to get started!"
              }
              action={
                !showDeleted && (
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Create Tournament
                  </button>
                )
              }
            />
          </motion.div>
        ) : view === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {tournaments.map((t) =>
              showDeleted ? (
                <div key={t._id} className="card-premium p-4 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-primary/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary truncate">{t.tournamentName}</p>
                    <p className="text-xs text-text-muted">{t.status}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(t._id)}
                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <TournamentCard
                  key={t._id}
                  tournament={t}
                  onView={() => setViewing(t)}
                  onEdit={() => { setEditing(t); setModalOpen(true); }}
                  onDelete={() => setConfirmState({ type: "delete", tournament: t })}
                  onDuplicate={() => handleDuplicate(t)}
                  onArchive={() => handleArchive(t)}
                  onPublish={() => handlePublish(t)}
                  onGenerateFixtures={() => setFixturesTarget(t)}
                />
              )
            )}
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
                    <th className="text-left px-4 py-3 font-semibold text-secondary">Tournament</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted hidden md:table-cell">Venue</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted hidden lg:table-cell">Teams</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted hidden xl:table-cell">Dates</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {t.tournamentLogo
                              ? <img src={t.tournamentLogo} alt="" className="w-full h-full object-cover" />
                              : <Trophy className="w-4 h-4 text-primary/60" />
                            }
                          </div>
                          <p className="font-medium text-secondary truncate max-w-[140px] sm:max-w-none">
                            {t.tournamentName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs hidden sm:table-cell">{t.tournamentType}</td>
                      <td className="px-4 py-3 text-text-muted hidden md:table-cell truncate max-w-[160px]">
                        {getTournamentVenue(t)?.shortLabel || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_TABLE[t.status] || STATUS_TABLE.Draft}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                        {(t.teams?.length || 0)}/{t.numberOfTeams}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs hidden xl:table-cell">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : "—"} →{" "}
                        {t.endDate ? new Date(t.endDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">{tableActions(t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">{pagination.total} tournament{pagination.total !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setPage(filters.page - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg border text-xs font-medium transition-colors ${filters.page === p
                    ? "bg-primary text-white border-primary"
                    : "border-slate-200 text-secondary hover:bg-slate-50"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={filters.page >= pagination.pages}
              onClick={() => setPage(filters.page + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <TournamentFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
        loading={submitting}
      />

      <TournamentDetailsModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        tournament={viewing}
      />

      <GenerateFixturesModal
        open={Boolean(fixturesTarget)}
        onClose={() => setFixturesTarget(null)}
        tournament={fixturesTarget}
        onGenerated={refresh}
      />

      <ConfirmModal
        open={Boolean(confirmState)}
        onClose={() => {
          if (!actionLoading) setConfirmState(null);
        }}
        onConfirm={handleDelete}
        title={
          confirmState?.tournament
            ? `Delete "${confirmState.tournament.tournamentName}"?`
            : "Delete Tournament?"
        }
        description="This will permanently delete the tournament and all related matches, teams, and data. This action cannot be undone."
        confirmLabel="Delete Tournament"
        variant="danger"
        loading={actionLoading}
      />
    </motion.div>
  );
}
