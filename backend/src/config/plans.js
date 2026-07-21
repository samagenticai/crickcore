/** Canonical plan catalog — amounts in the smallest currency unit (cents). */
export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    amount: 0,
    currency: "usd",
    type: "free",
    description: "Free forever plan for small clubs",
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: 2900,
    currency: "usd",
    type: "paid",
    interval: "month",
    description: "Pro monthly subscription",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    amount: null,
    currency: "usd",
    type: "contact",
    description: "Custom enterprise pricing",
  },
};

export const getPlan = (planId) => PLANS[String(planId || "").toLowerCase()] || null;
