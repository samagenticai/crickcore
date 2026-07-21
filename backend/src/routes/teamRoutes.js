import { Router } from "express";
import { createTeam, getTeams, getTeam, updateTeam, deleteTeam } from "../controllers/teamController.js";
import { protect, staffOrAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(protect, staffOrAdmin);

router.route("/").get(getTeams).post(upload.single("logo"), createTeam);
router.route("/:id").get(getTeam).put(upload.single("logo"), updateTeam).delete(deleteTeam);

export default router;
