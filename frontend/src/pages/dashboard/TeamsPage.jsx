import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Check, Loader2, Trophy, Plus, ChevronDown,
  Pencil, X, Trash2, Zap, CheckCircle2, AlertCircle, UserCheck,
} from "lucide-react";
import { teamAPI } from "../../api/teams";
import { tournamentAPI } from "../../api/tournaments";
import { toast } from "sonner";
import GenerateFixturesModal from "../../components/dashboard/GenerateFixturesModal";

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
];

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}
function avatarBg(name = "") {
  const n = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

function TeamAvatar({ team, className = "w-11 h-11 text-sm" }) {
  if (team?.logo) {
    return (
      <div className={`${className} rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow`}>
        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${className} rounded-full flex items-center justify-center flex-shrink-0 font-bold ${avatarBg(
        team?.name
      )}`}
    >
      {initials(team?.name)}
    </div>
  );
}

// ── Roster team card ──────────────────────────────────────────────────────────

function TeamCard({ team, onRemove, onSaveEdit, idx }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [city, setCity] = useState(team.city || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSaveEdit(team._id, name.trim(), city.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: -8 }}
      transition={{ duration: 0.22, delay: idx * 0.04 }}
      className="card-premium p-4 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <TeamAvatar team={{ ...team, name: editing ? name : team.name }} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1.5">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team name *"
                className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/25 transition-all"
              />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/25 transition-all"
              />
            </div>
          ) : (
            <>
              <p className="font-semibold text-secondary text-sm leading-tight truncate">{team.name}</p>
              {team.city && (
                <p className="text-xs text-text-muted mt-0.5">{team.city}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {editing ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Save
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setName(team.name); setCity(team.city || ""); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRemove(team._id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const location = useLocation();

  const [tournament, setTournament] = useState(location.state?.tournament || null);
  const [allTournaments, setAllTournaments] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tourLoading, setTourLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add-team panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTab, setAddTab] = useState("existing"); // "existing" | "create"
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [creating, setCreating] = useState(false);

  // Generate fixtures
  const [showFixtures, setShowFixtures] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const maxTeams = tournament?.numberOfTeams ?? 0;
  const count = selectedIds.size;
  const isAtLimit = maxTeams > 0 && count >= maxTeams;
  const isComplete = maxTeams > 0 && count === maxTeams;
  const pct = maxTeams > 0 ? Math.min(Math.round((count / maxTeams) * 100), 100) : 0;
  const remaining = Math.max(maxTeams - count, 0);

  const rosterTeams = allTeams.filter((t) => selectedIds.has(t._id));
  const available = allTeams.filter((t) => !selectedIds.has(t._id));
  const filteredAvail = available.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.city || "").toLowerCase().includes(search.toLowerCase())
  );

  // Auto-close add panel when limit is hit
  useEffect(() => {
    if (isAtLimit) setShowAddPanel(false);
  }, [isAtLimit]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchTournaments = useCallback(async () => {
    setTourLoading(true);
    try {
      const { data } = await tournamentAPI.getAll({ limit: 100 });
      setAllTournaments(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load tournaments");
    } finally {
      setTourLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const { data } = await teamAPI.getAll({ limit: 100 });
      setAllTeams(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load teams");
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
  }, [fetchTournaments, fetchTeams]);

  // Sync selectedIds whenever tournament changes
  useEffect(() => {
    if (!tournament) { setSelectedIds(new Set()); return; }
    const ids = (tournament.teams || []).map((t) =>
      typeof t === "object" ? t._id : t
    );
    setSelectedIds(new Set(ids));
    setShowAddPanel(false);
    setSearch("");
    setNewName("");
    setNewCity("");
  }, [tournament]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addExistingTeam = (id) => {
    if (isAtLimit) { toast.warning(`Maximum ${maxTeams} teams allowed`); return; }
    setSelectedIds((prev) => new Set([...prev, id]));
    setSearch("");
  };

  const removeTeam = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveEdit = async (teamId, name, city) => {
    const { data } = await teamAPI.update(teamId, { name, city });
    setAllTeams((prev) => prev.map((t) => (t._id === teamId ? data.data : t)));
    toast.success("Team updated");
  };

  const handleCreateTeam = async () => {
    if (!newName.trim()) return;
    if (isAtLimit) { toast.warning(`Maximum ${maxTeams} teams allowed`); return; }
    setCreating(true);
    try {
      const { data } = await teamAPI.create({ name: newName.trim(), city: newCity.trim() });
      const created = data.data;
      setAllTeams((prev) => [created, ...prev]);
      setSelectedIds((prev) => new Set([...prev, created._id]));
      toast.success(`"${created.name}" created and added to roster`);
      setNewName("");
      setNewCity("");
    } catch (err) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!tournament) return;
    setSaving(true);
    try {
      await tournamentAPI.addTeamsToTournament(tournament._id, [...selectedIds]);
      toast.success("Team selection saved successfully");
      const { data } = await tournamentAPI.getOne(tournament._id);
      setTournament(data.data);
    } catch (err) {
      toast.error(err.message || "Failed to save teams");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Team{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Build the perfect roster for your tournament
          </p>
        </div>
        {tournament && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${isComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : isAtLimit
                    ? "bg-amber-100 text-amber-700"
                    : "bg-primary/10 text-primary"
                }`}
            >
              {count} / {maxTeams} Teams
            </span>
          </div>
        )}
      </div>

      {/* ── Tournament selector ───────────────────────────────────────────── */}
      <div className="card-premium p-4 space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
          Select Tournament
        </label>
        <div className="relative">
          {tourLoading ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading tournaments…
            </div>
          ) : (
            <>
              <select
                value={tournament?._id || ""}
                onChange={(e) => {
                  const t = allTournaments.find((t) => t._id === e.target.value);
                  setTournament(t || null);
                }}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 transition-all appearance-none"
              >
                <option value="">— Select a tournament —</option>
                {allTournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tournamentName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </>
          )}
        </div>

        {/* Tournament info strip */}
        <AnimatePresence>
          {tournament && (
            <motion.div
              key={tournament._id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
            >
              {tournament.tournamentLogo ? (
                <img
                  src={tournament.tournamentLogo}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-secondary truncate">
                  {tournament.tournamentName}
                </p>
                <p className="text-xs text-text-muted">
                  {tournament.tournamentType} · Max {tournament.numberOfTeams} teams
                </p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {tournament.status}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Empty state when no tournament ────────────────────────────────── */}
      {!tournament ? (
        <div className="card-premium p-14 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-base font-semibold text-secondary mb-1">Select a Tournament</h3>
          <p className="text-sm text-text-muted max-w-xs">
            Choose a tournament from the dropdown above to start building its team roster.
          </p>
        </div>
      ) : (
        <>
          {/* ── Progress card ───────────────────────────────────────────── */}
          <motion.div
            key="progress"
            layout
            className={`card-premium p-5 border-l-4 ${isComplete
                ? "border-emerald-500"
                : isAtLimit
                  ? "border-amber-500"
                  : "border-primary"
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Left: counter */}
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-secondary">{count}</span>
                  <span className="text-lg font-semibold text-text-muted">/ {maxTeams}</span>
                  <span className="text-sm text-text-muted ml-1">Teams Added</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-primary"
                      }`}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1.5">
                  {isComplete ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      All team slots are filled — roster is complete!
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-secondary">{remaining}</span>{" "}
                      more team{remaining !== 1 ? "s" : ""} needed to fill the roster
                    </>
                  )}
                </p>
              </div>

              {/* Right: pct circle */}
              <div
                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${isComplete
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                <span className="text-lg font-extrabold leading-none">{pct}%</span>
                <span className="text-[10px] font-semibold opacity-70">filled</span>
              </div>
            </div>

            {/* Limit-reached banner */}
            <AnimatePresence>
              {isAtLimit && !isComplete && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Maximum team limit reached ({maxTeams}/{maxTeams}). Remove a team to add another.
                  </div>
                </motion.div>
              )}
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Roster complete! Save your selection and then generate fixtures to schedule matches.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Team roster grid ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Team Roster
              </h2>
              {!isAtLimit && (
                <button
                  type="button"
                  onClick={() => setShowAddPanel((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Team
                </button>
              )}
              {isAtLimit && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Limit reached
                </span>
              )}
            </div>

            {teamsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card-premium p-4 h-24 animate-pulse bg-slate-50" />
                ))}
              </div>
            ) : rosterTeams.length === 0 ? (
              <div className="card-premium p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-secondary mb-1">No teams added yet</p>
                <p className="text-xs text-text-muted">
                  Click &quot;Add Team&quot; above to start building the roster.
                </p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {rosterTeams.map((team, idx) => (
                    <TeamCard
                      key={team._id}
                      team={team}
                      idx={idx}
                      onRemove={removeTeam}
                      onSaveEdit={handleSaveEdit}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ── Add Team panel ───────────────────────────────────────────── */}
          <AnimatePresence>
            {showAddPanel && !isAtLimit && (
              <motion.div
                key="add-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22 }}
                className="card-premium overflow-hidden"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-secondary flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Add Team to Roster
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddPanel(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/60">
                  {[
                    { id: "existing", label: "From Library" },
                    { id: "create", label: "Create New" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAddTab(tab.id)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${addTab === tab.id
                          ? "text-primary border-b-2 border-primary bg-white"
                          : "text-text-muted hover:text-secondary"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-4">
                  {addTab === "existing" ? (
                    <>
                      {/* Search */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="search"
                          placeholder="Search teams…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                        />
                      </div>

                      {/* Team list */}
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {filteredAvail.length === 0 ? (
                          <div className="text-center py-6 text-sm text-text-muted">
                            {available.length === 0
                              ? "All available teams are already in the roster."
                              : "No teams match your search."}
                          </div>
                        ) : (
                          filteredAvail.map((team) => (
                            <motion.div
                              key={team._id}
                              whileHover={{ x: 2 }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                            >
                              <TeamAvatar team={team} className="w-8 h-8 text-xs" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-secondary truncate">
                                  {team.name}
                                </p>
                                {team.city && (
                                  <p className="text-xs text-text-muted">{team.city}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => addExistingTeam(team._id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    /* Create new team */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-text-muted block mb-1">
                            Team Name *
                          </label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Lahore Lions"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                            onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-text-muted block mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="e.g. Lahore"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                            onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      {newName && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <TeamAvatar
                            team={{ name: newName }}
                            className="w-9 h-9 text-xs"
                          />
                          <div>
                            <p className="text-sm font-semibold text-secondary">{newName}</p>
                            {newCity && <p className="text-xs text-text-muted">{newCity}</p>}
                          </div>
                          <span className="ml-auto text-[10px] text-text-muted">Preview</span>
                        </motion.div>
                      )}

                      <button
                        type="button"
                        onClick={handleCreateTeam}
                        disabled={creating || !newName.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold disabled:opacity-50 shadow-sm shadow-primary/20 transition-opacity"
                      >
                        {creating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Create &amp; Add to Roster
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bottom action bar ────────────────────────────────────────── */}
          <div className="card-premium p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isComplete ? "bg-emerald-500" : count > 0 ? "bg-primary animate-pulse" : "bg-slate-300"
                  }`}
              />
              <p className="text-sm text-text-muted">
                {isComplete ? (
                  <span className="text-emerald-600 font-semibold">Roster complete — ready to generate fixtures</span>
                ) : (
                  <>
                    <span className="font-semibold text-secondary">{count}</span> of{" "}
                    <span className="font-semibold text-secondary">{maxTeams}</span> team slots filled
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-primary/25"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Selection
              </button>

              <AnimatePresence>
                {isComplete && (
                  <motion.button
                    key="fixtures-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    type="button"
                    onClick={() => setShowFixtures(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
                  >
                    <Zap className="w-4 h-4" />
                    Generate Fixtures
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* ── Generate Fixtures modal ───────────────────────────────────────── */}
      <GenerateFixturesModal
        open={showFixtures}
        onClose={() => setShowFixtures(false)}
        tournament={tournament}
        onGenerated={() => setShowFixtures(false)}
      />
    </motion.div>
  );
}
