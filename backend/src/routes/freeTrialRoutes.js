import { Router } from "express";
import {
  freeTrialValidators,
  submitFreeTrial,
} from "../controllers/freeTrialController.js";

const router = Router();

router.post("/", freeTrialValidators, submitFreeTrial);

export default router;
