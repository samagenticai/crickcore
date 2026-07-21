import { Router } from "express";
import {
  createVenue,
  deleteVenue,
  getVenue,
  getVenues,
  updateVenue,
} from "../controllers/venueController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createVenueValidation, updateVenueValidation } from "../validators/venueValidator.js";
import { ADMIN_ROLE, ROLES } from "../constants/roles.js";

const router = Router();

router.use(protect, authorize(ADMIN_ROLE, ROLES.ORGANIZER));

router
  .route("/")
  .get(getVenues)
  .post(createVenueValidation, validate, createVenue);

router
  .route("/:id")
  .get(getVenue)
  .put(updateVenueValidation, validate, updateVenue)
  .delete(deleteVenue);

export default router;
