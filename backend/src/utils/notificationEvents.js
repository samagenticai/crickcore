import Team from "../models/Team.js";
import { createNotification } from "../services/notificationService.js";

const nameOf = (entity, fallback = "Item") =>
  entity?.tournamentName || entity?.name || entity?.fullName || fallback;

export async function notifyTournamentCreated(userId, tournament) {
  return createNotification({
    userId,
    title: "Tournament created",
    message: `"${nameOf(tournament)}" has been created successfully.`,
    type: "success",
    icon: "trophy",
    relatedId: tournament._id,
    relatedType: "tournament",
  });
}

export async function notifyTournamentPublished(userId, tournament) {
  return createNotification({
    userId,
    title: "Tournament published",
    message: `"${nameOf(tournament)}" is now published and visible to viewers.`,
    type: "info",
    icon: "globe",
    relatedId: tournament._id,
    relatedType: "tournament",
  });
}

export async function notifyTournamentCompleted(userId, tournament) {
  return createNotification({
    userId,
    title: "Tournament completed",
    message: `"${nameOf(tournament)}" has finished. All matches are complete.`,
    type: "success",
    icon: "award",
    relatedId: tournament._id,
    relatedType: "tournament",
  });
}

export async function notifyTeamJoinedTournament(userId, tournament, team) {
  return createNotification({
    userId,
    title: "Team joined tournament",
    message: `"${nameOf(team)}" joined "${nameOf(tournament)}".`,
    type: "info",
    icon: "users",
    relatedId: team._id,
    relatedType: "team",
  });
}

export async function notifyFixturesGenerated(userId, tournament, matchCount) {
  return createNotification({
    userId,
    title: "Fixtures generated",
    message: `${matchCount} match${matchCount === 1 ? "" : "es"} created for "${nameOf(tournament)}".`,
    type: "success",
    icon: "calendar",
    relatedId: tournament._id,
    relatedType: "fixture",
  });
}

export async function notifyMatchStarted(userId, match, tournament) {
  const label = match.round
    ? `${match.round} (Match #${match.matchNumber})`
    : `Match #${match.matchNumber}`;
  return createNotification({
    userId,
    title: "Match started",
    message: `${label} in "${nameOf(tournament)}" is now live.`,
    type: "info",
    icon: "play",
    relatedId: match._id,
    relatedType: "match",
  });
}

export async function notifyMatchCompleted(userId, match, tournament) {
  const label = match.round
    ? `${match.round} (Match #${match.matchNumber})`
    : `Match #${match.matchNumber}`;
  const summary = match.resultSummary ? ` ${match.resultSummary}` : "";
  return createNotification({
    userId,
    title: "Match completed",
    message: `${label} in "${nameOf(tournament)}" has finished.${summary}`,
    type: "success",
    icon: "check-circle",
    relatedId: match._id,
    relatedType: "match",
  });
}

/** Notify when teams are newly added to a tournament (batch-friendly). */
export async function notifyTeamsJoined(userId, tournament, teamIds, previousTeamIds = []) {
  const prev = new Set(previousTeamIds.map(String));
  const added = teamIds.filter((id) => !prev.has(String(id)));
  if (!added.length) return [];

  const teams = await Team.find({ _id: { $in: added } }).select("name");
  const results = [];
  for (const team of teams) {
    results.push(await notifyTeamJoinedTournament(userId, tournament, team));
  }
  return results;
}
