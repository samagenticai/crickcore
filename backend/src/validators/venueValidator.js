import { body } from "express-validator";
import { PITCH_TYPES } from "../constants/pitchTypes.js";

const optionalTrimmed = (field) =>
  body(field).optional({ values: "falsy" }).trim();

export const createVenueValidation = [
  body("venueName").trim().notEmpty().withMessage("Venue name is required"),
  body("groundAddress").trim().notEmpty().withMessage("Ground address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  optionalTrimmed("state"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("pitchType")
    .optional({ values: "falsy" })
    .isIn(PITCH_TYPES)
    .withMessage("Invalid pitch type"),
  body("capacity")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("Capacity must be a non-negative number"),
  optionalTrimmed("contactPerson"),
  optionalTrimmed("contactNumber"),
  optionalTrimmed("notes"),
];

export const updateVenueValidation = [
  body("venueName")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Venue name cannot be empty"),
  body("groundAddress")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Ground address cannot be empty"),
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
  body("pitchType")
    .optional({ values: "falsy" })
    .isIn(PITCH_TYPES)
    .withMessage("Invalid pitch type"),
  body("capacity")
    .optional({ values: "null" })
    .custom((value) => value === null || value === "" || Number(value) >= 0)
    .withMessage("Capacity must be a non-negative number"),
  optionalTrimmed("contactPerson"),
  optionalTrimmed("contactNumber"),
  optionalTrimmed("notes"),
];
