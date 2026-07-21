import { motion } from "framer-motion";
import { CheckCircle2, Shield, Sparkles, Star, Zap } from "lucide-react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import { EASE } from "../../utils/animations";

/**
 * Auth pages share the Landing Page Navbar + Footer.
 * Content shifts Free vs Pro via the `plan` prop — same routes, different copy.
 */

const freeFeatures = [
  { icon: Zap, text: "Live scoring & real-time updates" },
  { icon: CheckCircle2, text: "Team & player management" },
  { icon: Sparkles, text: "Fixture scheduling & automation" },
  { icon: Shield, text: "Upgrade to Pro anytime" },
];

const proFeatures = [
  { icon: Star, text: "Pro payment already completed" },
  { icon: Zap, text: "Unlimited tournaments & teams" },
  { icon: Sparkles, text: "Advanced live scoring & branding" },
  { icon: Shield, text: "No extra payment required" },
];

const stats = [
  { value: "500+", label: "Tournaments" },
  { value: "10K+", label: "Teams" },
  { value: "99.9%", label: "Uptime" },
];

function AuthBackdrop({ isPro }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div
        animate={{ y: [0, 12, 0], x: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl ${
          isPro ? "bg-amber-400/20" : "bg-primary/15"
        }`}
      />
      <motion.div
        animate={{ y: [0, -10, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -right-20 bottom-10 h-80 w-80 rounded-full blur-3xl ${
          isPro ? "bg-primary/12" : "bg-accent/12"
        }`}
      />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute inset-0 dot-pattern opacity-[0.22]" />
    </div>
  );
}

function BrandPanel({ registerMode, isPro, brand }) {
  const features = isPro ? proFeatures : freeFeatures;

  return (
    <div
      className={`relative hidden lg:flex flex-col min-w-0 px-2 xl:px-6 ${
        registerMode
          ? "justify-start lg:sticky lg:top-24 lg:self-start"
          : "justify-center lg:min-h-[min(62vh,580px)]"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 mb-4 xl:mb-5 self-start ${
          isPro
            ? "border-amber-300/60 bg-amber-50 text-amber-900"
            : "border-primary/20 bg-primary/10 text-primary"
        }`}
      >
        {isPro ? (
          <Star className="h-3.5 w-3.5 fill-current" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
        <span className="text-xs font-semibold">
          {isPro ? "Pro Plan — Paid customer" : "Free Plan — No card required"}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
        className="text-[1.75rem] xl:text-[2.35rem] font-bold tracking-tight text-secondary leading-[1.15] mb-3 xl:mb-4"
      >
        {brand?.brandLead ? (
          <>
            {brand.brandLead}{" "}
            <span className="text-gradient">{brand.brandHighlight}</span>
            {brand.brandTrail ? <> {brand.brandTrail}</> : null}
          </>
        ) : registerMode ? (
          <>
            Start managing tournaments <span className="text-gradient">in minutes</span>
          </>
        ) : (
          <>
            Manage Cricket Tournaments <span className="text-gradient">Like a Professional</span>
          </>
        )}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="text-text-muted text-sm xl:text-[15px] leading-relaxed mb-6 xl:mb-8 max-w-md"
      >
        {brand?.brandBody ||
          (registerMode
            ? "Create your free account and run professional cricket leagues with live scoring, fixtures, and analytics."
            : "Live scoring, team management, fixtures, and analytics — all in one powerful platform built for organizers.")}
      </motion.p>

      <motion.ul
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        className="space-y-2.5 xl:space-y-3 mb-7 xl:mb-9"
      >
        {features.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white border shadow-sm shrink-0 ${
                isPro ? "border-amber-200" : "border-slate-200/80"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isPro ? "text-amber-600" : "text-primary"}`}
                strokeWidth={2.25}
              />
            </span>
            <span className="text-sm font-medium text-secondary/80">{text}</span>
          </li>
        ))}
      </motion.ul>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-3 gap-3 xl:gap-4 border-t border-slate-200/80 pt-5 xl:pt-6 max-w-md"
      >
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="text-lg xl:text-xl font-bold text-secondary tabular-nums">{s.value}</p>
            <p className="text-[11px] xl:text-xs text-text-muted mt-0.5 truncate">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function MobileBrandIntro({ isPro, mobileIntro }) {
  return (
    <div className="lg:hidden text-center mb-5 sm:mb-6 min-w-0 px-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 mb-3 ${
          isPro
            ? "border-amber-300/60 bg-amber-50 text-amber-900"
            : "border-primary/20 bg-primary/10 text-primary"
        }`}
      >
        {isPro ? <Star className="h-3 w-3 fill-current" /> : <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {isPro ? "Pro Plan" : "Free Plan"}
        </span>
      </span>
      <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
        {mobileIntro ||
          (isPro
            ? "Pro payment confirmed — complete your account."
            : "Create your free account to start running tournaments.")}
      </p>
    </div>
  );
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footer,
  wide = false,
  registerMode = false,
  plan = "free",
  brand = null,
}) {
  const isPro = plan === "pro";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen min-w-0 overflow-x-clip bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.08),transparent_26%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)] text-text"
    >
      <Navbar />

      <main className="relative min-w-0 overflow-x-clip pt-16 sm:pt-[4.25rem] lg:pt-[4.5rem]">
        <AuthBackdrop isPro={isPro} />

        <div
          className={`section-container relative pb-10 sm:pb-14 ${
            registerMode ? "py-4 sm:py-6 lg:py-8" : "py-5 sm:py-7 lg:py-10"
          }`}
        >
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 min-w-0 lg:-mt-1 ${
              registerMode ? "lg:items-start" : "lg:items-center"
            }`}
          >
            <BrandPanel registerMode={registerMode} isPro={isPro} brand={brand} />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
              className={`w-full min-w-0 mx-auto lg:mx-0 lg:justify-self-end ${
                wide ? "max-w-[500px]" : "max-w-[420px]"
              }`}
            >
              <MobileBrandIntro isPro={isPro} mobileIntro={brand?.mobileIntro} />

              <div
                className={`rounded-2xl sm:rounded-[1.4rem] border bg-white/95 p-5 sm:p-7 md:p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-sm min-w-0 ${
                  isPro ? "border-amber-200/80 ring-1 ring-amber-100" : "border-slate-200/70"
                }`}
              >
                <div className="mb-5 sm:mb-6 min-w-0">
                  {brand?.badge && (
                    <span
                      className={`mb-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        isPro
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isPro && <Star className="h-3 w-3 fill-current" />}
                      {brand.badge}
                    </span>
                  )}
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-secondary">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{subtitle}</p>
                  )}
                </div>

                {children}
              </div>

              {footer && <div className="mt-5 sm:mt-6">{footer}</div>}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
