import { Hash } from "lucide-react";
import { mediaUrl } from "../../utils/media";

const ROLE_BADGE = {
  Batsman: "bg-blue-50 text-blue-700",
  Bowler: "bg-rose-50 text-rose-700",
  "All-Rounder": "bg-amber-50 text-amber-700",
  "Wicket-Keeper": "bg-purple-50 text-purple-700",
};

const ROLE_LABEL = {
  Batsman: "Batsman",
  Bowler: "Bowler",
  "All-Rounder": "All-Rounder",
  "Wicket-Keeper": "Wicket Keeper",
};

function playerInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

function PlayerPhoto({ player }) {
  const photo = mediaUrl(player.photo);
  if (photo) {
    return (
      <img
        src={photo}
        alt={player.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="text-sm font-bold text-primary">{playerInitials(player.name)}</span>
  );
}

function StatPill({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 tabular-nums">
      <span className="text-[10px] font-semibold text-text-muted">{label}</span>
      <span className="text-[11px] font-bold text-secondary">{value}</span>
    </span>
  );
}

function BattingStatsBlock({ stats }) {
  if (!stats) return null;

  if (stats.status === "DNB") {
    return (
      <p className="mt-2 text-[11px] text-slate-500 italic">{stats.dismissal || "DNB (Did Not Bat)"}</p>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap gap-1">
        <StatPill label="R" value={stats.runs} />
        <StatPill label="B" value={stats.balls} />
        <StatPill label="4s" value={stats.fours} />
        <StatPill label="6s" value={stats.sixes} />
        <StatPill label="SR" value={Number(stats.strikeRate || 0).toFixed(2)} />
      </div>
      <p className="text-[11px] leading-snug">
        <span
          className={`font-semibold ${stats.status === "Out" ? "text-red-700" : "text-emerald-700"}`}
        >
          {stats.status}
        </span>
        {stats.status === "Out" && stats.dismissal && stats.dismissal !== "Out" && (
          <span className="text-text-muted"> · {stats.dismissal}</span>
        )}
      </p>
    </div>
  );
}

function BowlingStatsBlock({ stats }) {
  if (!stats) {
    return <p className="mt-1.5 text-[11px] text-slate-500 italic">Did Not Bowl</p>;
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      <StatPill label="O" value={stats.overs} />
      <StatPill label="M" value={stats.maidens} />
      <StatPill label="R" value={stats.runs} />
      <StatPill label="W" value={stats.wickets} />
      <StatPill label="Econ" value={Number(stats.economy || 0).toFixed(2)} />
    </div>
  );
}

export default function PublicPlayerCard({ player, showMatchStats = false }) {
  const roleClass = ROLE_BADGE[player.role] || "bg-slate-100 text-slate-600";
  const battingStats = player.battingStats;
  const bowlingStats = player.bowlingStats;

  return (
    <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
        <PlayerPhoto player={player} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-secondary text-sm sm:text-base break-words leading-snug">{player.name}</p>
        <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${roleClass}`}>
          {ROLE_LABEL[player.role] || player.role || "—"}
        </span>

        {showMatchStats && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                Batting
              </p>
              <BattingStatsBlock stats={battingStats} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                Bowling
              </p>
              <BowlingStatsBlock stats={bowlingStats} />
            </div>
          </div>
        )}
      </div>

      {player.jerseyNumber != null && (
        <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 text-secondary">
          <Hash className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-sm font-bold tabular-nums">{player.jerseyNumber}</span>
        </div>
      )}
    </div>
  );
}
