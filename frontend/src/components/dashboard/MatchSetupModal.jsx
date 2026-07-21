import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Loader2, Users, Gavel, ClipboardList, AlertCircle, CheckCircle2, Swords, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { playerAPI } from "../../api/players";
import { umpireAPI } from "../../api/umpires";
import { scorerAPI } from "../../api/scorers";
import { tournamentAPI } from "../../api/tournaments";
import { buildMatchUmpirePayload } from "../../utils/matchUmpires";
import { formatTossResult, teamNameById } from "../../utils/toss";
import {
  countSelectedWicketKeepers,
  MAX_WICKET_KEEPERS,
  sortPlayersByRole,
} from "../../utils/playerRoles";
import { mediaUrl } from "../../utils/media";
import UmpireSelect from "./UmpireSelect";
import ScorerSelect from "./ScorerSelect";
import {
  LiveScoreModal,
  LiveScoreModalAccent,
  LiveScoreModalBody,
  LiveScoreModalFooter,
  LiveScoreModalHeader,
} from "./live-score/LiveScoreModal";

const PLAYING_XI = 11;
const MAX_SQUAD = 15;

const ROLE_BADGE = {
  Batsman: "bg-blue-50 text-blue-700",
  Bowler: "bg-rose-50 text-rose-700",
  "All-Rounder": "bg-amber-50 text-amber-700",
  "Wicket-Keeper": "bg-purple-50 text-purple-700",
};

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

function teamName(team, slot) {
  return (team && team.name) || slot?.label || "TBD";
}

function teamId(team) {
  if (!team) return null;
  return typeof team === "object" ? team._id : team;
}

function PlayerRow({ player, selected, disabled, onToggle }) {
  const photo = mediaUrl(player.photo);
  return (
    <button
      type="button"
      onClick={() => onToggle(player._id)}
      disabled={disabled && !selected}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
        selected
          ? "border-primary/40 bg-primary/5"
          : disabled
            ? "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
            : "border-slate-100 hover:border-primary/25 hover:bg-slate-50"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "border-primary bg-primary" : "border-slate-300"
        }`}
      >
        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>

      {photo ? (
        <img src={photo} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
          {initials(player.name)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-secondary truncate">{player.name}</p>
        <p className="text-[11px] text-text-muted">
          {player.jerseyNumber != null ? `#${player.jerseyNumber}` : "—"}
          {player.role ? ` · ${player.role}` : ""}
        </p>
      </div>

      {player.role && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[player.role] || "bg-slate-100 text-slate-600"}`}>
          {player.role === "Wicket-Keeper" ? "WK" : player.role.slice(0, 3)}
        </span>
      )}
    </button>
  );
}

function SquadColumn({ title, squad, selected, onToggle }) {
  const atLimit = selected.length >= PLAYING_XI;

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-secondary truncate">{title}</h3>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            selected.length === PLAYING_XI
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-text-muted"
          }`}
        >
          {selected.length} / {PLAYING_XI}
        </span>
      </div>

      {squad.length === 0 ? (
        <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-text-muted">No players in squad. Add players before starting.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
          {squad.map((player) => {
            const isSelected = selected.includes(player._id);
            return (
              <PlayerRow
                key={player._id}
                player={player}
                selected={isSelected}
                disabled={atLimit}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MatchSetupModal({
  open,
  onClose,
  match,
  tournamentId,
  tossWinner,
  tossDecision,
  onStarted,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teamASquad, setTeamASquad] = useState([]);
  const [teamBSquad, setTeamBSquad] = useState([]);
  const [umpires, setUmpires] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [teamASelected, setTeamASelected] = useState([]);
  const [teamBSelected, setTeamBSelected] = useState([]);
  const [mainUmpireId, setMainUmpireId] = useState("");
  const [legUmpireId, setLegUmpireId] = useState("");
  const [scorerId, setScorerId] = useState("");
  const [loadError, setLoadError] = useState("");

  const reset = useCallback(() => {
    setTeamASquad([]);
    setTeamBSquad([]);
    setUmpires([]);
    setScorers([]);
    setTeamASelected([]);
    setTeamBSelected([]);
    setMainUmpireId("");
    setLegUmpireId("");
    setScorerId("");
    setLoadError("");
    setLoading(true);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open || !match || !tournamentId) return;

    reset();
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const aId = teamId(match.teamA);
        const bId = teamId(match.teamB);

        if (!aId || !bId) {
          setLoadError("Both teams must be confirmed before match setup.");
          return;
        }

        const [squadA, squadB, umpireList, scorerList] = await Promise.all([
          playerAPI.getAll({ team: aId, tournament: tournamentId }),
          playerAPI.getAll({ team: bId, tournament: tournamentId }),
          umpireAPI.getAll({ status: "Available", limit: 100 }),
          scorerAPI.getAll({ status: "Active", limit: 100 }),
        ]);

        setTeamASquad(sortPlayersByRole(squadA.data?.data || []).slice(0, MAX_SQUAD));
        setTeamBSquad(sortPlayersByRole(squadB.data?.data || []).slice(0, MAX_SQUAD));
        setUmpires(umpireList.data?.data || []);
        setScorers(scorerList.data?.data || []);
      } catch (err) {
        setLoadError(err?.message || "Failed to load match setup data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, match, tournamentId, reset]);

  const togglePlayer = (setter, squad) => (id) => {
    setter((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= PLAYING_XI) {
        toast.error(`Playing XI is limited to ${PLAYING_XI} players`);
        return prev;
      }
      const player = squad.find((p) => String(p._id) === String(id));
      if (player?.role === "Wicket-Keeper") {
        const wkCount = countSelectedWicketKeepers(prev, squad);
        if (wkCount >= MAX_WICKET_KEEPERS) {
          toast.error("Maximum 2 wicket keepers are allowed in the Playing XI.");
          return prev;
        }
      }
      return [...prev, id];
    });
  };

  const handleMainUmpireChange = (id) => {
    setMainUmpireId(id);
    if (id && String(id) === String(legUmpireId)) {
      setLegUmpireId("");
    }
  };

  const canSubmit = useMemo(
    () =>
      teamASelected.length === PLAYING_XI &&
      teamBSelected.length === PLAYING_XI &&
      countSelectedWicketKeepers(teamASelected, teamASquad) <= MAX_WICKET_KEEPERS &&
      countSelectedWicketKeepers(teamBSelected, teamBSquad) <= MAX_WICKET_KEEPERS &&
      Boolean(tossWinner) &&
      Boolean(tossDecision) &&
      Boolean(mainUmpireId) &&
      Boolean(scorerId) &&
      umpires.length > 0 &&
      scorers.length > 0 &&
      !loading &&
      !loadError,
    [
      teamASelected,
      teamBSelected,
      teamASquad,
      teamBSquad,
      tossWinner,
      tossDecision,
      mainUmpireId,
      scorerId,
      umpires.length,
      scorers.length,
      loading,
      loadError,
    ]
  );

  const handleStart = async () => {
    if (!canSubmit || !match) return;
    if (!mainUmpireId) {
      toast.error("Main umpire is required");
      return;
    }
    if (!scorerId) {
      toast.error("Please select a scorer");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        teamAPlayingXI: teamASelected,
        teamBPlayingXI: teamBSelected,
        tossWinner,
        tossDecision,
        scorerId,
        ...buildMatchUmpirePayload({ mainUmpireId, legUmpireId }),
      };
      if (import.meta.env.DEV) {
        console.log("[MatchSetup] startMatch payload:", payload);
      }
      const { data } = await tournamentAPI.startMatch(tournamentId, match._id, payload);
      toast.success("Match started — opening live scoring");
      onStarted?.(data.data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to start match");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goToUmpires = () => {
    onClose();
    navigate("/dashboard/umpires");
  };

  const goToScorers = () => {
    onClose();
    navigate("/dashboard/scorers");
  };

  if (!match) return null;

  const nameA = teamName(match.teamA, match.teamASlot);
  const nameB = teamName(match.teamB, match.teamBSlot);
  const tossPreview = match
    ? formatTossResult({
        teamA: match.teamA,
        teamB: match.teamB,
        tossWinner: { _id: tossWinner, name: teamNameById(match, tossWinner) },
        tossDecision,
      })
    : null;

  return (
    <LiveScoreModal
      open={open}
      onClose={handleClose}
      maxWidth="max-w-4xl"
      closeOnBackdrop={!submitting}
      zIndex="z-[100]"
    >
      <LiveScoreModalAccent className="bg-linear-to-r from-amber-400 via-primary to-accent" />
      <LiveScoreModalHeader
        icon={Play}
        badge="Match Setup"
        title="Start Match"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary">{nameA}</span>
            <Swords className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-secondary">{nameB}</span>
          </span>
        }
        onClose={submitting ? undefined : handleClose}
      />

      <LiveScoreModalBody>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-text-muted">Loading squads, umpires, and scorers…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className="text-sm text-secondary font-medium">{loadError}</p>
          </div>
        ) : (
          <div className="space-y-6 min-w-0">
            <p className="text-sm text-text-muted">
              Select the official Playing XI ({PLAYING_XI} players) for each team from their squad (max{" "}
              {MAX_SQUAD} players). Choose umpires and an active scorer from your saved lists.
            </p>

            {tossPreview && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-secondary">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1">Toss recorded</p>
                <p>{tossPreview}</p>
                <p className="text-xs text-text-muted mt-1">
                  Batting first:{" "}
                  <span className="font-semibold text-secondary">
                    {tossDecision === "Bat"
                      ? teamNameById(match, tossWinner)
                      : nameA === teamNameById(match, tossWinner)
                        ? nameB
                        : nameA}
                  </span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
              <SquadColumn
                title={nameA}
                squad={teamASquad}
                selected={teamASelected}
                onToggle={togglePlayer(setTeamASelected, teamASquad)}
              />
              <SquadColumn
                title={nameB}
                squad={teamBSquad}
                selected={teamBSelected}
                onToggle={togglePlayer(setTeamBSelected, teamBSquad)}
              />
            </div>

            <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-secondary">Umpires</h3>
              </div>

              {umpires.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center space-y-3">
                  <p className="text-sm text-text-muted">
                    No umpires available. Please add umpires from the Umpires module.
                  </p>
                  <button
                    type="button"
                    onClick={goToUmpires}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Umpire
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                  <UmpireSelect
                    label="Main Umpire"
                    required
                    value={mainUmpireId}
                    onChange={handleMainUmpireChange}
                    umpires={umpires}
                    excludeId={legUmpireId}
                    placeholder="Select main umpire"
                    onAddNew={goToUmpires}
                  />
                  <UmpireSelect
                    label="Leg Umpire"
                    value={legUmpireId}
                    onChange={setLegUmpireId}
                    umpires={umpires}
                    excludeId={mainUmpireId}
                    placeholder="Select leg umpire (optional)"
                    onAddNew={goToUmpires}
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-secondary">Select Scorer</h3>
              </div>

              {scorers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center space-y-3">
                  <p className="text-sm text-text-muted">
                    No active scorers available. Add an Active scorer from the Scorers module.
                  </p>
                  <button
                    type="button"
                    onClick={goToScorers}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Scorer
                  </button>
                </div>
              ) : (
                <ScorerSelect
                  label="Official Scorer"
                  required
                  value={scorerId}
                  onChange={setScorerId}
                  scorers={scorers}
                  placeholder="Select scorer"
                  onAddNew={goToScorers}
                />
              )}
            </div>
          </div>
        )}
      </LiveScoreModalBody>

      <LiveScoreModalFooter>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={!canSubmit || submitting}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              canSubmit && !submitting
                ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Match
              </>
            )}
          </button>
        </div>
      </LiveScoreModalFooter>
    </LiveScoreModal>
  );
}
