import { Calendar, MapPin } from "lucide-react";
import PublicMatchTeamBadge, { teamLabel } from "./PublicMatchTeamBadge";
import PublicLiveScoreboard from "./PublicLiveScoreboard";
import { mapMatchStatus } from "./PublicFixtureCard";
import { hasLiveScoring } from "../../utils/liveScore";
import { formatTossViewerLine } from "../../utils/toss";
import { formatMatchUmpiresLine } from "../../utils/umpireDisplay";
import { formatScoredByLine } from "../../utils/scorerDisplay";
import { VIEWER_CARD, VIEWER_LIVE_BADGE } from "./viewerUi";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "TBD";

const STATUS_CLASS = {
  Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  Live: "bg-red-50 text-red-700 border-red-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const matchVenue = (match, tournament) => {
  if (match.venue?.name) {
    return match.venue.city ? `${match.venue.name}, ${match.venue.city}` : match.venue.name;
  }
  return tournament?.groundName || tournament?.venue || tournament?.city || "Venue TBD";
};

export default function PublicMatchHeader({ match, tournament, belowScoreboard = null }) {
  const displayStatus = mapMatchStatus(match.status);
  const statusClass = STATUS_CLASS[displayStatus] || STATUS_CLASS.Upcoming;
  const isLive = match?.status === "Live";
  const isLiveScoring = hasLiveScoring(match);
  const showScoreboard = isLiveScoring || (match?.status === "Completed" && match?.resultSummary);
  const tossText = formatTossViewerLine(match);
  const umpiresLine = formatMatchUmpiresLine(match);
  const scoredByLine = formatScoredByLine(match);

  if (showScoreboard) {
    return (
      <div className="space-y-3 min-w-0">
        <div className="sticky top-[6rem] sm:top-[4.75rem] z-30 space-y-2 min-w-0 pb-0.5">
          <div className="rounded-[14px] shadow-[0_2px_14px_rgba(15,23,42,0.06)] bg-white/95 backdrop-blur-md">
            <PublicLiveScoreboard match={match} />
          </div>
          {belowScoreboard}
        </div>
        {tossText && (
          <p className="text-center text-xs sm:text-sm text-text-muted px-4">{tossText}</p>
        )}
        {umpiresLine && (
          <p className="text-center text-xs sm:text-sm text-text-muted px-4">{umpiresLine}</p>
        )}
        {scoredByLine && (
          <p className="text-center text-xs sm:text-sm text-text-muted px-4">{scoredByLine}</p>
        )}
        {(match.round || match.matchNumber != null) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-text-muted px-2">
            {match.round && <span>{match.round}</span>}
            {match.matchNumber != null && <span>Match {match.matchNumber}</span>}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {matchVenue(match, tournament)}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (isLive) {
    return (
      <div className={`${VIEWER_CARD} p-4 sm:p-5 lg:p-6 min-w-0`}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide text-center mb-4 truncate px-2">
          {tournament?.tournamentName}
        </p>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-2 sm:gap-4 min-w-0">
          <div className="flex justify-start min-w-0 self-start">
            <PublicMatchTeamBadge team={match.teamA} slot={match.teamASlot} align="left" />
          </div>

          <div className="flex items-center justify-center self-center px-0.5 shrink-0">
            <span className={VIEWER_LIVE_BADGE}>
              <span className="viewer-live-dot w-2 h-2 rounded-full bg-white" />
              Live
            </span>
          </div>

          <div className="flex justify-end min-w-0 self-start">
            <PublicMatchTeamBadge team={match.teamB} slot={match.teamBSlot} align="right" />
          </div>
        </div>

        {tossText && (
          <p className="mt-4 text-center text-xs sm:text-sm text-text-muted px-2">{tossText}</p>
        )}
        {umpiresLine && (
          <p className="mt-1 text-center text-xs sm:text-sm text-text-muted px-2">{umpiresLine}</p>
        )}
        {scoredByLine && (
          <p className="mt-1 text-center text-xs sm:text-sm text-text-muted px-2">{scoredByLine}</p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-muted">
          {match.round && <span>{match.round}</span>}
          {match.matchNumber != null && <span>Match {match.matchNumber}</span>}
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {matchVenue(match, tournament)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${VIEWER_CARD} p-4 sm:p-5 lg:p-6 min-w-0`}>
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide text-center mb-4 truncate px-2">
        {tournament?.tournamentName}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex justify-start">
          <PublicMatchTeamBadge team={match.teamA} slot={match.teamASlot} align="left" />
        </div>

        <div className="text-center px-1 sm:px-2 shrink-0">
          <p className="text-xs sm:text-sm font-semibold text-text-muted">{fmtDate(match.scheduledDate)}</p>
          <span className={`inline-block mt-2 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
            {displayStatus}
          </span>
        </div>

        <div className="flex justify-end">
          <PublicMatchTeamBadge team={match.teamB} slot={match.teamBSlot} align="right" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-muted">
        {match.round && <span>{match.round}</span>}
        {match.matchNumber != null && <span>Match {match.matchNumber}</span>}
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {matchVenue(match, tournament)}
        </span>
      </div>
    </div>
  );
}

export function PublicMatchInfo({ match, tournament }) {
  const displayStatus = mapMatchStatus(match.status);
  const isLive = match?.status === "Live";
  const tossText = formatTossViewerLine(match);
  const umpiresLine = formatMatchUmpiresLine(match);
  const scoredByLine = formatScoredByLine(match);
  const rows = isLive
    ? []
    : [
        {
          icon: Calendar,
          label: "Date",
          value: match.scheduledDate
            ? new Date(match.scheduledDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "TBD",
        },
        {
          icon: MapPin,
          label: "Venue",
          value: match.venue?.name
            ? match.venue.city
              ? `${match.venue.name}, ${match.venue.city}`
              : match.venue.name
            : tournament?.groundName || tournament?.venue || tournament?.city || "TBD",
        },
      ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <p className="text-sm font-bold text-secondary">Match Information</p>
      </div>
      <dl className="divide-y divide-slate-100">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="flex items-center gap-2 text-sm text-text-muted shrink-0">
              <Icon className="w-4 h-4 text-primary/70" />
              {label}
            </dt>
            <dd className="text-sm font-semibold text-secondary text-right">{value || "—"}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
          <dt className="text-sm text-text-muted">Round</dt>
          <dd className="text-sm font-semibold text-secondary">{match.round || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
          <dt className="text-sm text-text-muted">Status</dt>
          <dd className="text-sm font-semibold text-secondary">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden />
                🔴 LIVE
              </span>
            ) : (
              displayStatus
            )}
          </dd>
        </div>
        {isLive && tossText && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="text-sm text-text-muted">Toss</dt>
            <dd className="text-sm font-semibold text-secondary text-right max-w-[60%]">{tossText}</dd>
          </div>
        )}
        {isLive && umpiresLine && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="text-sm text-text-muted">Umpire{umpiresLine.startsWith("Umpires:") ? "s" : ""}</dt>
            <dd className="text-sm font-semibold text-secondary text-right max-w-[60%]">
              {umpiresLine.replace(/^Umpires?:\s*/, "")}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
          <dt className="text-sm text-text-muted">Teams</dt>
          <dd className="text-sm font-semibold text-secondary text-right">
            {teamLabel(match.teamA, match.teamASlot)} vs {teamLabel(match.teamB, match.teamBSlot)}
          </dd>
        </div>
        {match.overs != null && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="text-sm text-text-muted">Overs</dt>
            <dd className="text-sm font-semibold text-secondary">{match.overs}</dd>
          </div>
        )}
        {tossText && !isLive && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="text-sm text-text-muted">Toss</dt>
            <dd className="text-sm font-semibold text-secondary text-right max-w-[60%]">{tossText}</dd>
          </div>
        )}
        {umpiresLine && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="text-sm text-text-muted">Umpire{umpiresLine.startsWith("Umpires:") ? "s" : ""}</dt>
            <dd className="text-sm font-semibold text-secondary text-right max-w-[60%]">
              {umpiresLine.replace(/^Umpires?:\s*/, "")}
            </dd>
          </div>
        )}
        {scoredByLine && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
            <dt className="text-sm text-text-muted">Scored By</dt>
            <dd className="text-sm font-semibold text-secondary text-right max-w-[60%]">
              {scoredByLine.replace(/^Scored By:\s*/, "")}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
