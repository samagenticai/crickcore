import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle, Users, Trophy, Plus, ChevronDown, Loader2, X, Pencil,
  Trash2, Shield, Hash, Camera, Upload,
  Search, Filter, ArrowUpDown, LayoutGrid, List, Lock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "../../api/tournaments";
import { playerAPI } from "../../api/players";
import { mediaUrl } from "../../utils/media";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import { MODAL_BACKDROP } from "../../components/ui/modalUi";

// value = stored in DB, label = shown in UI
const ROLES = [
  { value: "Batsman", label: "Batsman" },
  { value: "Bowler", label: "Bowler" },
  { value: "All-Rounder", label: "All-Rounder" },
  { value: "Wicket-Keeper", label: "Wicket Keeper" },
];

const BATTING_STYLES = ["Right-Handed", "Left-Handed"];

const BOWLING_STYLES = [
  "Right-arm Fast",
  "Right-arm Fast-medium",
  "Right-arm Medium",
  "Right-arm Off Break",
  "Left-arm Fast",
  "Left-arm Fast-medium",
  "Left-arm Medium",
  "Slow Left-arm Orthodox",
  "Left-arm Wrist Spin",
  "Leg Break",
  "Leg Break Googly",
];

const ROLE_BADGE = {
  Batsman: "bg-blue-50 text-blue-700 border-blue-200",
  Bowler: "bg-rose-50 text-rose-700 border-rose-200",
  "All-Rounder": "bg-amber-50 text-amber-700 border-amber-200",
  "Wicket-Keeper": "bg-purple-50 text-purple-700 border-purple-200",
};

const roleLabel = (value) => ROLES.find((r) => r.value === value)?.label || value;

const MAX_PLAYERS = 15;

const SORT_OPTIONS = [
  { value: "jersey", label: "Jersey Number" },
  { value: "name", label: "Name (A–Z)" },
  { value: "age", label: "Age" },
  { value: "role", label: "Role" },
];

const showBatting = (role) => ["Batsman", "All-Rounder", "Wicket-Keeper"].includes(role);
const showBowling = (role) => ["Bowler", "All-Rounder"].includes(role);

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

// ── Player avatar ─────────────────────────────────────────────────────────
function PlayerAvatar({ player, className = "w-14 h-14 text-base" }) {
  const photo = mediaUrl(player?.photo);
  if (photo) {
    return (
      <div className={`${className} rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow`}>
        <img src={photo} alt={player?.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${className} rounded-full flex items-center justify-center flex-shrink-0 font-bold bg-primary/10 text-primary`}>
      {initials(player?.name)}
    </div>
  );
}

// ── Player card ───────────────────────────────────────────────────────────
function PlayerCard({ player, idx, onEdit, onDelete, locked }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: -8 }}
      transition={{ duration: 0.22, delay: idx * 0.03 }}
      className="card-premium p-4 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <PlayerAvatar player={player} />
          {player.jerseyNumber != null && (
            <span className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {player.jerseyNumber}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-secondary text-sm leading-tight truncate">{player.name}</p>
          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[player.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {roleLabel(player.role)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
          <p className="text-[10px] text-text-muted">Age</p>
          <p className="font-semibold text-secondary">{player.age ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
          <p className="text-[10px] text-text-muted">Jersey</p>
          <p className="font-semibold text-secondary">{player.jerseyNumber != null ? `#${player.jerseyNumber}` : "—"}</p>
        </div>
        {player.battingStyle && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5 col-span-2">
            <p className="text-[10px] text-text-muted">Batting Style</p>
            <p className="font-semibold text-secondary truncate">{player.battingStyle}</p>
          </div>
        )}
        {player.bowlingStyle && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5 col-span-2">
            <p className="text-[10px] text-text-muted">Bowling Style</p>
            <p className="font-semibold text-secondary truncate">{player.bowlingStyle}</p>
          </div>
        )}
      </div>

      {locked ? (
        <div className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-text-muted bg-slate-50 rounded-lg border border-slate-100">
          <Lock className="w-3 h-3" /> Locked
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(player)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(player)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Player table (desktop-friendly dense view) ────────────────────────────
function PlayerTable({ players, onEdit, onDelete, locked }) {
  return (
    <div className="card-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-secondary">Player</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">#</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted hidden md:table-cell">Batting</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted hidden lg:table-cell">Bowling</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted hidden sm:table-cell">Age</th>
              <th className="text-right px-4 py-3 font-semibold text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar player={p} className="w-9 h-9 text-xs" />
                    <span className="font-semibold text-secondary truncate">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">{p.jerseyNumber != null ? `#${p.jerseyNumber}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[p.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {roleLabel(p.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted hidden md:table-cell">{p.battingStyle || "—"}</td>
                <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{p.bowlingStyle || "—"}</td>
                <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{p.age ?? "—"}</td>
                <td className="px-4 py-3">
                  {locked ? (
                    <div className="flex items-center justify-end gap-1 text-[11px] text-text-muted">
                      <Lock className="w-3 h-3" /> Locked
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Add / Edit player modal ───────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  jerseyNumber: "",
  age: "",
  role: "Batsman",
  battingStyle: "Right-Handed",
  bowlingStyle: "",
};

function PlayerFormModal({ open, onClose, onSubmit, initial, loading, teamName, tournamentName }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name || "",
        jerseyNumber: initial.jerseyNumber ?? "",
        age: initial.age ?? "",
        role: initial.role || "Batsman",
        battingStyle: initial.battingStyle || "Right-Handed",
        bowlingStyle: initial.bowlingStyle || "",
      });
      setPhotoPreview(mediaUrl(initial.photo));
    } else {
      setForm(EMPTY_FORM);
      setPhotoPreview("");
    }
    setPhotoFile(null);
  }, [open, initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleRole = (role) => {
    setForm((f) => ({
      ...f,
      role,
      battingStyle: showBatting(role) ? f.battingStyle || "Right-Handed" : "",
      bowlingStyle: showBowling(role) ? f.bowlingStyle || BOWLING_STYLES[0] : "",
    }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Full name is required"); return; }
    if (form.age !== "" && Number(form.age) < 18) { toast.error("Player must be at least 18 years old"); return; }

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("role", form.role);
    if (form.jerseyNumber !== "") fd.append("jerseyNumber", form.jerseyNumber);
    if (form.age !== "") fd.append("age", form.age);
    fd.append("battingStyle", showBatting(form.role) ? form.battingStyle : "");
    fd.append("bowlingStyle", showBowling(form.role) ? form.bowlingStyle : "");
    if (photoFile) fd.append("photo", photoFile);

    onSubmit(fd);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Light backdrop — matches TournamentFormModal, no heavy dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={MODAL_BACKDROP}
            onClick={!loading ? onClose : undefined}
          />

          {/* Centered modal / mobile bottom drawer — position never shifts */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-light to-accent rounded-t-3xl" />

            {/* Header — fixed inside modal */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-primary" />
                  {initial ? "Edit Player" : "Add Player"}
                </h3>
                {(teamName || tournamentName) && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {teamName}{teamName && tournamentName ? " · " : ""}{tournamentName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Form — only the fields scroll inside the modal */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
                {/* Photo */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-accent/5 border border-primary/10">
                  <div className="relative shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-slate-200">
                        <Camera className="w-7 h-7 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold cursor-pointer hover:bg-slate-50 hover:border-primary/30 transition-colors shadow-sm">
                      <Upload className="w-4 h-4 text-primary" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                      <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </label>
                    <p className="text-[11px] text-text-muted mt-1.5">JPG, PNG or WEBP. Max 5MB.</p>
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Babar Azam"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                  />
                </div>

                {/* Jersey + Age */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-muted mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Jersey Number
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.jerseyNumber}
                      onChange={(e) => set("jerseyNumber", e.target.value)}
                      placeholder="e.g. 56"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Age (min 18)</label>
                    <input
                      type="number"
                      min="18"
                      value={form.age}
                      onChange={(e) => set("age", e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Player Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleRole(r.value)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                          form.role === r.value
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                            : "bg-white text-secondary border-slate-200 hover:bg-slate-50 hover:border-primary/20"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional styles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {showBatting(form.role) && (
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Batting Style</label>
                      <div className="relative">
                        <select
                          value={form.battingStyle}
                          onChange={(e) => set("battingStyle", e.target.value)}
                          className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all appearance-none"
                        >
                          {BATTING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  {showBowling(form.role) && (
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Bowling Style</label>
                      <div className="relative">
                        <select
                          value={form.bowlingStyle || BOWLING_STYLES[0]}
                          onChange={(e) => set("bowlingStyle", e.target.value)}
                          className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all appearance-none"
                        >
                          {BOWLING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions — pinned at bottom of modal */}
              <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-primary/20 transition-opacity"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {initial ? "Save Changes" : "Create Player"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function PlayersPage() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toolbar: search / filter / sort / view
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortBy, setSortBy] = useState("jersey");
  const [view, setView] = useState("cards"); // "cards" | "table"

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t._id === selectedTournamentId) || null,
    [tournaments, selectedTournamentId]
  );
  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  const isCompleted = selectedTournament?.status === "Completed";
  const atLimit = players.length >= MAX_PLAYERS;
  const canAddPlayer = Boolean(selectedTeamId) && !isCompleted && !atLimit;

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = players.filter((p) => {
      const matchesRole = roleFilter === "All" || p.role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        String(p.jerseyNumber ?? "").includes(q) ||
        (p.battingStyle || "").toLowerCase().includes(q) ||
        (p.bowlingStyle || "").toLowerCase().includes(q)
      );
    });

    const sorters = {
      jersey: (a, b) => (a.jerseyNumber ?? Infinity) - (b.jerseyNumber ?? Infinity),
      name: (a, b) => a.name.localeCompare(b.name),
      age: (a, b) => (a.age ?? Infinity) - (b.age ?? Infinity),
      role: (a, b) => (a.role || "").localeCompare(b.role || ""),
    };
    return [...list].sort(sorters[sortBy] || sorters.jersey);
  }, [players, search, roleFilter, sortBy]);

  // Load tournaments
  useEffect(() => {
    (async () => {
      setLoadingTournaments(true);
      try {
        const { data } = await tournamentAPI.getAll({ limit: 100 });
        setTournaments(data.data || []);
      } catch (err) {
        toast.error(err?.message || "Failed to load tournaments");
      } finally {
        setLoadingTournaments(false);
      }
    })();
  }, []);

  // Load teams whenever the selected tournament changes
  useEffect(() => {
    setTeams([]);
    setSelectedTeamId("");
    setPlayers([]);
    if (!selectedTournamentId) return;
    (async () => {
      setLoadingTeams(true);
      try {
        const { data } = await tournamentAPI.getTournamentTeams(selectedTournamentId);
        setTeams(data.data || []);
      } catch (err) {
        toast.error(err?.message || "Failed to load teams");
      } finally {
        setLoadingTeams(false);
      }
    })();
  }, [selectedTournamentId]);

  const fetchPlayers = useCallback(async () => {
    if (!selectedTeamId) { setPlayers([]); return; }
    setLoadingPlayers(true);
    try {
      const { data } = await playerAPI.getAll({
        team: selectedTeamId,
        tournament: selectedTournamentId,
      });
      setPlayers(data.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load players");
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  }, [selectedTeamId, selectedTournamentId]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const openAdd = () => {
    if (isCompleted) { toast.error("This tournament is completed. Players are locked."); return; }
    if (atLimit) { toast.error(`A team can have a maximum of ${MAX_PLAYERS} players`); return; }
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (player) => {
    if (isCompleted) { toast.error("This tournament is completed. Players are locked."); return; }
    setEditing(player);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (!selectedTeamId) { toast.error("Select a team first"); return; }
    formData.append("team", selectedTeamId);
    formData.append("tournament", selectedTournamentId);
    setSubmitting(true);
    try {
      if (editing) {
        const { data } = await playerAPI.update(editing._id, formData);
        setPlayers((prev) => prev.map((p) => (p._id === editing._id ? data.data : p)));
        toast.success("Player updated");
      } else {
        const { data } = await playerAPI.create(formData);
        setPlayers((prev) => [data.data, ...prev]);
        toast.success(`"${data.data.name}" added`);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err?.message || "Failed to save player");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await playerAPI.remove(confirmDelete._id);
      setPlayers((prev) => prev.filter((p) => p._id !== confirmDelete._id));
      toast.success("Player deleted");
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete player");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5 min-h-0"
    >
      {/* ── Fixed top: header + selectors (never scroll away) ───────────── */}
      <div className="shrink-0 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary">
              Player{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Management</span>
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Build each team&apos;s squad player by player</p>
          </div>
          {selectedTeam && (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  atLimit ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                }`}
              >
                {players.length} / {MAX_PLAYERS} Players
              </span>
              <button
                type="button"
                onClick={openAdd}
                disabled={!canAddPlayer}
                title={
                  isCompleted
                    ? "Tournament completed — locked"
                    : atLimit
                    ? `Maximum ${MAX_PLAYERS} players reached`
                    : "Add player"
                }
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Player
              </button>
            </div>
          )}
        </div>

        <div className="card-premium p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block">Select Tournament</label>
            {loadingTournaments ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading tournaments…
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 transition-all appearance-none"
                >
                  <option value="">— Select a tournament —</option>
                  {tournaments.map((t) => (
                    <option key={t._id} value={t._id}>{t.tournamentName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block">Select Team</label>
            <div className="relative">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={!selectedTournamentId || loadingTeams}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 transition-all appearance-none disabled:bg-slate-50 disabled:text-text-muted disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedTournamentId
                    ? "Select a tournament first"
                    : loadingTeams
                    ? "Loading teams…"
                    : teams.length === 0
                    ? "No teams in this tournament"
                    : "— Select a team —"}
                </option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {!selectedTournamentId ? (
        <EmptyState icon={Trophy} title="Select a Tournament" description="Choose a tournament above to see its teams and manage players." />
      ) : !selectedTeamId ? (
        <EmptyState
          icon={Users}
          title={teams.length === 0 ? "No teams found" : "Select a Team"}
          description={
            teams.length === 0
              ? "This tournament has no teams yet. Add teams from the Teams page first."
              : "Choose a team above to view and manage its players."
          }
        />
      ) : (
        <div className="flex flex-col min-h-0 flex-1 gap-4 max-h-[calc(100dvh-18rem)] sm:max-h-[calc(100dvh-16rem)]">
          {/* Fixed squad controls — banners, toolbar, title */}
          <div className="shrink-0 space-y-4">
            {isCompleted && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                <Lock className="w-4 h-4 flex-shrink-0" />
                This tournament is completed — players are locked and cannot be added, edited, or deleted.
              </div>
            )}
            {!isCompleted && atLimit && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Squad is full ({MAX_PLAYERS}/{MAX_PLAYERS}). Remove a player before adding a new one.
              </div>
            )}

            <div className="card-premium p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 lg:max-w-xs">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search players…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-secondary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 transition-all appearance-none"
                  >
                    <option value="All">All Roles</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 transition-all appearance-none"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>Sort: {s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setView("cards")}
                    className={`p-1.5 rounded-lg transition-colors ${view === "cards" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-secondary"}`}
                    title="Card view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={`p-1.5 rounded-lg transition-colors ${view === "table" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-secondary"}`}
                    title="Table view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                {selectedTeam?.name} Squad
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
                {visiblePlayers.length} of {players.length}
              </span>
            </div>
          </div>

          {/* Scrollable players list only */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 -mr-1">
            {loadingPlayers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-premium p-4 h-44 animate-pulse bg-slate-50" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <EmptyState
                icon={UserCircle}
                title="No players yet"
                description={`Add the first player to ${selectedTeam?.name || "this team"}.`}
                action={
                  <button
                    type="button"
                    onClick={openAdd}
                    disabled={!canAddPlayer}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add Player
                  </button>
                }
              />
            ) : visiblePlayers.length === 0 ? (
              <div className="card-premium py-10 flex flex-col items-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-secondary mb-1">No players match your filters</p>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setRoleFilter("All"); }}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Clear search &amp; filters
                </button>
              </div>
            ) : view === "cards" ? (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                <AnimatePresence mode="popLayout">
                  {visiblePlayers.map((player, idx) => (
                    <PlayerCard
                      key={player._id}
                      player={player}
                      idx={idx}
                      onEdit={openEdit}
                      onDelete={setConfirmDelete}
                      locked={isCompleted}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="pb-2">
                <PlayerTable
                  players={visiblePlayers}
                  onEdit={openEdit}
                  onDelete={setConfirmDelete}
                  locked={isCompleted}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <PlayerFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
        loading={submitting}
        teamName={selectedTeam?.name}
        tournamentName={selectedTournament?.tournamentName}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Player?"
        description={`"${confirmDelete?.name}" will be permanently removed from the squad. This action cannot be undone.`}
        confirmLabel="Delete Player"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium py-14 flex flex-col items-center justify-center text-center px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary/50" />
      </div>
      <h3 className="text-base font-semibold text-secondary mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm">{description}</p>
      {action}
    </motion.div>
  );
}
