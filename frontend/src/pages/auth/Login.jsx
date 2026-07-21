import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, LogIn, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import { useAuth } from "../../context/AuthContext";
import { paymentsAPI } from "../../api/payments";
import { AUTH_PLAN_COPY, resolveAuthPlan } from "../../utils/authPlanCopy";
import { getPostLoginPath } from "../../utils/roles";
import {
  SESSION_EXPIRED_MESSAGE,
  SESSION_FORCE_LOGOUT_KEY,
  SESSION_LAST_ACTIVITY_KEY,
} from "../../constants/session";

const REMEMBER_KEY = "ctm_remember_identifier";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, login, refreshSubscription } = useAuth();
  const { plan, isPro, sessionId } = resolveAuthPlan(searchParams);
  const copy = AUTH_PLAN_COPY[plan].login;

  const [loading, setLoading] = useState(false);
  // Stripe success redirect = payment already confirmed — show Pro UI immediately
  const [paymentState, setPaymentState] = useState(
    sessionId ? "verified" : "idle"
  );
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const verifyStartedRef = useRef(false);
  const verifyOkRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setForm((prev) => ({ ...prev, identifier: saved }));
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!location.state?.sessionExpired) return;
    toast.info(location.state?.message || SESSION_EXPIRED_MESSAGE);
    navigate("/login", { replace: true, state: null });
  }, [location.state, navigate]);

  // Background verify once — persist payment + prefill email (non-blocking)
  useEffect(() => {
    if (!sessionId || verifyStartedRef.current) return;
    verifyStartedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await paymentsAPI.verifySession(sessionId);
        if (cancelled) return;
        verifyOkRef.current = true;
        const email = res.data?.data?.email;
        if (email) {
          setForm((prev) => (prev.identifier ? prev : { ...prev, identifier: email }));
        }
        setPaymentState("verified");
      } catch (err) {
        if (cancelled) return;
        verifyOkRef.current = false;
        setPaymentState("error");
        toast.error(err.message || "Could not confirm your Pro payment");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Existing logged-in user purchased Pro — link payment to account and continue
  useEffect(() => {
    if (!sessionId || !user) return;

    let cancelled = false;
    (async () => {
      try {
        await paymentsAPI.verifySession(sessionId);
        await refreshSubscription();
        if (cancelled) return;
        toast.success("Pro Plan active!");
        navigate(getPostLoginPath(user), { replace: true });
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message || "Could not activate Pro on your account");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, user, navigate, refreshSubscription]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = "Email or phone is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const authResponse = await login(form);
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, form.identifier.trim());
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        /* ignore */
      }

      if (sessionId && !verifyOkRef.current) {
        await paymentsAPI.verifySession(sessionId);
      }
      if (sessionId) {
        await refreshSubscription();
      }

      toast.success(isPro ? "Welcome to Pro!" : "Welcome back!");
      try {
        localStorage.removeItem(SESSION_FORCE_LOGOUT_KEY);
        localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");
      const fromState = location.state?.from?.pathname;
      const roleRedirect =
        authResponse?.redirectTo || getPostLoginPath(authResponse?.data);

      if (redirect && redirect.startsWith("/")) {
        navigate(redirect, { replace: true });
      } else {
        navigate(fromState || roleRedirect, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Invalid credentials");
      if (err.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.message("Password recovery", {
      description: "Please contact your tournament administrator to reset your password.",
    });
  };

  const registerHref = (() => {
    const qs = new URLSearchParams({ plan: "pro" });
    if (sessionId) qs.set("session_id", sessionId);
    const email = form.identifier.includes("@") ? form.identifier : searchParams.get("email");
    if (email) qs.set("email", email);
    return `/register?${qs.toString()}`;
  })();

  return (
    <AuthLayout
      title={copy.title}
      subtitle={copy.subtitle}
      plan={plan}
      brand={copy}
      footer={
        <p className="text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            to={isPro ? registerHref : `/register?plan=${plan}`}
            className="font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            {isPro ? "Create your Pro account" : "Create free account"}
          </Link>
        </p>
      }
    >
      {isPro && paymentState === "verified" && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">✓ Pro Plan purchased successfully</p>
            <p className="mt-0.5 opacity-90">
              {user ? (
                "Redirecting to your Pro dashboard…"
              ) : (
                <>
                  Sign in below, or{" "}
                  <Link to={registerHref} className="font-semibold underline underline-offset-2">
                    create your account
                  </Link>{" "}
                  to activate your Pro membership.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {isPro && paymentState === "error" && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          Payment could not be confirmed.{" "}
          <Link to="/#pricing" className="font-semibold underline underline-offset-2">
            Try again from Pricing
          </Link>
        </div>
      )}

      {!isPro && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <p>
            <strong>Free Plan.</strong> Upgrade to Pro anytime from Pricing after you sign in.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
        <FormField
          label="Email or Phone"
          name="identifier"
          value={form.identifier}
          onChange={handleChange}
          error={errors.identifier}
          required
          icon={Mail}
          placeholder="you@example.com or +1234567890"
          autoComplete="username"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
          icon={Lock}
          showPasswordToggle
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-3 min-w-0">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none min-w-0">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40 shrink-0"
            />
            <span className="text-sm text-text-muted truncate">Remember me</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors shrink-0 touch-target"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="relative w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 sm:py-3.5 text-sm font-semibold text-white
            bg-gradient-to-r from-primary to-primary-dark
            shadow-[0_4px_14px_rgba(22,163,74,0.35)]
            hover:shadow-[0_6px_20px_rgba(22,163,74,0.4)] hover:brightness-[1.03]
            active:scale-[0.985] transition-all duration-200
            disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            touch-target"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {isPro ? "Sign in to Pro" : "Sign In"}
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
