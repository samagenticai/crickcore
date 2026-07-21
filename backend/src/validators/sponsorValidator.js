import { body } from "express-validator";
import { SPONSOR_STATUSES, SPONSOR_TYPES } from "../models/Sponsor.js";

const optionalEmail = body("email")
  .optional({ values: "falsy" })
  .trim()
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail();

const optionalWebsite = body("website")
  .optional({ values: "falsy" })
  .trim()
  .custom((value) => {
    const v = String(value).trim();
    if (!v) return true;
    try {
      const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      // eslint-disable-next-line no-new
      new URL(withProto);
      return true;
    } catch {
      throw new Error("Invalid website URL");
    }
  });

export const createSponsorValidation = [
  body("sponsorName").trim().notEmpty().withMessage("Sponsor name is required"),
  body("companyName").optional({ values: "falsy" }).trim(),
  body("sponsorType")
    .optional({ values: "falsy" })
    .isIn(SPONSOR_TYPES)
    .withMessage("Invalid sponsor type"),
  body("contactPerson").optional({ values: "falsy" }).trim(),
  body("phone").optional({ values: "falsy" }).trim(),
  optionalEmail,
  optionalWebsite,
  body("address").optional({ values: "falsy" }).trim(),
  body("sponsorshipAmount")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Sponsorship amount must be zero or greater"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(SPONSOR_STATUSES)
    .withMessage("Invalid status"),
  body("notes").optional({ values: "falsy" }).trim(),
];

export const updateSponsorValidation = [
  body("sponsorName")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Sponsor name cannot be empty"),
  body("companyName").optional({ values: "falsy" }).trim(),
  body("sponsorType")
    .optional({ values: "falsy" })
    .isIn(SPONSOR_TYPES)
    .withMessage("Invalid sponsor type"),
  body("contactPerson").optional({ values: "falsy" }).trim(),
  body("phone").optional({ values: "falsy" }).trim(),
  optionalEmail,
  optionalWebsite,
  body("address").optional({ values: "falsy" }).trim(),
  body("sponsorshipAmount")
    .optional({ values: "null" })
    .custom((value) => value === null || value === "" || Number(value) >= 0)
    .withMessage("Sponsorship amount must be zero or greater"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(SPONSOR_STATUSES)
    .withMessage("Invalid status"),
  body("notes").optional({ values: "falsy" }).trim(),
];
