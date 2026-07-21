import { body } from "express-validator";
import { TOURNAMENT_TYPES } from "../constants/tournamentTypes.js";

const ballTypeValues = ["Tape Ball", "Tennis Ball", "Hard Ball"];
const matchFormatValues = ["T10", "T20", "T50", "ODI", "Test", "Custom"];
const statusValues = ["Draft", "Upcoming", "Live", "Completed", "Cancelled"];

const tournamentTypeRule = body("tournamentType")
  .trim()
  .notEmpty()
  .withMessage("Tournament type is required")
  .isIn(TOURNAMENT_TYPES)
  .withMessage("Invalid tournament type");

const tournamentTypeUpdateRule = body("tournamentType")
  .optional({ values: "falsy" })
  .trim()
  .isIn(TOURNAMENT_TYPES)
  .withMessage("Invalid tournament type");

export const tournamentValidation = [
  body("tournamentName").trim().notEmpty().withMessage("Tournament name is required"),
  tournamentTypeRule,
  body("ballType").optional({ values: "falsy" }).isIn(ballTypeValues).withMessage("Invalid ball type"),
  body("matchFormat").optional({ values: "falsy" }).isIn(matchFormatValues).withMessage("Invalid match format"),
  body("status").optional({ values: "falsy" }).isIn(statusValues).withMessage("Invalid status"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .custom((value) => {
      if (Number.isNaN(new Date(value).getTime())) {
        throw new Error("Valid start date is required");
      }
      return true;
    }),
  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .custom((value) => {
      if (Number.isNaN(new Date(value).getTime())) {
        throw new Error("Valid end date is required");
      }
      return true;
    }),
  body("numberOfTeams").optional({ values: "falsy" }).isInt({ min: 2 }).withMessage("Minimum 2 teams required"),
  body("overs").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Overs must be at least 1"),
  body("entryFee").optional({ values: "falsy" }).isFloat({ min: 0 }),
  body("prizePool").optional({ values: "falsy" }).isFloat({ min: 0 }),
  body("contactEmail").optional({ values: "falsy" }).isEmail().withMessage("Invalid contact email"),
  body("venue")
    .notEmpty()
    .withMessage("Venue is required")
    .isMongoId()
    .withMessage("Invalid venue"),
];

export const tournamentUpdateValidation = [
  body("tournamentName").optional({ values: "falsy" }).trim().notEmpty().withMessage("Tournament name cannot be empty"),
  tournamentTypeUpdateRule,
  body("ballType").optional({ values: "falsy" }).isIn(ballTypeValues).withMessage("Invalid ball type"),
  body("matchFormat").optional({ values: "falsy" }).isIn(matchFormatValues).withMessage("Invalid match format"),
  body("status").optional({ values: "falsy" }).isIn(statusValues).withMessage("Invalid status"),
  body("startDate")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (value === "" || value == null) return true;
      if (Number.isNaN(new Date(value).getTime())) {
        throw new Error("Valid start date is required");
      }
      return true;
    }),
  body("endDate")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (value === "" || value == null) return true;
      if (Number.isNaN(new Date(value).getTime())) {
        throw new Error("Valid end date is required");
      }
      return true;
    }),
  body("numberOfTeams").optional({ values: "falsy" }).isInt({ min: 2 }).withMessage("Minimum 2 teams required"),
  body("overs").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Overs must be at least 1"),
  body("entryFee").optional({ values: "falsy" }).isFloat({ min: 0 }),
  body("prizePool").optional({ values: "falsy" }).isFloat({ min: 0 }),
  body("contactEmail").optional({ values: "falsy" }).isEmail().withMessage("Invalid contact email"),
  body("venue")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid venue"),
];
