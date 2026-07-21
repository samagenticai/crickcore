import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import { battingTeamName, hasMatchResult } from "../../utils/liveScore";
import { formatTossViewerLine } from "../../utils/toss";
import { VIEWER_CARD, VIEWER_LIVE_BADGE } from "./viewerUi";

const MATCH_STATUS = {
  Upcoming: { label: "Upcoming", class: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Live: { label: "Live", class: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", pulse: true },
  Completed: { label: "Completed", class: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

export const mapMatchStatus = (status) => {
  if (status === "Scheduled") return "Upcoming";
  if (status === "Live") return "Live";
  if (status === "Completed") return "Completed";
  return "Upcoming";
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBD";

const teamLabel = (team, slot) => (team && team.name) || slot?.label || "TBD";

const matchVenue = (match, tournament) => {
  if (match.venue?.name) {
    return match.venue.city ? `${match.venue.name}, ${match.venue.city}` : match.venue.name;
  }
  return tournament?.groundName || tournament?.venue || tournament?.city || "Venue TBD";
};

export default function PublicFixtureCard({ match, tournamentName, tournament, tournamentId }) {
  const displayStatus = mapMatchStatus(match.status);
  const statusStyle = MATCH_STATUS[displayStatus] || MATCH_STATUS.Upcoming;
  const isLive = displayStatus === "Live";
  const tossText = formatTossViewerLine(match);
  const href = tournamentId ? `/viewer/${tournamentId}/match/${match._id}` : null;
  const ls = match.liveScore;
  const showScore = match.status === "Live" && ls?.isInitialized;
  const showResult = hasMatchResult(match);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide truncate">
          {tournamentName}
        </p>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusStyle.class}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${statusStyle.pulse ? "animate-pulse" : ""}`} />
          {statusStyle.label}
        </span>
      </div>

      <p className="text-base sm:text-lg font-bold text-secondary leading-snug break-words">
        {teamLabel(match.teamA, match.teamASlot)}{" "}
        <span className="text-text-muted font-medium text-sm">vs</span>{" "}
        {teamLabel(match.teamB, match.teamBSlot)}
      </p>

      {showResult && (
        <div className="mt-2 space-y-1">
          {match.matchResult.innings.map((inn) => (
            <p key={inn.inningsNumber} className="text-sm font-bold text-secondary tabular-nums">
              {inn.battingTeamName}: {inn.score}
              <span className="text-text-muted font-medium ml-2">({inn.overs} ov)</span>
            </p>
          ))}
          {match.resultSummary && (
            <p className="text-xs font-semibold text-emerald-700">{match.resultSummary}</p>
          )}
        </div>
      )}

      {showScore && (
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <p className="text-xl font-extrabold text-secondary">
            {ls.totalRuns}/{ls.wickets}
            <span className="text-sm font-semibold text-text-muted ml-2">({ls.overs} ov)</span>
          </p>
          {battingTeamName(match) && (
            <span className="text-xs text-text-muted">{battingTeamName(match)}</span>
          )}
          {match.lastBall?.label && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-secondary">
              Last: {match.lastBall.label}
            </span>
          )}
        </div>
      )}

      {match.round && (
        <p className="text-xs text-text-muted mt-1">{match.round}</p>
      )}

      {isLive ? (
        <div className="mt-4 space-y-2">
          <span className={VIEWER_LIVE_BADGE}>
            <span className="viewer-live-dot w-2 h-2 rounded-full bg-white" />
            Live
          </span>
          {tossText && <p className="text-xs sm:text-sm text-text-muted">{tossText}</p>}
          <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            {matchVenue(match, tournament)}
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            {fmtDate(match.scheduledDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            {match.matchTime || "TBD"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            {matchVenue(match, tournament)}
          </span>
        </div>
      )}
    </>
  );

  const className = `block ${VIEWER_CARD} p-4 sm:p-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-primary/15 min-w-0`;

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function sortFixtures(matches) {
  const order = { Live: 0, Scheduled: 1, Completed: 2 };
  return [...matches].sort(
    (a, b) =>
      (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
      (a.matchNumber || 0) - (b.matchNumber || 0)
  );
}
