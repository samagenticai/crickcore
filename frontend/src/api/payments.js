import api from "./axios";
import { logPaymentStep, startPaymentTimer } from "../utils/paymentTiming";

export const paymentsAPI = {
  getPlans: () => api.get("/payments/plans"),

  createCheckoutSession: async (planId) => {
    const t0 = startPaymentTimer();
    const res = await api.post("/payments/create-checkout-session", { planId });
    logPaymentStep("frontend.create-checkout-session", t0, {
      planId,
      sessionId: res.data?.data?.sessionId,
    });
    return res;
  },

  verifySession: async (sessionId) => {
    const t0 = startPaymentTimer();
    const res = await api.get("/payments/verify-session", {
      params: { session_id: sessionId },
    });
    logPaymentStep("frontend.verify-session", t0, {
      sessionId: sessionId?.slice?.(0, 20),
      cached: res.data?.data?.cached,
    });
    return res;
  },

  getMine: () => api.get("/payments/mine"),
};
