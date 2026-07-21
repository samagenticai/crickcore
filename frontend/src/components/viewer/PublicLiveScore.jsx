import { motion } from "framer-motion";
import { Radio, User, TrendingUp, CircleDot } from "lucide-react";
import { battingTeamName } from "../../utils/liveScore";

function PlayerRow({ label, player, highlight }) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${highlight ? "border-emerald-200/80 bg-emerald-50/40" : "border-slate-200/80 bg-slate-50/40"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-primary/70 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-secondary truncate">{player?.name || "—"}</p>
          {player?.jerseyNumber != null && (
            <p className="text-[11px] text-text-muted">#{player.jerseyNumber}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicLiveScore({ match }) {
  const ls = match?.liveScore;
  const lastBall = match?.lastBall;
  const batting = battingTeamName(match);

  if (!ls?.isInitialized) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <CircleDot className="w-8 h-8 text-primary/30 mx-auto mb-2" />
        <p className="text-sm text-text-muted">Live score will appear once scoring begins</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-red-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
    >
      <div className="px-4 sm:px-5 py-3 border-b border-red-100 bg-gradient-to-r from-red-50/80 to-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-600 animate-pulse" />
          <p className="text-sm font-bold text-secondary">Live Score</p>
        </div>
        {lastBall && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-secondary">
            Last ball:
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] ${
              lastBall.type === "wicket"
                ? "bg-red-100 text-red-700"
                : lastBall.runs === 4
                  ? "bg-emerald-100 text-emerald-700"
                  : lastBall.runs === 6
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-secondary"
            }`}>
              {lastBall.label}
            </span>
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/15 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Score</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-secondary">
              {ls.totalRuns ?? 0}
              <span className="text-lg text-text-muted">/{ls.wickets ?? 0}</span>
            </p>
            {batting && <p className="text-xs text-text-muted mt-1 truncate">{batting}</p>}
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3 sm:p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Overs</p>
            <p className="text-2xl font-bold text-secondary">{ls.overs ?? "0.0"}</p>
            <p className="text-[11px] text-text-muted">of {match?.overs ?? 20}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3 sm:p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Wickets</p>
            <p className="text-2xl font-bold text-red-600">{ls.wickets ?? 0}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3 sm:p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Run Rate
            </p>
            <p className="text-2xl font-bold text-primary">{ls.runRate ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PlayerRow label="Striker" player={ls.striker} highlight />
          <PlayerRow label="Non-Striker" player={ls.nonStriker} />
          <PlayerRow label="Bowler" player={ls.bowler} />
        </div>
      </div>
    </motion.div>
  );
}
