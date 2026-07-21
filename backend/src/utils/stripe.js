import Stripe from "stripe";

let stripeClient = null;

function assertTestModeSecretKey(key) {
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server");
  }

  // Development / pre-launch: never allow Live Mode keys (real charges).
  if (String(key).startsWith("sk_live_")) {
    throw new Error(
      "Live Stripe keys are disabled. Use a Test Mode secret key (sk_test_...) while the project is in development."
    );
  }

  if (!String(key).startsWith("sk_test_")) {
    throw new Error(
      "Invalid STRIPE_SECRET_KEY. Expected a Stripe Test Mode key starting with sk_test_."
    );
  }
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  assertTestModeSecretKey(key);

  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key) && String(key).startsWith("sk_test_");
}
