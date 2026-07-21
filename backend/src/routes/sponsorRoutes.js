import { Router } from "express";
import {
  createSponsor,
  deleteSponsor,
  getSponsor,
  getSponsors,
  updateSponsor,
} from "../controllers/sponsorController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  createSponsorValidation,
  updateSponsorValidation,
} from "../validators/sponsorValidator.js";
import { ADMIN_ROLE, ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect, authorize(ADMIN_ROLE, ROLES.ORGANIZER));

router
  .route("/")
  .get(getSponsors)
  .post(upload.single("logo"), createSponsorValidation, validate, createSponsor);

router
  .route("/:id")
  .get(getSponsor)
  .put(upload.single("logo"), updateSponsorValidation, validate, updateSponsor)
  .delete(deleteSponsor);

export default router;
