import { TrendingUp, Users } from "lucide-react";
import { ViewerBattingTable, ViewerBowlingTable } from "../viewer/ViewerScoreTables";

function InfoChip({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-secondary mt-0.5 break-words">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value, sub, highlight }) {
  return (
    <div
      className={`rounded-xl border p-3 min-w-0 ${
        highlight ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200/70 bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-1 text-sm font-bold break-words ${highlight ? "text-emerald-900" : "text-secondary"}`}>
        {value || "—"}
      </p>
      {sub && <p className="text-xs text-text-muted mt-0.5 break-words">{sub}</p>}
    </div>
  );
}

function InningsSection({ innings }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Innings {innings.inningsNumber}
          </p>
          <h3 className="text-lg font-extrabold text-secondary mt-0.5 break-words">{innings.battingTeamName}</h3>
          <p className="text-xs text-text-muted">vs {innings.bowlingTeamName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-secondary tabular-nums leading-none">{innings.score}</p>
          <p className="text-xs text-text-muted mt-1 tabular-nums">
            {innings.overs} ov · RR {innings.runRate}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-6">
        <ViewerBattingTable batting={innings.scorecard?.batting || []} title="Batting" icon={Users} />
        <ViewerBowlingTable bowling={innings.scorecard?.bowling || []} title="Bowling" icon={TrendingUp} />

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted border-t border-slate-100 pt-3">
          <span>
            Extras: <strong className="text-secondary">{innings.extras?.total ?? 0}</strong>
          </span>
          <span>4s: <strong className="text-secondary">{innings.totalFours ?? 0}</strong></span>
          <span>6s: <strong className="text-secondary">{innings.totalSixes ?? 0}</strong></span>
        </div>

        {innings.fallOfWickets?.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Fall of Wickets</p>
            <div className="flex flex-wrap gap-2">
              {innings.fallOfWickets.map((fow) => (
                <span
                  key={`${innings.inningsNumber}-${fow.wicket}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-secondary tabular-nums"
                >
                  {fow.wicket}-{fow.score} ({fow.overs})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BallTimeline({ overTimeline = [] }) {
  if (!overTimeline.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80">
        <h3 className="text-sm font-bold text-secondary">Ball-by-Ball Timeline</h3>
      </div>
      <div className="p-4 sm:p-5 space-y-4 max-h-[420px] overflow-y-auto">
        {overTimeline.map((block) => (
          <div key={`inn-${block.inningsNumber}`}>
            {block.battingTeamName && (
              <p className="text-xs font-semibold text-primary mb-2">{block.battingTeamName}</p>
            )}
            <div className="space-y-2">
              {(block.overs || []).map((over) => (
                <div key={`${block.inningsNumber}-${over.overNumber}`} className="flex flex-wrap items-start gap-2">
                  <span className="text-xs font-bold text-text-muted w-8 shrink-0 tabular-nums pt-1">
                    {over.overNumber + 1}
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {(over.balls || []).map((ball) => (
                      <span
                        key={ball._id || `${over.overNumber}-${ball.ballInOver}`}
                        className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded-lg text-xs font-bold tabular-nums ${
                          ball.label === "W"
                            ? "bg-red-100 text-red-700"
                            : ball.label === "4" || ball.label === "6"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-secondary"
                        }`}
                      >
                        {ball.label}
                      </span>
                    ))}
                    <span className="text-xs text-text-muted self-center ml-1">= {over.runs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const fmtDate = (d, time) => {
  if (!d) return time || "—";
  const date = new Date(d);
  const ds = Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return time ? `${ds} · ${time}` : ds;
};

export default function MatchSummaryPanel({ data }) {
  if (!data) return null;

  const { match, innings = [], summary = {}, overTimeline = [] } = data;
  const statusLabel =
    match.status === "Live" ? "Live" : match.status === "Completed" ? "Completed" : match.status;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div
          className={`px-4 sm:px-5 py-4 text-white ${
            match.status === "Live"
              ? "bg-gradient-to-r from-red-600 to-red-500"
              : match.status === "Completed"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                : "bg-gradient-to-r from-primary to-primary-dark"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
            {match.tournamentName} · Match {match.matchNumber ?? "—"}
          </p>
          <p className="text-lg sm:text-xl font-extrabold mt-1 break-words">
            {match.teamA?.name || "TBD"} vs {match.teamB?.name || "TBD"}
          </p>
          {match.resultSummary && (
            <p className="text-sm font-medium mt-1 opacity-95">{match.resultSummary}</p>
          )}
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          <InfoChip label="Status" value={statusLabel} />
          <InfoChip label="Venue" value={summary.venue?.label || match.venue?.label} />
          <InfoChip label="Date" value={fmtDate(summary.matchDate || match.scheduledDate, summary.matchTime || match.matchTime)} />
          <InfoChip label="Round" value={match.round} />
          <InfoChip label="Toss" value={summary.tossResult || match.tossResult} />
          <InfoChip label="Winner" value={summary.winner?.name || match.winner?.name} />
        </div>
      </div>

      {innings.length > 0 ? (
        <>
          {innings.map((inn) => (
            <InningsSection key={inn.inningsNumber} innings={inn} />
          ))}

          {(match.status === "Completed" || match.status === "Live") && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-secondary mb-3">Match Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <SummaryStat
                  label="Player of the Match"
                  value={summary.playerOfTheMatch?.name}
                  sub={summary.playerOfTheMatch?.highlight}
                  highlight={Boolean(summary.playerOfTheMatch)}
                />
                <SummaryStat
                  label="Highest Scorer"
                  value={summary.highestRunScorer?.name}
                  sub={
                    summary.highestRunScorer
                      ? `${summary.highestRunScorer.runs} (${summary.highestRunScorer.balls})`
                      : null
                  }
                />
                <SummaryStat
                  label="Best Bowler"
                  value={summary.bestBowler?.name}
                  sub={
                    summary.bestBowler
                      ? `${summary.bestBowler.wickets}/${summary.bestBowler.runs}`
                      : null
                  }
                />
                <SummaryStat label="Best Partnership" value={summary.bestPartnership?.label} />
                <SummaryStat label="Total Fours" value={String(summary.totalFours ?? 0)} />
                <SummaryStat label="Total Sixes" value={String(summary.totalSixes ?? 0)} />
                <SummaryStat
                  label="Extras"
                  value={String(summary.extras?.total ?? 0)}
                  sub={`W ${summary.extras?.wides ?? 0} · NB ${summary.extras?.noBalls ?? 0}`}
                />
                <SummaryStat
                  label="Winning Margin"
                  value={summary.resultSummary || match.resultSummary}
                />
              </div>
            </div>
          )}

          <BallTimeline overTimeline={overTimeline} />
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-sm text-text-muted">
            {match.status === "Scheduled"
              ? "Scorecard will be available once the match starts."
              : "No ball-by-ball data recorded for this match yet."}
          </p>
        </div>
      )}
    </div>
  );
}
