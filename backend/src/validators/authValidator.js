import { body } from "express-validator";
import { PUBLIC_REGISTER_ROLES, normalizeRole } from "../constants/roles.js";

export const registerValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("username")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\d\s+\-()]{7,20}$/)
    .withMessage("Invalid phone number format"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
  body("role")
    .optional()
    .customSanitizer((value) => normalizeRole(value))
    .isIn(PUBLIC_REGISTER_ROLES)
    .withMessage("Invalid role"),
  body("country").optional().trim(),
  body("city").optional().trim(),
  body("termsAccepted").custom((val) => {
    if (val === true || val === "true" || val === "on") return true;
    throw new Error("You must accept the Terms & Conditions");
  }),
];

export const loginValidation = [
  body("identifier").trim().notEmpty().withMessage("Email or phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
