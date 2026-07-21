import { ChevronRight, MapPin, Users } from "lucide-react";
import { mediaUrl } from "../../utils/media";

function teamInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

export default function PublicTeamCard({ team, onClick }) {
  const logo = mediaUrl(team.logo);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] hover:border-primary/25 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
          {logo ? (
            <img src={logo} alt={team.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-sm font-bold text-primary">{teamInitials(team.name)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-secondary text-sm sm:text-base truncate group-hover:text-primary transition-colors">
            {team.name}
          </p>
          {team.city && (
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {team.city}
            </p>
          )}
          <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
            <Users className="w-3 h-3 shrink-0" />
            {team.playerCount ?? 0} player{(team.playerCount ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary shrink-0 transition-colors" />
      </div>
    </button>
  );
}
