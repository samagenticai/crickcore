import { TrendingUp, Trophy, Users } from "lucide-react";
import { mediaUrl } from "../../utils/media";
import { ViewerBattingTable, ViewerBowlingTable } from "./ViewerScoreTables";
import { VIEWER_CARD } from "./viewerUi";

function SummaryCard({ label, value, sub, highlight }) {
  return (
    <div
      className={`rounded-xl border p-3.5 sm:p-4 min-w-0 ${
        highlight
          ? "border-emerald-200/80 bg-emerald-50/60"
          : "border-slate-200/70 bg-slate-50/50"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-1.5 text-sm font-bold text-secondary break-words ${highlight ? "text-emerald-900" : ""}`}>
        {value || "—"}
      </p>
      {sub && <p className="text-xs text-text-muted mt-1 break-words">{sub}</p>}
    </div>
  );
}

function InningsBlock({ innings }) {
  const extras = innings?.extras ?? {};
  const scorecard = innings?.scorecard ?? {};

  return (
    <div className={`${VIEWER_CARD} p-4 sm:p-5 lg:p-6 space-y-6 sm:space-y-8 min-w-0`}>
      <div className="flex flex-wrap items-end justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Innings {innings?.inningsNumber ?? "—"}
          </p>
          <h3 className="text-lg font-extrabold text-secondary mt-1 break-words">{innings?.battingTeamName || "—"}</h3>
          <p className="text-xs text-text-muted mt-0.5 break-words">vs {innings?.bowlingTeamName || "—"}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl sm:text-3xl font-extrabold text-secondary tabular-nums leading-none">
            {innings?.score ?? "—"}
          </p>
          <p className="text-xs text-text-muted mt-1 tabular-nums">
            {innings?.overs ?? "0.0"} overs · RR {innings?.runRate ?? "—"}
          </p>
        </div>
      </div>

      <ViewerBattingTable batting={scorecard.batting} title="Batting" icon={Users} />

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted border-t border-slate-100 pt-3">
        <span>
          Extras: <strong className="text-secondary tabular-nums">{extras.total ?? 0}</strong>
          {" "}(w {extras.wides ?? 0}, nb {extras.noBalls ?? 0}, b {extras.byes ?? 0}, lb{" "}
          {extras.legByes ?? 0})
        </span>
        <span>
          4s: <strong className="text-secondary tabular-nums">{innings?.totalFours ?? 0}</strong>
        </span>
        <span>
          6s: <strong className="text-secondary tabular-nums">{innings?.totalSixes ?? 0}</strong>
        </span>
      </div>

      <ViewerBowlingTable bowling={scorecard.bowling} title="Bowling" icon={TrendingUp} />
    </div>
  );
}

function formatMatchDateTime(date, time) {
  if (!date) return time || "—";
  const d = new Date(date);
  const dateStr = Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  return time ? `${dateStr} · ${time}` : dateStr;
}

export default function PublicMatchResult({ matchResult, match }) {
  if (!matchResult?.innings?.length) {
    return (
      <div className={`${VIEWER_CARD} p-10 text-center`}>
        <p className="text-sm text-text-muted">Match result data is not available.</p>
      </div>
    );
  }

  const { summary, innings } = matchResult;

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      <div className={`${VIEWER_CARD} overflow-hidden min-w-0`}>
        <div className="px-4 sm:px-6 py-4 bg-emerald-600 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                  Match Completed
                </p>
                <p className="text-base sm:text-lg font-extrabold break-words">
                  {summary?.resultSummary || "Result"}
                </p>
              </div>
            </div>
            {summary?.winner?.logo && (
              <img
                src={mediaUrl(summary.winner.logo)}
                alt=""
                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover shrink-0"
              />
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 min-w-0">
          <SummaryCard label="Winner" value={summary?.winner?.name} highlight />
          <SummaryCard label="Runner-up" value={summary?.runnerUp?.name} />
          <SummaryCard
            label="Player of the Match"
            value={summary?.playerOfTheMatch?.name}
            sub={summary?.playerOfTheMatch?.highlight}
            highlight={Boolean(summary?.playerOfTheMatch)}
          />
          <SummaryCard
            label="Highest Run Scorer"
            value={summary?.highestRunScorer?.name}
            sub={
              summary?.highestRunScorer
                ? `${summary.highestRunScorer.runs} (${summary.highestRunScorer.balls})`
                : null
            }
          />
          <SummaryCard
            label="Best Bowler"
            value={summary?.bestBowler?.name}
            sub={
              summary?.bestBowler
                ? `${summary.bestBowler.wickets}/${summary.bestBowler.runs} · Econ ${Number(summary.bestBowler.economy || 0).toFixed(2)}`
                : null
            }
          />
          <SummaryCard label="Best Partnership" value={summary?.bestPartnership?.label || "—"} />
          <SummaryCard label="Total Fours" value={String(summary?.totalFours ?? 0)} />
          <SummaryCard label="Total Sixes" value={String(summary?.totalSixes ?? 0)} />
          <SummaryCard
            label="Extras"
            value={String(summary?.extras?.total ?? 0)}
            sub={`W ${summary?.extras?.wides ?? 0} · NB ${summary?.extras?.noBalls ?? 0} · B ${summary?.extras?.byes ?? 0} · LB ${summary?.extras?.legByes ?? 0}`}
          />
          <SummaryCard label="Toss" value={summary?.tossResult || "Not recorded"} />
          <SummaryCard
            label="Venue"
            value={summary?.venue?.label || match?.venue?.venueName || match?.venue?.name || "—"}
            sub={summary?.venue?.address}
          />
          <SummaryCard
            label="Date & Time"
            value={formatMatchDateTime(summary?.matchDate, summary?.matchTime)}
          />
          {summary?.round && <SummaryCard label="Round" value={summary.round} />}
        </div>
      </div>

      {innings.map((inn) => (
        <InningsBlock key={inn.inningsNumber} innings={inn} />
      ))}
    </div>
  );
}
