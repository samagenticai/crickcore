import { Router } from "express";
import {
  createUmpire,
  deleteUmpire,
  getUmpire,
  getUmpires,
  updateUmpire,
} from "../controllers/umpireController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { normalizeUmpireBody } from "../middleware/normalizeUmpireBody.js";
import {
  createUmpireValidation,
  updateUmpireValidation,
} from "../validators/umpireValidator.js";
import { ADMIN_ROLE, ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect, authorize(ADMIN_ROLE, ROLES.ORGANIZER));

router
  .route("/")
  .get(getUmpires)
  .post(normalizeUmpireBody, createUmpireValidation, validate, createUmpire);

router
  .route("/:id")
  .get(getUmpire)
  .put(normalizeUmpireBody, updateUmpireValidation, validate, updateUmpire)
  .delete(deleteUmpire);

export default router;
