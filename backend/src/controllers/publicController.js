import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import mongoose from "mongoose";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { enrichMatchLiveScore, enrichMatchesLiveScore } from "../utils/liveScore.js";
import { getTournamentStandings as fetchTournamentStandings } from "../services/pointsTableService.js";
import { getMatchSummary } from "../services/matchSummaryService.js";

const publicTournamentFilter = (id) => ({
  _id: id,
  isPublic: true,
  isDeleted: false,
  isArchived: false,
  isStorageArchived: { $ne: true },
});

const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

export const getPublicTournament = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "tournament id");
  const tournament = await Tournament.findOne(publicTournamentFilter(req.params.id))
    .select(
      "tournamentName tournamentLogo bannerImage description tournamentType ballType startDate endDate status city groundName venue sponsors"
    )
    .populate("venue", "venueName groundAddress city state country pitchType capacity")
    .populate(
      "sponsors",
      "sponsorName companyName sponsorType logo website status contactPerson"
    );

  if (!tournament) throw new ApiError(404, "Tournament not found");

  res.json({ success: true, data: tournament });
});

const populatePublicMatch = (query) =>
  query
    .populate("teamA teamB winner tossWinner", "name logo city")
    .populate("venue", "venueName groundAddress city state country pitchType capacity")
    .populate("teamAPlayingXI teamBPlayingXI", "name photo jerseyNumber role")
    .populate("umpires", "fullName umpireType city status")
    .populate("scorer", "fullName phone email status profilePhoto");

export const getPublicFixtures = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "tournament id");
  const tournament = await Tournament.findOne(publicTournamentFilter(req.params.id)).select("_id");

  if (!tournament) throw new ApiError(404, "Tournament not found");

  const matches = await populatePublicMatch(
    Match.find({ tournament: req.params.id, status: { $ne: "Cancelled" } })
  ).sort({ scheduledDate: 1, matchNumber: 1 });

  const enriched = await enrichMatchesLiveScore(matches);
  res.json({ success: true, data: enriched, count: enriched.length });
});

export const getPublicMatch = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "tournament id");
  assertObjectId(req.params.matchId, "match id");
  const tournament = await Tournament.findOne(publicTournamentFilter(req.params.id)).select("_id");

  if (!tournament) throw new ApiError(404, "Tournament not found");

  const match = await populatePublicMatch(
    Match.findOne({
      _id: req.params.matchId,
      tournament: req.params.id,
      status: { $ne: "Cancelled" },
    })
  );

  if (!match) throw new ApiError(404, "Match not found");

  const enriched = await enrichMatchLiveScore(match);
  res.json({ success: true, data: enriched });
});

export const getPublicMatchSummary = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "tournament id");
  assertObjectId(req.params.matchId, "match id");

  const tournament = await Tournament.findOne(publicTournamentFilter(req.params.id)).select("_id");
  if (!tournament) throw new ApiError(404, "Tournament not found");

  const match = await Match.findOne({
    _id: req.params.matchId,
    tournament: req.params.id,
    status: { $ne: "Cancelled" },
  }).select("_id");

  if (!match) throw new ApiError(404, "Match not found");

  const data = await getMatchSummary(req.params.matchId, { publicAccess: true });
  res.json({ success: true, data });
});

export const getPublicTournamentTeams = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "tournament id");
  const tournament = await Tournament.findOne(publicTournamentFilter(req.params.id)).populate(
    "teams",
    "name logo city captain"
  );

  if (!tournament) throw new ApiError(404, "Tournament not found");

  const teams = tournament.teams || [];
  const counts = await Player.aggregate([
    { $match: { tournament: tournament._id } },
    { $group: { _id: "$team", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  const data = teams.map((team) => ({
    ...team.toObject(),
    playerCount: countMap[String(team._id)] || 0,
  }));

  res.json({ success: true, data, count: data.length });
});

export const getPublicTournamentStandings = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "tournament id");
  const tournament = await Tournament.findOne(publicTournamentFilter(req.params.id)).select(
    "_id isStorageArchived archiveSummary"
  );

  if (!tournament) throw new ApiError(404, "Tournament not found");

  if (tournament.isStorageArchived) {
    const summary = tournament.archiveSummary || {};
    res.json({
      success: true,
      data: {
        rows: [],
        count: 0,
        archived: true,
        message: "Standings are not available for archived tournaments.",
        meta: { totalTeams: summary.totalTeams || 0 },
      },
    });
    return;
  }

  const standings = await fetchTournamentStandings(tournament._id);
  res.json({ success: true, data: standings });
});

export const getPublicTeamSquad = asyncHandler(async (req, res) => {
  const { id, teamId } = req.params;
  assertObjectId(id, "tournament id");
  assertObjectId(teamId, "team id");

  const tournament = await Tournament.findOne(publicTournamentFilter(id)).select("teams");
  if (!tournament) throw new ApiError(404, "Tournament not found");

  const teamIds = tournament.teams.map((t) => String(t));
  if (!teamIds.includes(teamId)) throw new ApiError(404, "Team not found in this tournament");

  const team = await Team.findById(teamId).select("name logo city captain");
  if (!team) throw new ApiError(404, "Team not found");

  const players = await Player.find({ team: teamId, tournament: id })
    .select("name photo jerseyNumber role")
    .sort({ jerseyNumber: 1, name: 1 });

  res.json({ success: true, data: { team, players }, count: players.length });
});
