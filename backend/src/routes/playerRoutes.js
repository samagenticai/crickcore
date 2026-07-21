import { Router } from "express";
import {
  createPlayer,
  getPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
} from "../controllers/playerController.js";
import { protect, staffOrAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(protect, staffOrAdmin);

router.route("/").get(getPlayers).post(upload.single("photo"), createPlayer);
router
  .route("/:id")
  .get(getPlayer)
  .put(upload.single("photo"), updatePlayer)
  .delete(deletePlayer);

export default router;
