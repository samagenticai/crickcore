import { Router } from "express";
import { getOrganizerMatchSummary } from "../controllers/matchController.js";
import { protect, staffOrAdmin } from "../middleware/auth.js";

const router = Router();

router.use(protect, staffOrAdmin);

router.get("/:matchId/summary", getOrganizerMatchSummary);

export default router;
