const teamLabel = (team, slot) => (team && team.name) || slot?.label || "TBD";

export function getEffectiveTournamentStatus(tournament, { hasLiveMatch = false } = {}) {
  if (!tournament) return "Upcoming";
  const { status, startDate } = tournament;

  if (status === "Completed" || status === "Cancelled" || status === "Draft") {
    return status;
  }

  if (status === "Live" || hasLiveMatch) return "Live";

  if (status === "Upcoming" && startDate && new Date(startDate) <= new Date()) {
    return "Live";
  }

  return status || "Upcoming";
}

export function getCountdownParts(targetDate) {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { isPast: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { isPast: false, days, hours, minutes, seconds, totalMs: diff };
}

export function formatCountdownLabel(parts) {
  if (!parts) return null;
  if (parts.isPast) return "Starting now…";
  if (parts.days > 0) {
    return `${parts.days}d ${String(parts.hours).padStart(2, "0")}h ${String(parts.minutes).padStart(2, "0")}m ${String(parts.seconds).padStart(2, "0")}s`;
  }
  return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}:${String(parts.seconds).padStart(2, "0")}`;
}

export function buildTickerItems(fixtures = [], { tournamentName } = {}) {
  const items = [];
  const liveFixtures = fixtures.filter((m) => m.status === "Live");

  liveFixtures.forEach((match) => {
    const teamA = teamLabel(match.teamA, match.teamASlot);
    const teamB = teamLabel(match.teamB, match.teamBSlot);
    const vs = `${teamA} vs ${teamB}`;

    items.push({ type: "started", text: `Match Started — ${vs}` });
    if (match.round) {
      items.push({ type: "round", text: `Current Round: ${match.round}` });
    }
    items.push({ type: "matchup", text: vs });

    const ls = match.liveScore;
    if (ls?.isInitialized) {
      const score = `${ls.totalRuns}/${ls.wickets} (${ls.overs} ov)`;
      items.push({ type: "score", text: `Live Score: ${score}` });
    }
  });

  if (items.length === 0 && tournamentName) {
    items.push({ type: "live", text: `${tournamentName} is now live` });
  }

  return items;
}

export function shouldPollForTournamentStart(tournament, fixtures = []) {
  if (!tournament) return false;
  if (fixtures.some((m) => m.status === "Live" || m.status === "Scheduled")) return true;
  if (tournament.status === "Live") return true;

  if (tournament.status === "Upcoming" && tournament.startDate) {
    const msUntilStart = new Date(tournament.startDate).getTime() - Date.now();
    return msUntilStart <= 60 * 60 * 1000;
  }

  return false;
}
