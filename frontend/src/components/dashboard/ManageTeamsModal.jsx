import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Users, UserMinus, Check, Loader2, Trophy, Plus,
} from "lucide-react";
import { teamAPI } from "../../api/teams";
import { toast } from "sonner";
import DashboardFormModal, { DASHBOARD_MODAL_MAX_HEIGHT } from "./DashboardFormModal";

export default function ManageTeamsModal({
  open,
  onClose,
  tournament,
  onSaved,
}) {
  const [allTeams, setAllTeams] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCity, setNewTeamCity] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teamAPI.getAll({ limit: 100 });
      setAllTeams(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchTeams();
    const existing = (tournament?.teams || []).map((t) =>
      typeof t === "object" ? t._id : t
    );
    setSelectedIds(new Set(existing));
    setSearch("");
    setShowAddTeam(false);
    setNewTeamName("");
    setNewTeamCity("");
  }, [open, tournament, fetchTeams]);

  const filtered = allTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.city || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    const maxTeams = tournament?.numberOfTeams || Infinity;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= maxTeams) {
          toast.warning(`Maximum ${maxTeams} teams allowed`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { tournamentAPI } = await import("../../api/tournaments");
      await tournamentAPI.addTeamsToTournament(tournament._id, [...selectedIds]);
      toast.success("Teams updated successfully");
      onSaved?.([...selectedIds]);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save teams");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const { data } = await teamAPI.create({ name: newTeamName.trim(), city: newTeamCity.trim() });
      const newTeam = data.data;
      setAllTeams((prev) => [newTeam, ...prev]);
      setSelectedIds((prev) => new Set([...prev, newTeam._id]));
      toast.success(`Team "${newTeam.name}" created`);
      setShowAddTeam(false);
      setNewTeamName("");
      setNewTeamCity("");
    } catch (err) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const selectedTeams = allTeams.filter((t) => selectedIds.has(t._id));
  const maxTeams = tournament?.numberOfTeams || "∞";

  return (
    <DashboardFormModal
      open={open}
      onClose={onClose}
      loading={saving}
      zIndex={70}
      maxWidthClass="max-w-2xl"
      maxHeightClass={DASHBOARD_MODAL_MAX_HEIGHT}
      header={
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
              <Users className="w-5 h-5 text-primary shrink-0" />
              Manage Teams
            </h2>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {tournament?.tournamentName} — {selectedIds.size} / {maxTeams} teams selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
      footer={
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-primary/25"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Team Selection
          </button>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row h-[min(60vh,480px)] -mx-4 sm:-mx-5 -my-4 sm:-my-5 overflow-hidden">
        <div className="flex-1 flex flex-col sm:border-r border-slate-100 min-h-0 min-w-0">
          <div className="px-4 py-3 flex gap-2 border-b border-slate-100 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddTeam((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Team</span>
            </button>
          </div>

          <AnimatePresence>
            {showAddTeam && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-slate-100 shrink-0"
              >
                <div className="px-4 py-3 bg-primary/5 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Team name *"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newTeamCity}
                    onChange={(e) => setNewTeamCity(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTeam}
                    disabled={creating || !newTeamName.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Add
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-secondary">No teams found</p>
                <p className="text-xs text-text-muted mt-1">Create a new team to get started</p>
              </div>
            ) : (
              filtered.map((team) => {
                const checked = selectedIds.has(team._id);
                return (
                  <motion.button
                    key={team._id}
                    type="button"
                    onClick={() => toggle(team._id)}
                    whileHover={{ backgroundColor: "#f8fafc" }}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-50 text-left transition-colors ${
                      checked ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-4 h-4 text-primary/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary truncate">{team.name}</p>
                      {team.city && <p className="text-xs text-text-muted">{team.city}</p>}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked ? "bg-primary border-primary" : "border-slate-300 bg-white"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        <div className="w-full sm:w-48 md:w-56 flex flex-col bg-slate-50/60 border-t sm:border-t-0 border-slate-100 min-h-[140px] sm:min-h-0 shrink-0">
          <div className="px-3 py-3 border-b border-slate-100 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Selected ({selectedIds.size})
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-2">
            {selectedTeams.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-text-muted">No teams selected</p>
              </div>
            ) : (
              selectedTeams.map((team) => (
                <div key={team._id} className="flex items-center gap-2 px-3 py-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {team.logo ? (
                      <img src={team.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-3 h-3 text-primary/60" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-secondary truncate flex-1">{team.name}</span>
                  <button
                    type="button"
                    onClick={() => toggle(team._id)}
                    className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-slate-100 shrink-0">
            <div className="text-xs text-text-muted text-center mb-1">
              {selectedIds.size} / {maxTeams}
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <motion.div
                animate={{
                  width: `${Math.min((selectedIds.size / (tournament?.numberOfTeams || 8)) * 100, 100)}%`,
                }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardFormModal>
  );
}
