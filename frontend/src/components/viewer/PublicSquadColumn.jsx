import { Loader2, Users } from "lucide-react";
import PublicPlayerCard from "./PublicPlayerCard";
import { teamLabel } from "./PublicMatchTeamBadge";
import { sortPlayersByRole } from "../../utils/playerRoles";
import { VIEWER_CARD } from "./viewerUi";

export default function PublicSquadColumn({ team, slot, players, loading }) {
  const name = teamLabel(team, slot);
  const sortedPlayers = sortPlayersByRole(players);

  return (
    <div className={`${VIEWER_CARD} overflow-hidden min-w-0`}>
      <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <p className="text-sm font-bold text-secondary break-words leading-snug">{name}</p>
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mt-0.5">Squad</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-xs">Loading squad…</p>
        </div>
      ) : !team?._id ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-muted px-4 text-center">
          <Users className="w-7 h-7 text-slate-300" />
          <p className="text-xs">Squad not announced yet</p>
        </div>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-muted px-4 text-center">
          <Users className="w-7 h-7 text-slate-300" />
          <p className="text-xs">No players in squad</p>
        </div>
      ) : (
        <div>
          {sortedPlayers.map((player) => (
            <PublicPlayerCard key={player._id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
