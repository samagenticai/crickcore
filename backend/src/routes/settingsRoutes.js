import { Router } from "express";
import {
  getSettings,
  updateSettingsSecurity,
  logoutAllDevices,
  deleteSettingsAccount,
} from "../controllers/settingsController.js";
import { protect, organizerOnly } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateSettingsSecurityValidation,
  deleteAccountValidation,
} from "../validators/settingsValidator.js";

const router = Router();

router.use(protect, organizerOnly);

router.get("/", getSettings);
router.put("/security", updateSettingsSecurityValidation, validate, updateSettingsSecurity);
router.post("/logout-all-devices", logoutAllDevices);
router.delete("/account", deleteAccountValidation, validate, deleteSettingsAccount);

export default router;
