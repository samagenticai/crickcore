import { Router } from "express";
import {
  getAdminDashboard,
  getAdminOverview,
  listOrganizers,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  listPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  listMatches,
  getMatch,
  updateMatch,
  deleteMatch,
  listVenues,
  deleteVenue,
  listUmpires,
  deleteUmpire,
  listScorers,
  updateAdminScorer,
  deleteAdminScorer,
  listSponsors,
  updateAdminSponsor,
  deleteAdminSponsor,
  listPayments,
  getAdminReports,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard", getAdminDashboard);
router.get("/overview", getAdminOverview);
router.get("/organizers", listOrganizers);
router.get("/reports", getAdminReports);

// Users
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Tournaments
router.get("/tournaments", listTournaments);
router.get("/tournaments/:id", getTournament);
router.put("/tournaments/:id", updateTournament);
router.delete("/tournaments/:id", deleteTournament);

// Teams
router.get("/teams", listTeams);
router.get("/teams/:id", getTeam);
router.post("/teams", upload.single("logo"), createTeam);
router.put("/teams/:id", upload.single("logo"), updateTeam);
router.delete("/teams/:id", deleteTeam);

// Players
router.get("/players", listPlayers);
router.get("/players/:id", getPlayer);
router.post("/players", upload.single("photo"), createPlayer);
router.put("/players/:id", upload.single("photo"), updatePlayer);
router.delete("/players/:id", deletePlayer);

// Matches
router.get("/matches", listMatches);
router.get("/matches/:id", getMatch);
router.put("/matches/:id", updateMatch);
router.delete("/matches/:id", deleteMatch);

// Venues / Umpires
router.get("/venues", listVenues);
router.delete("/venues/:id", deleteVenue);
router.get("/umpires", listUmpires);
router.delete("/umpires/:id", deleteUmpire);

// Scorers
router.get("/scorers", listScorers);
router.put("/scorers/:id", updateAdminScorer);
router.delete("/scorers/:id", deleteAdminScorer);

// Sponsors
router.get("/sponsors", listSponsors);
router.put("/sponsors/:id", updateAdminSponsor);
router.delete("/sponsors/:id", deleteAdminSponsor);

// Payments
router.get("/payments", listPayments);

export default router;
