import { ArrowLeft, Loader2, Users } from "lucide-react";
import { mediaUrl } from "../../utils/media";
import PublicPlayerCard from "./PublicPlayerCard";

function teamInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

export default function PublicSquadPanel({ team, players, loading, onBack }) {
  const logo = mediaUrl(team?.logo);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to teams
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm">
            {logo ? (
              <img src={logo} alt={team?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-primary">{teamInitials(team?.name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Squad</p>
            <h3 className="text-lg sm:text-xl font-bold text-secondary truncate">{team?.name}</h3>
            {team?.city && <p className="text-xs text-text-muted mt-0.5">{team.city}</p>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Loading squad…</p>
        </div>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-text-muted px-4 text-center">
          <Users className="w-8 h-8 text-slate-300" />
          <p className="text-sm">No players registered for this team yet.</p>
        </div>
      ) : (
        <div>
          <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-white">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {players.length} Player{players.length !== 1 ? "s" : ""}
            </p>
          </div>
          {players.map((player) => (
            <PublicPlayerCard key={player._id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
