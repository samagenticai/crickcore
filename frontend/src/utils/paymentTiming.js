const enabled = import.meta.env.DEV;

/** Dev-only timing logs for Stripe payment flow debugging. */
export function logPaymentStep(step, startedAt, extra = {}) {
  if (!enabled) return;
  const ms = Date.now() - startedAt;
  const suffix = Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : "";
  console.info(`[payment-timing] ${step}: ${ms}ms${suffix}`);
}

export function startPaymentTimer() {
  return Date.now();
}
