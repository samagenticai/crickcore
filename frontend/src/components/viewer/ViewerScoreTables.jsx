import { useMemo } from "react";
import { sortPlayersByRole } from "../../utils/playerRoles";
import { RoleBadge } from "../dashboard/live-score/ScorecardParts";
import { VIEWER_CARD_INNER } from "./viewerUi";

function StatCell({ label, value, bold }) {
  return (
    <div className="text-center min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`text-sm tabular-nums ${bold ? "font-bold text-secondary" : "font-medium text-secondary/90"}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function MobileBattingCard({ batsman }) {
  const isOut = batsman.status === "out";
  const yetToBat = batsman.status === "yet_to_bat";
  const onCrease = batsman.status === "on_strike" || batsman.status === "non_strike";

  return (
    <div
      className={`${VIEWER_CARD_INNER} p-3 ${
        isOut ? "bg-red-50/40" : onCrease ? "bg-emerald-50/35" : ""
      }`}
    >
      <div className="flex items-start gap-2 min-w-0">
        {batsman.status === "on_strike" && (
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-secondary text-sm leading-snug break-words">{batsman.name}</p>
          {isOut && batsman.dismissal?.text && (
            <p className="text-[11px] text-red-600/90 font-medium mt-0.5 break-words">{batsman.dismissal.text}</p>
          )}
          {batsman.dismissalDisplay && (
            <p className="text-[11px] text-red-600/90 font-medium mt-0.5 break-words">{batsman.dismissalDisplay}</p>
          )}
          {yetToBat && <p className="text-[11px] text-text-muted italic mt-0.5">Yet to bat</p>}
          {batsman.battingStatus === "DNB" && (
            <p className="text-[11px] text-text-muted italic mt-0.5">Did not bat</p>
          )}
          {batsman.isNotOut && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">not out</p>
          )}
        </div>
      </div>
      {!yetToBat && batsman.battingStatus !== "DNB" && (
        <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-slate-200/60">
          <StatCell label="R" value={batsman.runs} bold />
          <StatCell label="B" value={batsman.balls} />
          <StatCell label="4s" value={batsman.fours} />
          <StatCell label="6s" value={batsman.sixes} />
          <StatCell label="SR" value={Number(batsman.strikeRate || 0).toFixed(1)} />
        </div>
      )}
    </div>
  );
}

function MobileBowlingCard({ bowler }) {
  return (
    <div className={`${VIEWER_CARD_INNER} p-3 ${bowler.isCurrent ? "bg-amber-50/40" : ""}`}>
      <p className="font-semibold text-secondary text-sm break-words">{bowler.name}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <RoleBadge role={bowler.role} size="xs" />
      </div>
      <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-slate-200/60">
        <StatCell label="O" value={bowler.overs} />
        <StatCell label="M" value={bowler.maidens} />
        <StatCell label="R" value={bowler.runs} />
        <StatCell label="W" value={bowler.wickets} bold />
        <StatCell label="Econ" value={Number(bowler.economy || 0).toFixed(1)} />
      </div>
    </div>
  );
}

export function ViewerBattingTable({ batting, title = "Batting", icon: Icon }) {
  const sorted = useMemo(() => sortPlayersByRole(batting || []), [batting]);
  if (!sorted.length) return null;

  return (
    <div className="viewer-fade-in">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">{title}</h3>
      </div>

      <div className="sm:hidden space-y-2">
        {sorted.map((b) => (
          <MobileBattingCard key={b.playerId || b._id || b.name} batsman={b} />
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-text-muted border-b border-slate-200 bg-slate-50/80">
              <th className="text-left font-semibold px-3 py-2.5 w-[38%]">Player</th>
              <th className="text-center font-semibold px-2 py-2.5">R</th>
              <th className="text-center font-semibold px-2 py-2.5">B</th>
              <th className="text-center font-semibold px-2 py-2.5">4s</th>
              <th className="text-center font-semibold px-2 py-2.5">6s</th>
              <th className="text-center font-semibold px-3 py-2.5">SR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr
                key={b.playerId || b._id || b.name}
                className={`border-b border-slate-100 last:border-0 ${
                  b.status === "out"
                    ? "bg-red-50/25"
                    : b.status === "on_strike"
                      ? "bg-emerald-50/35"
                      : b.isNotOut
                        ? "bg-emerald-50/20"
                        : ""
                }`}
              >
                <td className="px-3 py-2.5 align-middle min-w-0">
                  <p className="font-semibold text-secondary truncate">{b.name}</p>
                  {b.dismissal?.text && (
                    <p className="text-[11px] text-red-600/90 truncate mt-0.5">{b.dismissal.text}</p>
                  )}
                  {b.dismissalDisplay && (
                    <p className="text-[11px] text-red-600/90 truncate mt-0.5">{b.dismissalDisplay}</p>
                  )}
                </td>
                <td className="text-center font-bold tabular-nums px-2 py-2.5">{b.status === "yet_to_bat" ? "—" : b.runs}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{b.status === "yet_to_bat" ? "—" : b.balls}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{b.status === "yet_to_bat" ? "—" : b.fours}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{b.status === "yet_to_bat" ? "—" : b.sixes}</td>
                <td className="text-center tabular-nums font-semibold text-primary px-3 py-2.5">
                  {b.status === "yet_to_bat" ? "—" : Number(b.strikeRate || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ViewerBowlingTable({ bowling, title = "Bowling", icon: Icon }) {
  if (!bowling?.length) return null;

  return (
    <div className="viewer-fade-in">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">{title}</h3>
      </div>

      <div className="sm:hidden space-y-2">
        {bowling.map((b) => (
          <MobileBowlingCard key={b.playerId || b._id || b.name} bowler={b} />
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-text-muted border-b border-slate-100">
              <th className="text-left font-semibold px-3 py-2.5 w-[40%]">Bowler</th>
              <th className="text-center font-semibold px-2 py-2.5">O</th>
              <th className="text-center font-semibold px-2 py-2.5">M</th>
              <th className="text-center font-semibold px-2 py-2.5">R</th>
              <th className="text-center font-semibold px-2 py-2.5">W</th>
              <th className="text-center font-semibold px-3 py-2.5">Econ</th>
            </tr>
          </thead>
          <tbody>
            {bowling.map((b) => (
              <tr key={b.playerId || b._id || b.name} className={`border-b border-slate-50 last:border-0 ${b.isCurrent ? "bg-amber-50/40" : ""}`}>
                <td className="px-3 py-3 min-w-0">
                  <p className="font-semibold text-secondary truncate">{b.name}</p>
                  <div className="mt-1">
                    <RoleBadge role={b.role} size="xs" />
                  </div>
                </td>
                <td className="text-center tabular-nums font-medium px-2 py-3">{b.overs}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-3">{b.maidens}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-3">{b.runs}</td>
                <td className="text-center tabular-nums font-bold text-red-600 px-2 py-3">{b.wickets}</td>
                <td className="text-center tabular-nums font-semibold text-primary px-3 py-3">
                  {Number(b.economy || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ViewerCreaseTable({ batters, title = "At Crease", icon: Icon }) {
  if (!batters?.length) return null;

  return (
    <div className="viewer-fade-in">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">{title}</h3>
      </div>

      <div className="sm:hidden space-y-2">
        {batters.map((b) => (
          <MobileBattingCard key={b.playerId || b._id} batsman={b} />
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-text-muted border-b border-slate-100">
              <th className="text-left font-semibold px-3 py-2 w-[42%]">Player</th>
              <th className="text-center font-semibold px-2 py-2">R</th>
              <th className="text-center font-semibold px-2 py-2">B</th>
              <th className="text-center font-semibold px-2 py-2">4s</th>
              <th className="text-center font-semibold px-2 py-2">6s</th>
              <th className="text-center font-semibold px-2 py-2">SR</th>
            </tr>
          </thead>
          <tbody>
            {batters.map((b) => (
              <tr key={b.playerId || b._id} className={b.status === "on_strike" ? "bg-emerald-50/60" : "bg-slate-50/50"}>
                <td className="px-3 py-2.5 min-w-0">
                  <p className="font-semibold text-secondary text-sm truncate">{b.name}</p>
                </td>
                <td className="text-center font-bold tabular-nums px-2 py-2.5">{b.runs ?? 0}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{b.balls ?? 0}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{b.fours ?? 0}</td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{b.sixes ?? 0}</td>
                <td className="text-center tabular-nums font-semibold text-primary px-2 py-2.5">
                  {Number(b.strikeRate || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
