const enabled = process.env.NODE_ENV !== "production";

/** Dev-only timing logs for Stripe payment flow debugging. */
export function logPaymentStep(step, startedAt, extra = {}) {
  if (!enabled) return;
  const ms = Date.now() - startedAt;
  const suffix = Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[payment-timing] ${step}: ${ms}ms${suffix}`);
}

export function startPaymentTimer() {
  return Date.now();
}
