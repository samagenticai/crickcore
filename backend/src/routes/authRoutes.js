import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerValidation, loginValidation } from "../validators/authValidator.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/register",
  upload.single("profilePicture"),
  registerValidation,
  validate,
  register
);

router.post("/login", loginValidation, validate, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, upload.single("profilePicture"), updateProfile);

export default router;
