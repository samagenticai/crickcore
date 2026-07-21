import { mediaUrl } from "../../utils/media";

function teamInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

export function teamLabel(team, slot) {
  return (team && team.name) || slot?.label || "TBD";
}

export function teamId(team) {
  return team?._id || team?.id || null;
}

export default function PublicMatchTeamBadge({ team, slot, align = "center" }) {
  const name = teamLabel(team, slot);
  const logo = mediaUrl(team?.logo);
  const alignClass = align === "right" ? "items-end text-right" : align === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <div className={`flex flex-col gap-2 min-w-0 ${alignClass}`}>
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm">
        {logo ? (
          <img src={logo} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-sm font-bold text-primary">{teamInitials(name)}</span>
        )}
      </div>
      <p className="font-bold text-secondary text-xs sm:text-base leading-tight line-clamp-2 min-h-[2.5rem] max-h-[2.5rem] overflow-hidden max-w-full sm:max-w-[11rem]">
        {name}
      </p>
    </div>
  );
}
