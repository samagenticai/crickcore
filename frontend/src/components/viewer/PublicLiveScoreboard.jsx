import { mediaUrl } from "../../utils/media";
import { resolveChaseTarget } from "../../utils/liveScore";
import { teamLabel } from "./PublicMatchTeamBadge";
import { VIEWER_CARD, VIEWER_LIVE_BADGE } from "./viewerUi";

/** Fixed block height — prevents layout jump when live scores update */
const SCORE_BLOCK_MIN_H = "min-h-[4.5rem]";

function teamInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";
}

export function TeamLogo({ team, slot, size = "md" }) {
  const name = teamLabel(team, slot);
  const logo = mediaUrl(team?.logo);
  const sizes = {
    sm: "w-10 h-10 text-[10px]",
    md: "w-11 h-11 sm:w-14 sm:h-14 text-xs sm:text-sm",
    lg: "w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] text-sm sm:text-base",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full overflow-hidden bg-white border-2 border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm`}
    >
      {logo ? (
        <img src={logo} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="font-bold text-primary">{teamInitials(name)}</span>
      )}
    </div>
  );
}

function LiveBadge({ compact = false }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-red-500/20 whitespace-nowrap">
        <span className="viewer-live-dot w-1.5 h-1.5 rounded-full bg-white shrink-0" />
        Live
      </span>
    );
  }

  return (
    <span className={VIEWER_LIVE_BADGE}>
      <span className="viewer-live-dot w-2 h-2 rounded-full bg-white shrink-0" />
      Live
    </span>
  );
}

function CompletedBadge({ compact = false }) {
  if (compact) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
        Done
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-bold uppercase tracking-[0.12em] shadow-sm shadow-emerald-500/20 whitespace-nowrap">
      Match Completed
    </span>
  );
}

function CenterCluster({ StatusBadge, showCrr, crr }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 min-w-[3.25rem] sm:min-w-[4.5rem] min-h-[3rem] sm:min-h-[3.25rem] px-0.5 sm:px-1 shrink-0">
      <StatusBadge compact />
      {showCrr ? (
        <div className="text-center leading-none min-h-[1.125rem] sm:min-h-[1.25rem]">
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-text-muted">
            CRR{" "}
          </span>
          <span className="text-[11px] sm:text-sm font-extrabold text-primary tabular-nums">{crr}</span>
        </div>
      ) : (
        <div className="min-h-[1.125rem] sm:min-h-[1.25rem]" aria-hidden />
      )}
    </div>
  );
}

function InningsScoreBlock({ inningsState, align }) {
  const isRight = align === "right";
  const textAlign = isRight ? "text-right items-end" : "text-left items-start";

  if (inningsState.type === "batting") {
    return (
      <div className={`${SCORE_BLOCK_MIN_H} flex flex-col justify-start gap-1 w-full ${textAlign}`}>
        <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-secondary tabular-nums leading-none tracking-tight">
          {inningsState.score}
        </p>
        <div
          className={`flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-text-muted ${
            isRight ? "justify-end" : "justify-start"
          }`}
        >
          <span>
            <span className="font-semibold text-secondary tabular-nums">{inningsState.overs}</span> ov
          </span>
          <span>
            <span className="font-semibold text-secondary tabular-nums">{inningsState.wickets}</span> wkts
          </span>
        </div>
        {inningsState.target != null && (
          <p className="text-[10px] sm:text-xs text-text-muted tabular-nums">
            Need {inningsState.runsRequired} off {inningsState.ballsRemaining} balls
            {inningsState.rrr != null && (
              <span className="ml-1">· RRR {inningsState.rrr}</span>
            )}
          </p>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide w-fit">
          <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
          Batting
        </span>
      </div>
    );
  }

  if (inningsState.type === "waiting") {
    return (
      <div className={`${SCORE_BLOCK_MIN_H} flex flex-col justify-start gap-1 w-full ${textAlign}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide w-fit">
          {inningsState.label}
        </span>
        {inningsState.target != null && (
          <p className="text-[10px] sm:text-xs text-text-muted tabular-nums">
            Target: <span className="font-bold text-secondary">{inningsState.target}</span>
          </p>
        )}
      </div>
    );
  }

  if (inningsState.type === "completed") {
    return (
      <div className={`${SCORE_BLOCK_MIN_H} flex flex-col justify-start gap-1 w-full ${textAlign}`}>
        <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-secondary tabular-nums leading-none">
          {inningsState.score}
        </p>
        <p className="text-[10px] sm:text-xs text-text-muted tabular-nums">{inningsState.overs} ov</p>
      </div>
    );
  }

  return <div className={`${SCORE_BLOCK_MIN_H} w-full`} aria-hidden />;
}

export function getTeamInningsState(match, side) {
  const ls = match?.liveScore;
  const teamId =
    side === "A"
      ? String(match.teamA?._id || match.teamA)
      : String(match.teamB?._id || match.teamB);

  if (match?.status === "Completed" && match?.matchResult?.innings?.length) {
    const inn = match.matchResult.innings.find((i) => String(i.battingTeamId) === teamId);
    if (inn) {
      return {
        type: "completed",
        score: inn.score,
        overs: inn.overs,
      };
    }
    return { type: "idle" };
  }

  const firstBatId = ls?.firstInnings?.battingTeam
    ? String(ls.firstInnings.battingTeam)
    : null;

  const hasActivity =
    ls?.isInitialized || ls?.awaitingSecondInnings || ls?.firstInnings?.runs != null;
  if (!hasActivity) return { type: "idle" };

  if (ls?.isInitialized && String(ls.battingTeam) === teamId) {
    const state = {
      type: "batting",
      score: `${ls.totalRuns ?? 0}/${ls.wickets ?? 0}`,
      overs: ls.overs ?? "0.0",
      wickets: ls.wickets ?? 0,
      runRate: ls.runRate ?? "0",
    };
    if ((ls.inningsNumber ?? 1) >= 2) {
      const target = resolveChaseTarget(ls);
      if (target != null) {
        state.target = target;
        state.runsRequired = ls.runsRequired;
        state.ballsRemaining = ls.ballsRemaining;
        state.rrr = ls.requiredRunRate;
      }
    }
    return state;
  }

  if (firstBatId === teamId && ls?.firstInnings?.runs != null) {
    const fi = ls.firstInnings;
    return {
      type: "completed",
      score: `${fi.runs}/${fi.wickets}`,
      overs: fi.overs ?? "0.0",
    };
  }

  if (ls?.awaitingSecondInnings && firstBatId !== teamId) {
    return { type: "waiting", label: "To Bat", target: resolveChaseTarget(ls) };
  }

  if (ls?.isInitialized && !firstBatId) {
    return { type: "waiting", label: "Yet to Bat" };
  }

  return { type: "idle" };
}

export default function PublicLiveScoreboard({ match }) {
  const stateA = getTeamInningsState(match, "A");
  const stateB = getTeamInningsState(match, "B");
  const ls = match?.liveScore;
  const isCompleted = match?.status === "Completed";
  const chaseTarget = resolveChaseTarget(ls);
  const showChaseBanner =
    !isCompleted &&
    chaseTarget != null &&
    ((ls?.isInitialized && (ls.inningsNumber ?? 1) >= 2) || ls?.awaitingSecondInnings);

  const StatusBadge = isCompleted ? CompletedBadge : LiveBadge;
  const nameA = teamLabel(match.teamA, match.teamASlot);
  const nameB = teamLabel(match.teamB, match.teamBSlot);
  const showCrr = !isCompleted && ls?.isInitialized;
  const crr = ls?.runRate ?? "0.00";

  return (
    <div className={`${VIEWER_CARD} overflow-hidden min-w-0 viewer-fade-in`}>
      {showChaseBanner && (
        <div className="px-3 sm:px-6 py-2.5 bg-primary/5 border-b border-primary/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] sm:text-sm">
          <span>
            Target: <strong className="text-secondary tabular-nums">{chaseTarget}</strong>
          </span>
          <span>
            Need: <strong className="text-secondary tabular-nums">{ls.runsRequired ?? 0}</strong>
          </span>
          <span>
            Balls: <strong className="text-secondary tabular-nums">{ls.ballsRemaining ?? 0}</strong>
          </span>
          <span>
            RRR: <strong className="text-primary tabular-nums">{ls.requiredRunRate ?? "—"}</strong>
          </span>
        </div>
      )}
      {match?.resultSummary && (
        <div className="px-3 sm:px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-center text-xs sm:text-sm font-bold text-emerald-900 break-words">
          {match.resultSummary}
        </div>
      )}

      <div className="px-3 sm:px-5 lg:px-8 py-4 sm:py-6 min-w-0">
        {/*
          Shared row grid — logos (row 1), names + LIVE badge (row 2), scores (row 3).
          Guarantees both team names sit on the same horizontal line at every width.
        */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_auto_auto] gap-x-2 sm:gap-x-4 gap-y-1.5 min-w-0">
          {/* Row 1 — logos */}
          <div className="col-start-1 row-start-1 flex justify-start items-center min-w-0">
            <TeamLogo team={match.teamA} slot={match.teamASlot} size="md" />
          </div>
          <div className="col-start-3 row-start-1 flex justify-end items-center min-w-0">
            <TeamLogo team={match.teamB} slot={match.teamBSlot} size="md" />
          </div>

          {/* Row 2 — team names (aligned) + center badge */}
          <p
            className="col-start-1 row-start-2 self-center font-bold text-secondary text-xs sm:text-sm leading-tight line-clamp-2 min-h-[2.5rem] max-h-[2.5rem] overflow-hidden text-left min-w-0"
            title={nameA}
          >
            {nameA}
          </p>

          <div className="col-start-2 row-start-2 self-center flex items-center justify-center">
            <CenterCluster StatusBadge={StatusBadge} showCrr={showCrr} crr={crr} />
          </div>

          <p
            className="col-start-3 row-start-2 self-center font-bold text-secondary text-xs sm:text-sm leading-tight line-clamp-2 min-h-[2.5rem] max-h-[2.5rem] overflow-hidden text-right min-w-0"
            title={nameB}
          >
            {nameB}
          </p>

          {/* Row 3 — scores */}
          <div className="col-start-1 row-start-3 min-w-0">
            <InningsScoreBlock inningsState={stateA} align="left" />
          </div>
          <div className="col-start-3 row-start-3 min-w-0">
            <InningsScoreBlock inningsState={stateB} align="right" />
          </div>
        </div>
      </div>
    </div>
  );
}
