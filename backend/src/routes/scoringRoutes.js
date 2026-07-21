import { Router } from "express";
import {
  getLiveMatches,
  getMatchScore,
  initMatchScoring,
  recordBall,
  updateBowler,
  endInnings,
} from "../controllers/scoringController.js";
import { protect, staffOrAdmin } from "../middleware/auth.js";

const router = Router();

router.use(protect, staffOrAdmin);

router.get("/live-matches", getLiveMatches);
router.get("/matches/:matchId", getMatchScore);
router.post("/matches/:matchId/init", initMatchScoring);
router.post("/matches/:matchId/end-innings", endInnings);
router.post("/matches/:matchId/ball", recordBall);
router.patch("/matches/:matchId/bowler", updateBowler);

export default router;
