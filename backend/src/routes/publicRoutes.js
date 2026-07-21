import { Router } from "express";
import {
  getPublicTournament,
  getPublicFixtures,
  getPublicMatch,
  getPublicTournamentTeams,
  getPublicTeamSquad,
  getPublicTournamentStandings,
  getPublicMatchSummary,
} from "../controllers/publicController.js";

const router = Router();

router.get("/tournaments/:id", getPublicTournament);
router.get("/tournaments/:id/fixtures", getPublicFixtures);
router.get("/tournaments/:id/matches/:matchId", getPublicMatch);
router.get("/tournaments/:id/matches/:matchId/summary", getPublicMatchSummary);
router.get("/tournaments/:id/teams", getPublicTournamentTeams);
router.get("/tournaments/:id/standings", getPublicTournamentStandings);
router.get("/tournaments/:id/teams/:teamId/squad", getPublicTeamSquad);

export default router;
