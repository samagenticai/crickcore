import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Calendar, Users, Archive } from "lucide-react";
import TournamentVenueDetails from "./TournamentVenueDetails";
import PublicSponsorsSection from "../viewer/PublicSponsorsSection";
import { mediaUrl } from "../../utils/media";
import { MODAL_BACKDROP } from "../ui/modalUi";

const STATUS_CLASS = {
  Draft: "bg-slate-100 text-slate-600",
  Upcoming: "bg-blue-50 text-blue-700",
  Live: "bg-red-50 text-red-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-orange-50 text-orange-700",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

const teamName = (team) => (typeof team === "object" && team ? team.name : null) || "—";

export default function TournamentDetailsModal({ open, onClose, tournament }) {
  if (!tournament) return null;

  const logo = mediaUrl(tournament.tournamentLogo);
  const isStorageArchived = Boolean(tournament.isStorageArchived);
  const summary = tournament.archiveSummary || {};

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={MODAL_BACKDROP}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative w-full sm:max-w-lg max-h-[92vh] bg-white text-secondary rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Trophy className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-secondary truncate">{tournament.tournamentName}</h2>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLASS[tournament.status] || STATUS_CLASS.Draft}`}>
                    {tournament.status}
                  </span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-4">
              {isStorageArchived ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
                    <Archive className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-secondary">Storage archive</p>
                      <p className="text-sm text-text-muted mt-1">
                        This tournament has been archived to optimize storage. Only the summary is kept — fixtures,
                        matches, and detailed statistics are no longer available.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Winner</p>
                      <p className="font-semibold text-secondary mt-1">{teamName(tournament.winner)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Runner-up</p>
                      <p className="font-semibold text-secondary mt-1">{teamName(tournament.runnerUp)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Teams</p>
                      <p className="font-semibold text-secondary mt-1">{summary.totalTeams ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Matches</p>
                      <p className="font-semibold text-secondary mt-1">{summary.totalMatches ?? tournament.totalMatches ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary/70" />
                      {fmt(tournament.startDate)} – {fmt(tournament.endDate)}
                    </span>
                    {summary.venueName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary/70" />
                        {summary.venueName}
                      </span>
                    ) : null}
                  </div>

                  {summary.organizerName ? (
                    <p className="text-xs text-text-muted">
                      Organizer: <span className="font-medium text-secondary">{summary.organizerName}</span>
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Type</p>
                      <p className="font-semibold text-secondary mt-1">{tournament.tournamentType}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Format</p>
                      <p className="font-semibold text-secondary mt-1">{tournament.matchFormat} · {tournament.overs} ov</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary/70" />
                      {fmt(tournament.startDate)} – {fmt(tournament.endDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary/70" />
                      {(tournament.teams?.length ?? 0)} / {tournament.numberOfTeams} teams
                    </span>
                  </div>

                  <TournamentVenueDetails tournament={tournament} />

                  <PublicSponsorsSection sponsors={tournament.sponsors} />

                  {tournament.description && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Description</p>
                      <p className="text-sm text-secondary leading-relaxed">{tournament.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
