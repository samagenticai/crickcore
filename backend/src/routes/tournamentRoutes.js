import { Router } from "express";
import {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  softDeleteTournament,
  restoreTournament,
  permanentDeleteTournament,
  getDashboardStats,
  getTournamentStats,
  duplicateTournament,
  archiveTournament,
  publishTournament,
  getTournamentTeams,
  getTournamentStandings,
  rebuildTournamentStandingsHandler,
  addTeamsToTournament,
  removeTeamFromTournament,
  generateFixtures,
  getTournamentFixtures,
  recordMatchResult,
  startMatch,
  getViewerTournaments,
} from "../controllers/tournamentController.js";
import { protect, staffOrAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { tournamentValidation, tournamentUpdateValidation } from "../validators/tournamentValidator.js";
import { upload } from "../middleware/upload.js";

const router = Router();

const tournamentUpload = upload.fields([
  { name: "tournamentLogo", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
]);

// Public Viewer — unauthenticated
router.get("/viewer", getViewerTournaments);

router.use(protect, staffOrAdmin);

router.get("/stats", getDashboardStats);
router.get("/tournament-stats", getTournamentStats);

router
  .route("/")
  .get(getTournaments)
  .post(tournamentUpload, tournamentValidation, validate, createTournament);

// ── Specific /:id/* routes MUST come before generic /:id ──────────────────
router.patch("/:id/restore", restoreTournament);
router.delete("/:id/permanent", permanentDeleteTournament);
router.post("/:id/duplicate", duplicateTournament);
router.patch("/:id/archive", archiveTournament);
router.patch("/:id/publish", publishTournament);

router.post("/:id/standings/rebuild", rebuildTournamentStandingsHandler);
router.get("/:id/standings", getTournamentStandings);
router.get("/:id/teams", getTournamentTeams);
router.post("/:id/teams", addTeamsToTournament);
router.delete("/:id/teams/:teamId", removeTeamFromTournament);

router.post("/:id/generate-fixtures", generateFixtures);
router.get("/:id/fixtures", getTournamentFixtures);
router.patch("/:id/fixtures/:matchId/start", startMatch);
router.patch("/:id/fixtures/:matchId/result", recordMatchResult);

// Generic tournament CRUD — keep last so it does not shadow nested routes
router
  .route("/:id")
  .get(getTournament)
  .put(tournamentUpload, tournamentUpdateValidation, validate, updateTournament)
  .delete(softDeleteTournament);

export default router;
