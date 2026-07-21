import { Router } from "express";
import {
  getNotifications,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";
import { protect, staffOrAdmin } from "../middleware/auth.js";

const router = Router();

router.use(protect, staffOrAdmin);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;
