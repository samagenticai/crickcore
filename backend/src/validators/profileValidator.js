import { body } from "express-validator";

export const updateProfileValidation = [
  body("fullName").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[\d\s+\-()]{7,20}$/)
    .withMessage("Invalid phone number format"),
  body("country").optional().trim().isLength({ max: 100 }),
  body("city").optional().trim().isLength({ max: 100 }),
  body("organizationName").optional().trim().isLength({ max: 120 }),
  body("bio").optional().trim().isLength({ max: 500 }),
  body("address").optional().trim().isLength({ max: 300 }),
  body("timezone").optional().trim().isLength({ max: 80 }),
  body("theme").optional().isIn(["light", "dark", "system"]),
  body("emailNotifications").optional().isBoolean(),
  body("pushNotifications").optional().isBoolean(),
  body("tournamentNotifications").optional().isBoolean(),
  body("matchNotifications").optional().isBoolean(),
  body("liveScoreNotifications").optional().isBoolean(),
  body("systemNotifications").optional().isBoolean(),
  body("language").optional().trim().isLength({ max: 10 }),
  body("timeFormat").optional().isIn(["12h", "24h"]),
  body("dateFormat").optional().isIn(["MDY", "DMY", "YMD"]),
  body("density").optional().isIn(["comfortable", "compact"]),
];

export const changePasswordValidation = [
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
    if (value !== req.body.newPassword) throw new Error("Passwords do not match");
    return true;
  }),
];
