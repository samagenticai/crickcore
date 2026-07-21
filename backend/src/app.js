import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import umpireRoutes from "./routes/umpireRoutes.js";
import scorerRoutes from "./routes/scorerRoutes.js";
import sponsorRoutes from "./routes/sponsorRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import scoringRoutes from "./routes/scoringRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import freeTrialRoutes from "./routes/freeTrialRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import {
  assertProfileRoutesRegistered,
  getProfileRouteManifest,
} from "./utils/assertProfileRoutes.js";
import { createCorsOriginChecker } from "./config/cors.js";
import { requestTiming } from "./middleware/requestTiming.js";
import { getDatabaseState, pingDatabase } from "./config/db.js";
import { getBootstrapState } from "./bootstrap.js";

const SERVER_BOOT_ID = `${process.pid}-${Date.now()}`;
const profileRouteManifest = assertProfileRoutesRegistered(profileRoutes);

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: createCorsOriginChecker(),
    credentials: true,
  })
);

const isProduction = process.env.NODE_ENV === "production";

const AUTH_RATE_LIMIT_MSG = "Too many auth attempts, please try again later";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 400 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (
      req.path.startsWith("/api/scoring") ||
      req.path.startsWith("/api/public") ||
      req.path === "/api/payments/webhook"
    ) {
      return true;
    }
    // Development: don't throttle auth/session checks during testing
    if (!isProduction && req.path.startsWith("/api/auth")) {
      return true;
    }
    return false;
  },
  message: { success: false, message: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Development: disable auth rate limiting entirely
    if (!isProduction) return true;
    // Production: only limit login/register — not session checks or logout
    if (req.path === "/me" || req.path === "/logout") return true;
    return false;
  },
  message: { success: false, message: AUTH_RATE_LIMIT_MSG },
  handler: (req, res, _next, options) => {
    const resetMs = req.rateLimit?.resetTime?.getTime?.() ?? Date.now() + options.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      message: AUTH_RATE_LIMIT_MSG,
      retryAfterSeconds,
    });
  },
});

const scoringLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many scoring requests, please slow down briefly" },
});

const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

app.use(limiter);
app.use(requestTiming());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Stripe webhook must receive the raw body for signature verification
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  let db = getDatabaseState();
  let dbPing = null;

  try {
    dbPing = await pingDatabase();
  } catch (err) {
    dbPing = { ok: false, error: err.message };
  }

  res.json({
    success: true,
    message: "Cricket Tournament API is running",
    bootId: SERVER_BOOT_ID,
    pid: process.pid,
    db,
    dbPing,
    bootstrap: getBootstrapState(),
    profile: {
      mounted: true,
      routes: getProfileRouteManifest(profileRoutes).map(
        (r) => `${r.methods.join("|")} ${r.fullPath}`
      ),
    },
  });
});

app.use("/api/auth", authLimiter, authRoutes);
// Profile APIs — must stay before app.use(notFound)
app.use("/api/profile", authLimiter, profileRoutes);
app.use("/api/settings", authLimiter, settingsRoutes);
app.use("/api/notifications", authLimiter, notificationRoutes);
app.use("/api/public", publicReadLimiter, publicRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/umpires", umpireRoutes);
app.use("/api/scorers", scorerRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/scoring", scoringLimiter, scoringRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/free-trial", freeTrialRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export { profileRouteManifest };
export default app;
