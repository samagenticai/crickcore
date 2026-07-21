import { body } from "express-validator";
import { UMPIRE_TYPES, UMPIRE_STATUSES } from "../constants/umpireTypes.js";

const optionalTrimmed = (field) =>
  body(field).optional({ values: "falsy" }).trim();

const phoneValidation = (field, required = true) => {
  const chain = body(field).trim();
  if (required) {
    chain.notEmpty().withMessage("Phone number is required");
  } else {
    chain.optional({ values: "falsy" }).notEmpty().withMessage("Phone number cannot be empty");
  }
  return chain
    .matches(/^[\d\s+\-()]{7,20}$/)
    .withMessage("Invalid phone number format");
};

const optionalEmail = body("email")
  .optional({ values: "falsy" })
  .trim()
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail();

export const createUmpireValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  phoneValidation("phoneNumber", true),
  optionalEmail,
  body("city").trim().notEmpty().withMessage("City is required"),
  optionalTrimmed("state"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("umpireType")
    .trim()
    .notEmpty()
    .withMessage("Umpire type is required")
    .isIn(UMPIRE_TYPES)
    .withMessage("Invalid umpire type"),
  body("experience")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("Experience must be a non-negative number of years"),
  optionalTrimmed("qualification"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(UMPIRE_STATUSES)
    .withMessage("Invalid status"),
  optionalTrimmed("notes"),
];

export const updateUmpireValidation = [
  body("fullName")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty"),
  phoneValidation("phoneNumber", false),
  optionalEmail,
  body("city")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty"),
  optionalTrimmed("state"),
  body("country")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Country cannot be empty"),
  body("umpireType")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Umpire type cannot be empty")
    .isIn(UMPIRE_TYPES)
    .withMessage("Invalid umpire type"),
  body("experience")
    .optional({ values: "null" })
    .custom((value) => value === null || value === "" || Number(value) >= 0)
    .withMessage("Experience must be a non-negative number of years"),
  optionalTrimmed("qualification"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(UMPIRE_STATUSES)
    .withMessage("Invalid status"),
  optionalTrimmed("notes"),
];
