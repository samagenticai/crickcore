import { body, validationResult } from "express-validator";
import FreeTrial from "../models/FreeTrial.js";
import User from "../models/User.js";
import { getPlan } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";

export const freeTrialValidators = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("organization").optional().trim(),
  body("country").optional().trim(),
  body("message").optional().trim().isLength({ max: 1000 }).withMessage("Message is too long"),
  body("planInterest")
    .optional()
    .isIn(["starter", "pro", "enterprise"])
    .withMessage("Invalid plan interest"),
];

export const submitFreeTrial = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      "Validation failed",
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }

  const {
    fullName,
    email,
    phone,
    organization = "",
    country = "",
    message = "",
    planInterest = "starter",
  } = req.body;

  const plan = getPlan(planInterest) || getPlan("starter");

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  const trial = await FreeTrial.create({
    fullName,
    email,
    phone,
    organization,
    country,
    message,
    planInterest: plan.id,
    user: existingUser?._id || null,
  });

  if (existingUser) {
    if (existingUser.subscriptionStatus === "none" || existingUser.subscriptionPlan === "free") {
      existingUser.subscriptionPlan = "starter";
      existingUser.subscriptionStatus = "trialing";
      existingUser.subscriptionUpdatedAt = new Date();
      await existingUser.save({ validateBeforeSave: false });
    }
  }

  res.status(201).json({
    success: true,
    message: "Free trial request submitted successfully. We'll be in touch soon!",
    data: {
      id: trial._id,
      planInterest: trial.planInterest,
      email: trial.email,
    },
  });
});
