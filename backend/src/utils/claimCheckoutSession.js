import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { getPlan } from "../config/plans.js";
import { getStripe } from "./stripe.js";
import { ApiError } from "./helpers.js";
import { applyProSubscription } from "./subscription.js";

function sessionEmail(session) {
  return (
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.customerEmail ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();
}

/** Fast path — no extra Stripe API calls for charge lookup. */
function extractPaymentIntentInfo(session) {
  const paymentIntent =
    typeof session.payment_intent === "object" ? session.payment_intent : null;
  const paymentIntentId =
    paymentIntent?.id ||
    (typeof session.payment_intent === "string" ? session.payment_intent : "");

  const chargeId = paymentIntent?.latest_charge;
  const transactionId = typeof chargeId === "string" ? chargeId : chargeId?.id || "";

  return { paymentIntentId, transactionId };
}

/**
 * Persist a paid Stripe Checkout Session in MongoDB (guest or linked user).
 * Does not require an existing user account.
 */
export async function persistPaidCheckoutSession(session) {
  const planId = session.metadata?.planId || "pro";
  const plan = getPlan(planId);
  const email = sessionEmail(session);
  const { paymentIntentId, transactionId } = extractPaymentIntentInfo(session);
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id || "";

  const paid =
    session.payment_status === "paid" || session.status === "complete";

  if (!paid) {
    await Payment.findOneAndUpdate(
      { stripeCheckoutSessionId: session.id },
      {
        paymentStatus: session.status === "expired" ? "canceled" : "failed",
        customerEmail: email,
        stripePaymentIntentId: paymentIntentId,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    return { paid: false, email, planId: plan?.id || planId, payment: null };
  }

  const payment = await Payment.findOneAndUpdate(
    { stripeCheckoutSessionId: session.id },
    {
      plan: plan?.id || planId,
      amount: session.amount_total ?? plan?.amount ?? 0,
      currency: (session.currency || plan?.currency || "usd").toLowerCase(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeTransactionId: transactionId,
      stripeCustomerId: customerId,
      customerEmail: email,
      paymentStatus: "succeeded",
      paymentDate: new Date(),
      metadata: {
        source: session.metadata?.onboarding || "checkout",
        verifiedVia: "persist",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (payment.user && payment.paymentStatus === "succeeded") {
    return {
      paid: true,
      email: email || payment.customerEmail,
      planId: payment.plan || plan?.id || planId,
      payment,
      alreadyClaimed: true,
      claimedBy: payment.user,
    };
  }

  return {
    paid: true,
    email,
    planId: plan?.id || planId,
    payment,
    alreadyClaimed: false,
    claimedBy: null,
  };
}

/**
 * Ensure a paid session can be attached to a newly registered email.
 */
export async function assertSessionClaimable(sessionId, email) {
  if (!sessionId) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(String(sessionId));

  const result = await persistPaidCheckoutSession(session);
  if (!result.paid) {
    throw new ApiError(402, "Stripe payment was not completed. Please purchase Pro first.");
  }

  if (result.alreadyClaimed && result.claimedBy) {
    throw new ApiError(409, "This payment is already linked to another account.");
  }

  const paidEmail = result.email;
  const registerEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (paidEmail && registerEmail && paidEmail !== registerEmail) {
    throw new ApiError(
      400,
      `Register with the same email used at checkout (${paidEmail}).`
    );
  }

  return { session, result };
}

/**
 * Link a paid guest checkout session to a user and activate Pro.
 */
export async function claimCheckoutSessionForUser(user, sessionId) {
  const { session, result } = await assertSessionClaimable(sessionId, user.email);
  const planId = result.planId || "pro";
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id || "";

  const payment = await Payment.findOneAndUpdate(
    { stripeCheckoutSessionId: session.id },
    {
      user: user._id,
      customerEmail: user.email,
      paymentStatus: "succeeded",
      paymentDate: result.payment?.paymentDate || new Date(),
      stripeCustomerId: customerId || result.payment?.stripeCustomerId || "",
      metadata: {
        ...(result.payment?.metadata || {}),
        claimedAt: new Date().toISOString(),
        verifiedVia: "register-claim",
      },
    },
    { new: true }
  );

  applyProSubscription(user, planId === "starter" ? "starter" : planId);
  if (customerId) user.stripeCustomerId = customerId;
  await user.save({ validateBeforeSave: false });

  return { payment, planId, user };
}

export async function activateProForExistingUser(user, session) {
  const result = await persistPaidCheckoutSession(session);
  if (!result.paid) {
    throw new ApiError(402, "Payment was not completed.");
  }

  if (result.alreadyClaimed && result.claimedBy && String(result.claimedBy) !== String(user._id)) {
    throw new ApiError(403, "This payment session does not belong to your account");
  }

  const planId = result.planId || "pro";
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id || "";

  await Payment.findOneAndUpdate(
    { stripeCheckoutSessionId: session.id },
    {
      user: user._id,
      customerEmail: user.email,
      paymentStatus: "succeeded",
      paymentDate: new Date(),
    },
    { new: true }
  );

  const userDoc = await User.findById(user._id);
  applyProSubscription(userDoc, planId);
  if (customerId) userDoc.stripeCustomerId = customerId;
  await userDoc.save({ validateBeforeSave: false });

  return { planId, payment: result.payment };
}
