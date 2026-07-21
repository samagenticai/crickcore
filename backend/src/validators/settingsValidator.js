import { body } from "express-validator";

export const updateSettingsSecurityValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must include an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must include a lowercase letter")
    .matches(/\d/)
    .withMessage("New password must include a number"),
  body("confirmPassword").custom((value, { req }) => {
    if (value != null && value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

export const deleteAccountValidation = [
  body("password").notEmpty().withMessage("Password is required"),
  body("confirmText")
    .optional()
    .custom((value) => {
      if (value != null && String(value).trim().toUpperCase() !== "DELETE") {
        throw new Error("Type DELETE to confirm");
      }
      return true;
    }),
];
