import { Router } from "express";
import {
  createCheckoutSession,
  verifyCheckoutSession,
  getMyPayments,
  getPlans,
} from "../controllers/paymentController.js";
import { optionalProtect, protect } from "../middleware/auth.js";

const router = Router();

router.get("/plans", getPlans);
// Guest Pro onboarding OR logged-in upgrade — auth optional
router.post("/create-checkout-session", optionalProtect, createCheckoutSession);
router.get("/verify-session", optionalProtect, verifyCheckoutSession);
router.post("/verify-session", optionalProtect, verifyCheckoutSession);
router.get("/mine", protect, getMyPayments);

export default router;
