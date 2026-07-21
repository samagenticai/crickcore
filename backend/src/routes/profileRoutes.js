import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
} from "../controllers/profileController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadAvatarMiddleware } from "../middleware/upload.js";
import {
  updateProfileValidation,
  changePasswordValidation,
} from "../validators/profileValidator.js";

const router = Router();

router.use(protect);

router.get("/", getProfile);
router.put("/", updateProfileValidation, validate, updateProfile);
router.put("/password", changePasswordValidation, validate, changePassword);
router.post("/avatar", uploadAvatarMiddleware, uploadAvatar);
router.delete("/avatar", deleteAvatar);

export default router;
