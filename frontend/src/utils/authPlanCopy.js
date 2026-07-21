/**
 * UI copy for Free vs Pro auth experiences (same routes, different content).
 */
export function resolveAuthPlan(searchParams) {
  const sessionId = searchParams.get("session_id") || "";
  const plan = (searchParams.get("plan") || (sessionId ? "pro" : "free")).toLowerCase();
  const isPro = plan === "pro" || Boolean(sessionId);
  return { plan: isPro ? "pro" : "free", isPro, sessionId };
}

export const AUTH_PLAN_COPY = {
  free: {
    register: {
      title: "Start with the Free Plan",
      subtitle: "Create your free account and run tournaments.",
      badge: "Free Plan",
      bannerTitle: "Free forever for small clubs",
      bannerBody: "No payment required. Choose Pro from Pricing whenever you need more.",
      submit: "Create free account",
      brandHighlight: "Free Plan",
      brandLead: "Start with the",
      brandBody:
        "Create your free account and manage tournaments with live scoring, fixtures, and standings.",
      mobileIntro: "Create your free account — no payment required.",
    },
    login: {
      title: "Welcome back",
      subtitle: "Sign in to your Free Plan account.",
      badge: "Free Plan",
      brandHighlight: "Free Plan",
      brandLead: "Continue on the",
      brandBody:
        "Sign in to manage tournaments, live scores, teams, and fixtures.",
      mobileIntro: "Sign in to your free account.",
    },
  },
  pro: {
    register: {
      title: "Pro Plan purchased successfully",
      subtitle: "Complete your account to activate your Pro membership.",
      badge: "Pro — Paid",
      bannerTitle: "✓ Payment complete",
      bannerBody:
        "Your Pro plan is paid for. Create your account with the same email you used at Stripe checkout.",
      submit: "Activate Pro membership",
      brandHighlight: "Pro",
      brandLead: "Welcome to",
      brandBody:
        "Your payment succeeded. Finish registration to unlock unlimited tournaments, advanced scoring, and priority support.",
      mobileIntro: "Payment confirmed — create your account to activate Pro.",
    },
    login: {
      title: "Welcome back!",
      subtitle: "Your Pro subscription is ready. Sign in to open your Pro dashboard.",
      badge: "Pro Member",
      brandHighlight: "Pro",
      brandLead: "Welcome to",
      brandBody:
        "Your Pro payment is complete. Sign in below — no additional payment is required.",
      mobileIntro: "Pro payment confirmed — sign in to continue.",
    },
  },
};
