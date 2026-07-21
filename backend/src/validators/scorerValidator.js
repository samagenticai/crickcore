import { body } from "express-validator";
import { SCORER_STATUSES } from "../models/Scorer.js";

const optionalEmail = body("email")
  .optional({ values: "falsy" })
  .trim()
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail();

const phoneValidation = (required = true) => {
  const chain = body("phone").trim();
  if (required) {
    chain.notEmpty().withMessage("Phone number is required");
  } else {
    chain.optional({ values: "falsy" }).notEmpty().withMessage("Phone number cannot be empty");
  }
  return chain
    .matches(/^[\d\s+\-()]{7,20}$/)
    .withMessage("Invalid phone number format");
};

export const createScorerValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  phoneValidation(true),
  optionalEmail,
  body("city").optional({ values: "falsy" }).trim(),
  body("experience")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("Experience must be a non-negative number of years"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(SCORER_STATUSES)
    .withMessage("Invalid status"),
  body("notes").optional({ values: "falsy" }).trim(),
];

export const updateScorerValidation = [
  body("fullName")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty"),
  phoneValidation(false),
  optionalEmail,
  body("city").optional({ values: "falsy" }).trim(),
  body("experience")
    .optional({ values: "null" })
    .custom((value) => value === null || value === "" || Number(value) >= 0)
    .withMessage("Experience must be a non-negative number of years"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(SCORER_STATUSES)
    .withMessage("Invalid status"),
  body("notes").optional({ values: "falsy" }).trim(),
];
