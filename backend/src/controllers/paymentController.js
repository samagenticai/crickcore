import Payment from "../models/Payment.js";
import { getPlan } from "../config/plans.js";
import { getStripe, isStripeConfigured } from "../utils/stripe.js";
import {
  activateProForExistingUser,
  persistPaidCheckoutSession,
} from "../utils/claimCheckoutSession.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { logPaymentStep, startPaymentTimer } from "../utils/paymentTiming.js";

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const t0 = startPaymentTimer();

  if (!isStripeConfigured()) {
    throw new ApiError(503, "Payments are not configured. Add STRIPE_SECRET_KEY on the server.");
  }

  const planId = String(req.body?.planId || "pro").toLowerCase();
  const plan = getPlan(planId);
  logPaymentStep("create-checkout.validate", t0, { planId });

  if (!plan) {
    throw new ApiError(400, "Invalid plan selected");
  }
  if (plan.type === "free") {
    throw new ApiError(400, "Free plans do not require payment. Register for a Free account instead.");
  }
  if (plan.type === "contact") {
    throw new ApiError(400, "Enterprise plans require contacting sales.");
  }
  if (!plan.amount || plan.amount <= 0) {
    throw new ApiError(400, "This plan cannot be purchased online.");
  }

  const stripe = getStripe();
  const user = req.user || null;
  const isGuest = !user;

  // All users (guest or logged-in) → Login with Pro UI after Stripe confirms payment
  const successUrl = `${clientUrl()}/login?session_id={CHECKOUT_SESSION_ID}&plan=pro`;

  const sessionParams = {
    mode: "payment",
    success_url: successUrl,
    cancel_url: `${clientUrl()}/#pricing`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amount,
          product_data: {
            name: `${plan.name} Plan`,
            description: plan.description,
          },
        },
      },
    ],
    metadata: {
      planId: plan.id,
      onboarding: isGuest ? "guest" : "user",
    },
    payment_intent_data: {
      metadata: {
        planId: plan.id,
        onboarding: isGuest ? "guest" : "user",
      },
    },
  };

  if (user) {
    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }
    sessionParams.client_reference_id = String(user._id);
    sessionParams.metadata.userId = String(user._id);
    sessionParams.payment_intent_data.metadata.userId = String(user._id);
  }

  const tStripe = startPaymentTimer();
  const session = await stripe.checkout.sessions.create(sessionParams);
  logPaymentStep("create-checkout.stripe.sessions.create", tStripe, {
    sessionId: session.id,
    livemode: session.livemode,
    guest: isGuest,
  });

  Payment.findOneAndUpdate(
    { stripeCheckoutSessionId: session.id },
    {
      user: user?._id || null,
      customerEmail: user?.email || "",
      plan: plan.id,
      amount: plan.amount,
      currency: plan.currency,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: user?.stripeCustomerId || "",
      paymentStatus: "pending",
      metadata: {
        source: isGuest ? "guest-onboarding" : "authenticated-upgrade",
        onboarding: isGuest ? "guest" : "user",
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  ).catch((err) => {
    console.error("Pending payment save failed:", err.message);
  });

  logPaymentStep("create-checkout.total", t0, { sessionId: session.id });

  res.status(200).json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
      guest: isGuest,
    },
  });
});

export const verifyCheckoutSession = asyncHandler(async (req, res) => {
  const t0 = startPaymentTimer();

  if (!isStripeConfigured()) {
    throw new ApiError(503, "Payments are not configured.");
  }

  const sessionId = req.query.session_id || req.body?.sessionId;
  if (!sessionId) {
    throw new ApiError(400, "Missing checkout session id");
  }

  // Fast path: already verified and stored — skip Stripe round-trip
  const tDb = startPaymentTimer();
  const cached = await Payment.findOne({
    stripeCheckoutSessionId: String(sessionId),
    paymentStatus: "succeeded",
  }).lean();
  logPaymentStep("verify-session.db.lookup", tDb, { hit: Boolean(cached) });

  if (cached) {
    if (req.user) {
      await activateProForExistingUser(req.user, {
        id: sessionId,
        metadata: { planId: cached.plan },
        customer: cached.stripeCustomerId,
        payment_status: "paid",
        status: "complete",
      });
    }

    logPaymentStep("verify-session.total", t0, { path: "cache-hit" });

    return res.json({
      success: true,
      message: "Payment confirmed",
      data: {
        plan: cached.plan,
        subscriptionPlan: cached.plan,
        email: cached.customerEmail || "",
        sessionId: cached.stripeCheckoutSessionId,
        paymentStatus: "succeeded",
        paymentDate: cached.paymentDate || cached.updatedAt,
        requiresRegistration: !req.user && !cached.user,
        alreadyLinked: Boolean(cached.user),
        cached: true,
      },
    });
  }

  const stripe = getStripe();
  const tStripe = startPaymentTimer();
  const session = await stripe.checkout.sessions.retrieve(String(sessionId));
  logPaymentStep("verify-session.stripe.retrieve", tStripe, {
    status: session.payment_status,
  });

  const tPersist = startPaymentTimer();
  const persisted = await persistPaidCheckoutSession(session);
  logPaymentStep("verify-session.persist", tPersist, { paid: persisted.paid });

  if (!persisted.paid) {
    throw new ApiError(402, "Payment was not completed. You can try again from Pricing.");
  }

  if (req.user) {
    const metaUserId = session.metadata?.userId || session.client_reference_id;
    if (metaUserId && String(metaUserId) !== String(req.user._id)) {
      throw new ApiError(403, "This payment session does not belong to your account");
    }
    const tActivate = startPaymentTimer();
    await activateProForExistingUser(req.user, session);
    logPaymentStep("verify-session.activate-user", tActivate);
  }

  const email =
    persisted.email ||
    session.customer_details?.email ||
    session.customer_email ||
    "";

  logPaymentStep("verify-session.total", t0, { path: "stripe" });

  res.json({
    success: true,
    message: "Payment confirmed",
    data: {
      plan: persisted.planId,
      subscriptionPlan: persisted.planId,
      email,
      sessionId: session.id,
      paymentStatus: "succeeded",
      paymentDate: persisted.payment?.paymentDate || new Date(),
      requiresRegistration: !req.user && !persisted.alreadyClaimed,
      alreadyLinked: Boolean(persisted.alreadyClaimed),
    },
  });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).send("Stripe not configured");
  }

  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } else if (process.env.NODE_ENV !== "production") {
      const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
      event = typeof payload === "string" ? JSON.parse(payload) : payload;
    } else {
      return res.status(500).send("STRIPE_WEBHOOK_SECRET is required in production");
    }
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Respond quickly; persist async so Stripe doesn't retry from slow DB
  res.json({ received: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await persistPaidCheckoutSession(session);
      const userId = session.metadata?.userId || session.client_reference_id;
      if (userId && session.payment_status === "paid") {
        const User = (await import("../models/User.js")).default;
        const user = await User.findById(userId);
        if (user) await activateProForExistingUser(user, session);
      }
    } catch (err) {
      console.error("Webhook processing error:", err.message);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { paymentStatus: "failed" }
    ).catch(() => {});
  }
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ success: true, data: payments });
});

export const getPlans = asyncHandler(async (_req, res) => {
  const { PLANS } = await import("../config/plans.js");
  res.json({
    success: true,
    data: Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      amount: p.amount,
      currency: p.currency,
      type: p.type,
      description: p.description,
      interval: p.interval || null,
    })),
    stripeEnabled: isStripeConfigured(),
  });
});
