import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, AlertTriangle, CheckCircle, ArrowRight, Calendar, Clock, Hash } from "lucide-react";
import { tournamentAPI } from "../../api/tournaments";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import DashboardFormModal, { DASHBOARD_MODAL_MAX_HEIGHT } from "./DashboardFormModal";
import {
  isDoubleRoundRobinType,
  isGroupStageType,
  isHybridType,
  isKnockoutType,
  isRoundRobinLeagueType,
} from "../../constants/tournamentTypes";

function determineGroupCount(teamCount) {
  if (teamCount >= 8) return 4;
  if (teamCount >= 4) return 2;
  return 1;
}

function groupSizes(teamCount, numGroups) {
  const sizes = Array.from({ length: numGroups }, () => 0);
  for (let i = 0; i < teamCount; i++) sizes[i % numGroups]++;
  return sizes;
}

function calcMatchCount(type, teamCount) {
  if (teamCount < 2) return 0;

  const playoffs = teamCount >= 4 ? 3 : 0;

  if (isKnockoutType(type)) {
    return teamCount - 1;
  }
  if (isDoubleRoundRobinType(type)) {
    return teamCount * (teamCount - 1) + playoffs;
  }
  if (isRoundRobinLeagueType(type)) {
    return (teamCount * (teamCount - 1)) / 2 + playoffs;
  }
  if (isGroupStageType(type)) {
    const numGroups = determineGroupCount(teamCount);
    return groupSizes(teamCount, numGroups).reduce((sum, size) => sum + (size * (size - 1)) / 2, 0);
  }
  if (isHybridType(type)) {
    if (teamCount < 4) return 0;
    const numGroups = teamCount >= 8 ? 4 : 2;
    const groupMatches = groupSizes(teamCount, numGroups).reduce(
      (sum, size) => sum + (size * (size - 1)) / 2,
      0
    );
    const knockoutTeams = numGroups * 2;
    const knockoutMatches = knockoutTeams > 1 ? knockoutTeams - 1 : 0;
    return groupMatches + knockoutMatches;
  }
  return (teamCount * (teamCount - 1)) / 2;
}

const footerBtnSecondary =
  "flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50";

export default function GenerateFixturesModal({ open, onClose, tournament, onGenerated }) {
  const [step, setStep] = useState("preview");
  const [matchCount, setMatchCount] = useState(0);
  const [existingCount, setExistingCount] = useState(0);
  const navigate = useNavigate();

  const [matchesPerDay, setMatchesPerDay] = useState(3);
  const [matchStartTime, setMatchStartTime] = useState("10:00 AM");
  const [matchDurationMinutes, setMatchDurationMinutes] = useState(180);

  useEffect(() => {
    if (open && tournament) {
      const teams = tournament.teams || [];
      setMatchCount(calcMatchCount(tournament.tournamentType, teams.length));
      setExistingCount(tournament._matchCount || 0);
      setStep("preview");
      setMatchesPerDay(3);
      setMatchStartTime("10:00 AM");
      setMatchDurationMinutes(180);
    }
  }, [open, tournament]);

  const teams = tournament?.teams || [];
  const teamCount = teams.length;
  const isHybrid = isHybridType(tournament?.tournamentType);
  const hasEnoughTeams = isHybrid ? teamCount >= 4 : teamCount >= 2;
  const isGenerating = step === "generating";

  const handleGenerate = async () => {
    setStep("generating");
    try {
      const { data } = await tournamentAPI.generateFixtures(tournament._id, {
        matchesPerDay: Number(matchesPerDay) || 3,
        matchStartTime: matchStartTime || "10:00 AM",
        matchDurationMinutes: Number(matchDurationMinutes) || 180,
      });
      const count = data.count ?? data.data?.length ?? 0;
      setMatchCount(count);
      setStep("success");
      toast.success(`${count} fixtures generated successfully!`);
      onGenerated?.();
    } catch (err) {
      toast.error(err.message || "Failed to generate fixtures");
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("preview");
    onClose();
  };

  const viewFixtures = () => {
    handleClose();
    navigate("/dashboard/fixtures");
  };

  const renderFooter = () => {
    if (step === "preview") {
      return (
        <div className="flex gap-3 px-4 sm:px-5 py-4">
          <button type="button" onClick={handleClose} className={footerBtnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!hasEnoughTeams}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-amber-500/25"
          >
            <Zap className="w-4 h-4" />
            Generate
          </button>
        </div>
      );
    }

    if (step === "success") {
      return (
        <div className="flex gap-3 px-4 sm:px-5 py-4">
          <button type="button" onClick={handleClose} className={footerBtnSecondary}>
            Close
          </button>
          <button
            type="button"
            onClick={viewFixtures}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            View Fixtures
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (step === "error") {
      return (
        <div className="flex gap-3 px-4 sm:px-5 py-4">
          <button type="button" onClick={handleClose} className={footerBtnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setStep("preview")}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <DashboardFormModal
      open={open}
      onClose={handleClose}
      loading={isGenerating}
      zIndex={70}
      maxWidthClass="max-w-md"
      maxHeightClass={DASHBOARD_MODAL_MAX_HEIGHT}
      header={
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-secondary truncate">Generate Fixtures</h2>
              <p className="text-xs text-text-muted truncate">{tournament?.tournamentName}</p>
            </div>
          </div>
          {!isGenerating && (
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      }
      footer={renderFooter()}
    >
      <AnimatePresence mode="wait">
        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-2xl font-bold text-secondary">{teamCount}</p>
                <p className="text-xs text-text-muted mt-0.5">Teams</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">{hasEnoughTeams ? matchCount : 0}</p>
                <p className="text-xs text-text-muted mt-0.5">Matches</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-sm font-bold text-secondary">{tournament?.tournamentType?.split(" ")[0]}</p>
                <p className="text-xs text-text-muted mt-0.5">Format</p>
              </div>
            </div>

            {teams.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Participating Teams
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {teams.slice(0, 8).map((t) => (
                    <span
                      key={t._id || t}
                      className="text-xs px-2 py-1 rounded-lg bg-white border border-slate-200 text-secondary font-medium"
                    >
                      {t.name || "Team"}
                    </span>
                  ))}
                  {teams.length > 8 && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                      +{teams.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {hasEnoughTeams && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Scheduling Options
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-text-muted flex items-center gap-1 mb-1">
                      <Hash className="w-3 h-3" /> Matches / Day
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={matchesPerDay}
                      onChange={(e) => setMatchesPerDay(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" /> Start Time
                    </label>
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={matchStartTime}
                      onChange={(e) => setMatchStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" /> Duration (min)
                    </label>
                    <input
                      type="number"
                      min={30}
                      step={15}
                      value={matchDurationMinutes}
                      onChange={(e) => setMatchDurationMinutes(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {!hasEnoughTeams && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  {isHybrid
                    ? "At least 4 teams are required for the Hybrid (Group Stage + Knockout) format. Please add teams first."
                    : "At least 2 teams are required to generate fixtures. Please add teams first."}
                </p>
              </div>
            )}

            {existingCount > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-200">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  This will replace {existingCount} existing fixtures. This cannot be undone.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10 gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
              />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-secondary">Generating Fixtures...</p>
              <p className="text-sm text-text-muted mt-1">Creating match schedule</p>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 gap-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1, stiffness: 300 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-secondary">Fixtures Generated!</p>
              <p className="text-sm text-text-muted mt-1">
                <span className="font-bold text-primary">{matchCount}</span> matches scheduled starting from{" "}
                {tournament?.startDate
                  ? new Date(tournament.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "the start date"}
              </p>
            </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-secondary">Generation Failed</p>
              <p className="text-sm text-text-muted mt-1">Something went wrong. Please try again.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardFormModal>
  );
}
