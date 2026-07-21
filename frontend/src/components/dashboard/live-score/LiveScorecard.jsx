import { useMemo } from "react";
import {
  Activity,
  Gauge,
  Layers,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react";
import {
  LabeledStat,
  RoleBadge,
  StatusBadge,
} from "./ScorecardParts";
import { getExtrasSummary } from "../../../utils/liveScore";
import { sortPlayersByRole } from "../../../utils/playerRoles";
import { VIEWER_CARD } from "../../viewer/viewerUi";
import DeliveryBallChip from "../../viewer/DeliveryBallChip";
import {
  ViewerBattingTable,
  ViewerBowlingTable,
  ViewerCreaseTable,
} from "../../viewer/ViewerScoreTables";
import { formatScoredByLine } from "../../../utils/scorerDisplay";

const SHELL =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]";

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
      {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
      <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function BallChip({ ball }) {
  return <DeliveryBallChip ball={ball} />;
}

/* ── Compact strip for organizer scoring panel ── */
function CompactScoreStrip({ liveScore, matchOvers, battingTeamName }) {
  const isChase = (liveScore?.inningsNumber ?? 1) >= 2 && liveScore?.target != null;

  return (
    <div className="rounded-xl bg-linear-to-r from-secondary to-slate-800 text-white px-4 py-4 sm:px-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">
        {battingTeamName} · Innings {liveScore?.inningsNumber ?? 1}
      </p>
      <div className={`grid grid-cols-2 ${isChase ? "sm:grid-cols-3 lg:grid-cols-7" : "sm:grid-cols-4"} gap-4`}>
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Score</p>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums mt-0.5">
            {liveScore?.totalRuns ?? 0}
            <span className="text-lg text-white/70">/{liveScore?.wickets ?? 0}</span>
          </p>
        </div>
        <LabeledStatLight label="Overs" value={liveScore?.overs ?? "0.0"} />
        <LabeledStatLight label="Run Rate" value={liveScore?.runRate ?? "0"} highlight />
        {isChase ? (
          <>
            <LabeledStatLight label="Target" value={liveScore.target} highlight />
            <LabeledStatLight label="Need" value={liveScore.runsRequired ?? 0} />
            <LabeledStatLight label="Balls Left" value={liveScore.ballsRemaining ?? 0} />
            <LabeledStatLight
              label="RRR"
              value={liveScore.requiredRunRate ?? "—"}
              highlight
            />
          </>
        ) : (
          <LabeledStatLight label="Max Overs" value={matchOvers ?? 20} />
        )}
      </div>
    </div>
  );
}

function LabeledStatLight({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold tabular-nums mt-0.5 ${highlight ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function CreaseBatsmanRow({ batsman }) {
  const isStrike = batsman.status === "on_strike";

  return (
    <tr className={isStrike ? "bg-emerald-50/60" : "bg-slate-50/50"}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {isStrike && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
          )}
          <span className="font-semibold text-secondary text-sm truncate">{batsman.name}</span>
          {isStrike && (
            <span className="text-[10px] font-bold text-emerald-700 uppercase shrink-0">*</span>
          )}
        </div>
      </td>
      <td className="text-center font-bold tabular-nums px-2 py-2.5">{batsman.runs ?? 0}</td>
      <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{batsman.balls ?? 0}</td>
      <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{batsman.fours ?? 0}</td>
      <td className="text-center tabular-nums text-text-muted px-2 py-2.5">{batsman.sixes ?? 0}</td>
      <td className="text-center tabular-nums font-semibold text-primary px-3 py-2.5">
        {Number(batsman.strikeRate || 0).toFixed(2)}
      </td>
    </tr>
  );
}

function UnifiedBattingTable({ batting }) {
  const sortedBatting = useMemo(() => sortPlayersByRole(batting), [batting]);

  return (
    <>
      <SectionTitle icon={Users} title="Batting" />
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-text-muted border-b border-slate-200 bg-slate-50/80">
              <th className="text-left font-semibold px-3 py-2.5">Player</th>
              <th className="text-center font-semibold px-2 py-2.5 w-12">R</th>
              <th className="text-center font-semibold px-2 py-2.5 w-12">B</th>
              <th className="text-center font-semibold px-2 py-2.5 w-12">4s</th>
              <th className="text-center font-semibold px-2 py-2.5 w-12">6s</th>
              <th className="text-center font-semibold px-3 py-2.5 w-16">SR</th>
            </tr>
          </thead>
          <tbody>
            {sortedBatting.map((b) => (
              <tr
                key={b.playerId}
                className={`border-b border-slate-100 last:border-0 ${
                  b.status === "out"
                    ? "bg-red-50/25"
                    : b.status === "on_strike"
                      ? "bg-emerald-50/35"
                      : b.status === "non_strike"
                        ? "bg-slate-50/40"
                        : ""
                }`}
              >
                <td className="px-3 py-2.5 align-middle">
                  <div className="flex items-center gap-2 min-w-0">
                    {b.status === "on_strike" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-secondary truncate">{b.name}</p>
                      {b.status === "out" && b.dismissal?.text && (
                        <p className="text-[11px] text-red-600/90 font-medium truncate mt-0.5">
                          {b.dismissal.text}
                        </p>
                      )}
                      {b.status === "yet_to_bat" && (
                        <p className="text-[11px] text-text-muted italic mt-0.5">Yet to bat</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-center font-bold tabular-nums px-2 py-2.5 align-middle">
                  {b.status === "yet_to_bat" ? "—" : b.runs}
                </td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5 align-middle">
                  {b.status === "yet_to_bat" ? "—" : b.balls}
                </td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5 align-middle">
                  {b.status === "yet_to_bat" ? "—" : b.fours}
                </td>
                <td className="text-center tabular-nums text-text-muted px-2 py-2.5 align-middle">
                  {b.status === "yet_to_bat" ? "—" : b.sixes}
                </td>
                <td className="text-center tabular-nums font-semibold text-primary px-3 py-2.5 align-middle">
                  {b.status === "yet_to_bat" ? "—" : Number(b.strikeRate || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UnifiedBowlingTable({ bowling }) {
  if (!bowling.length) return null;

  return (
    <>
      <SectionTitle icon={TrendingUp} title="Bowling" />
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-text-muted border-b border-slate-100">
              <th className="text-left font-semibold px-3 py-2.5">Bowler</th>
              <th className="text-center font-semibold px-2 py-2.5">O</th>
              <th className="text-center font-semibold px-2 py-2.5">M</th>
              <th className="text-center font-semibold px-2 py-2.5">R</th>
              <th className="text-center font-semibold px-2 py-2.5">W</th>
              <th className="text-center font-semibold px-3 py-2.5">Econ</th>
            </tr>
          </thead>
          <tbody>
            {bowling.map((b) => (
              <tr
                key={b.playerId}
                className={`border-b border-slate-50 last:border-0 ${b.isCurrent ? "bg-amber-50/40" : ""}`}
              >
                <td className="px-3 py-3">
                  <p className="font-semibold text-secondary">{b.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <RoleBadge role={b.role} size="xs" />
                    {b.isCurrent && <StatusBadge status="bowling" />}
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
    </>
  );
}

function SidebarBlock({ title, icon: Icon, children }) {
  return (
    <div>
      <SectionTitle icon={Icon} title={title} />
      {children}
    </div>
  );
}

function ViewerSidebar({
  activeBatters,
  currentBowler,
  liveScore,
  matchOvers,
  lastWicket,
}) {
  const extras = getExtrasSummary(liveScore);
  const isChase = (liveScore?.inningsNumber ?? 1) >= 2 && liveScore?.target != null;

  return (
    <div className={`${VIEWER_CARD} p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 xl:sticky xl:top-4 min-w-0`}>
      <SidebarBlock title="Innings" icon={TrendingUp}>
        <div className="grid grid-cols-2 gap-3">
          <LabeledStat label="Overs" value={`${liveScore?.overs ?? "0.0"} / ${matchOvers ?? 20}`} highlight />
          {isChase && (
            <>
              <LabeledStat label="Target" value={liveScore.target} highlight />
              <LabeledStat label="Runs Required" value={liveScore.runsRequired ?? 0} />
              <LabeledStat label="Balls Remaining" value={liveScore.ballsRemaining ?? 0} />
              <LabeledStat
                label="Required RR"
                value={liveScore.requiredRunRate ?? "—"}
                highlight
              />
            </>
          )}
        </div>
      </SidebarBlock>

      {activeBatters.length > 0 && (
        <ViewerCreaseTable batters={activeBatters} title="At Crease" icon={Activity} />
      )}

      {currentBowler && (
        <SidebarBlock title="Bowler" icon={Gauge}>
          <p className="font-bold text-secondary break-words">{currentBowler.name}</p>
          <div className="mt-1.5 mb-3">
            <RoleBadge role={currentBowler.role} size="xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledStat label="Overs" value={currentBowler.overs} />
            <LabeledStat label="Runs" value={currentBowler.runs} />
            <LabeledStat label="Wickets" value={currentBowler.wickets} highlight />
            <LabeledStat label="Economy" value={Number(currentBowler.economy || 0).toFixed(2)} highlight />
          </div>
        </SidebarBlock>
      )}

      <SidebarBlock title="Extras" icon={Layers}>
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <span className="text-sm font-semibold text-secondary">Total</span>
          <span className="text-xl font-extrabold text-primary tabular-nums min-w-[2ch]">{extras.total}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <LabeledStat label="Wides" value={extras.wides} />
          <LabeledStat label="No Balls" value={extras.noBalls} />
          <LabeledStat label="Byes" value={extras.byes} />
          <LabeledStat label="Leg Byes" value={extras.legByes} />
        </div>
      </SidebarBlock>

      {lastWicket && (
        <SidebarBlock title="Last Wicket" icon={UserX}>
          <p className="font-bold text-secondary break-words">{lastWicket.playerName}</p>
          <p className="text-sm text-red-700/90 mt-1 break-words">{lastWicket.dismissalType}</p>
        </SidebarBlock>
      )}
    </div>
  );
}

function ViewerLayout({ scorecard, liveScore, matchOvers, lastWicket, scoredByLine }) {
  const { batting = [], bowling = [] } = scorecard;
  const activeBatters = batting.filter((b) => b.status === "on_strike" || b.status === "non_strike");
  const currentBowler = bowling.find((b) => b.isCurrent);

  return (
    <div className="space-y-3 min-w-0">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start min-w-0">
        <div className="xl:col-span-8 min-w-0">
          <div className={`${VIEWER_CARD} p-4 sm:p-5 lg:p-6 space-y-6 sm:space-y-8 min-w-0`}>
            <ViewerBattingTable batting={batting} title="Batting" icon={Users} />
            <ViewerBowlingTable bowling={bowling} title="Bowling" icon={TrendingUp} />
          </div>
        </div>

        <div className="xl:col-span-4 min-w-0">
          <ViewerSidebar
            activeBatters={activeBatters}
            currentBowler={currentBowler}
            liveScore={liveScore}
            matchOvers={matchOvers}
            lastWicket={lastWicket}
          />
        </div>
      </div>
      {scoredByLine && (
        <p className="text-center text-xs sm:text-sm text-text-muted px-2">{scoredByLine}</p>
      )}
    </div>
  );
}

function LiveInsights({ lastWicket, recentBalls }) {
  const lastOverBalls = recentBalls?.slice(-6) || [];
  if (!lastWicket && lastOverBalls.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {lastWicket && (
        <div className="rounded-xl bg-red-50/50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-800 mb-1">Last Wicket</p>
          <p className="font-bold text-secondary text-sm">{lastWicket.playerName}</p>
          <p className="text-xs text-red-700/90 mt-0.5">{lastWicket.dismissalType}</p>
        </div>
      )}
      {lastOverBalls.length > 0 && (
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Last Over</p>
          <div className="flex flex-wrap gap-1.5">
            {lastOverBalls.map((ball) => (
              <BallChip key={ball._id || ball.sequence} ball={ball} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveScorecard({
  scorecard,
  battingTeamName,
  liveScore,
  matchOvers,
  variant = "full",
  lastWicket,
  recentBalls,
  match,
}) {
  if (!scorecard) return null;

  const { batting = [], bowling = [] } = scorecard;
  const activeBatters = batting.filter((b) => b.status === "on_strike" || b.status === "non_strike");
  const currentBowler = bowling.find((b) => b.isCurrent);
  const scoredByLine = formatScoredByLine(match);

  if (variant === "viewer") {
    return (
      <ViewerLayout
        scorecard={scorecard}
        liveScore={liveScore}
        matchOvers={matchOvers}
        lastWicket={lastWicket}
        recentBalls={recentBalls}
        scoredByLine={scoredByLine}
      />
    );
  }

  const showCompact = variant === "compact" || variant === "full";
  const showDetails = variant === "details" || variant === "full";

  return (
    <div className={variant === "full" ? "space-y-5" : "space-y-4"}>
      {showCompact && (
        <>
          <CompactScoreStrip
            liveScore={liveScore}
            matchOvers={matchOvers}
            battingTeamName={battingTeamName}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeBatters.length > 0 && (
              <div className={`${SHELL} p-4`}>
                <SectionTitle icon={Activity} title="At Crease" />
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-text-muted border-b border-slate-100">
                        <th className="text-left font-semibold px-3 py-2">Player</th>
                        <th className="text-center font-semibold px-2 py-2 w-10">R</th>
                        <th className="text-center font-semibold px-2 py-2 w-10">B</th>
                        <th className="text-center font-semibold px-2 py-2 w-10">4s</th>
                        <th className="text-center font-semibold px-2 py-2 w-10">6s</th>
                        <th className="text-center font-semibold px-2 py-2 w-12">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBatters.map((b) => (
                        <CreaseBatsmanRow key={b.playerId} batsman={b} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {currentBowler && (
              <div className={`${SHELL} p-4`}>
                <SectionTitle icon={Gauge} title="Bowler" />
                <p className="font-bold text-secondary">{currentBowler.name}</p>
                <div className="mt-1.5 mb-3">
                  <RoleBadge role={currentBowler.role} size="xs" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <LabeledStat label="Overs" value={currentBowler.overs} />
                  <LabeledStat label="Runs" value={currentBowler.runs} />
                  <LabeledStat label="Wickets" value={currentBowler.wickets} highlight />
                  <LabeledStat label="Economy" value={Number(currentBowler.economy || 0).toFixed(2)} highlight />
                </div>
              </div>
            )}
          </div>

          <LiveInsights lastWicket={lastWicket} recentBalls={recentBalls} />
        </>
      )}

      {showDetails && (
        <div className={`${SHELL} p-5 sm:p-6 lg:p-8 space-y-8`}>
          <UnifiedBattingTable batting={batting} />
          <UnifiedBowlingTable bowling={bowling} />
          {scoredByLine && (
            <p className="text-sm text-text-muted text-center pt-2 border-t border-slate-100">
              {scoredByLine}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
