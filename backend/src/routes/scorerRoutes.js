import { Router } from "express";
import {
  createScorer,
  deleteScorer,
  getScorer,
  getScorers,
  updateScorer,
} from "../controllers/scorerController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  createScorerValidation,
  updateScorerValidation,
} from "../validators/scorerValidator.js";
import { ADMIN_ROLE, ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect, authorize(ADMIN_ROLE, ROLES.ORGANIZER));

router
  .route("/")
  .get(getScorers)
  .post(upload.single("profilePhoto"), createScorerValidation, validate, createScorer);

router
  .route("/:id")
  .get(getScorer)
  .put(upload.single("profilePhoto"), updateScorerValidation, validate, updateScorer)
  .delete(deleteScorer);

export default router;
