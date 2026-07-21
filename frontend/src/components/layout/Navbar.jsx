import { AnimatePresence, motion } from "framer-motion";
import { Menu, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useAuth } from "../../context/AuthContext";
import { isAdminUser } from "../../utils/roles";
import { paymentsAPI } from "../../api/payments";
import Button from "../ui/Button";
import Logo from "../ui/Logo";

const navLinks = [
  { label: "Home", href: "/#home", id: "home" },
  { label: "About", href: "/#about", id: "about" },
  { label: "Features", href: "/#features", id: "features" },
  { label: "Reviews", href: "/#reviews", id: "reviews" },
  { label: "FAQ", href: "/#faq", id: "faq" },
  { label: "Contact", href: "/#contact", id: "contact" },
];

function AuthActions({ mobile = false, onNavigate }) {
  const { user, loading, isPro } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const checkoutStartedRef = useRef(false);
  const fullWidth = mobile ? { fullWidth: true, onClick: onNavigate } : {};
  const isAdmin = isAdminUser(user);

  const startProCheckout = async (e) => {
    e?.preventDefault?.();
    onNavigate?.();
    if (checkoutStartedRef.current) return;
    checkoutStartedRef.current = true;
    setUpgrading(true);
    try {
      const res = await paymentsAPI.createCheckoutSession("pro");
      const url = res.data?.data?.url;
      if (!url) throw new Error("Checkout URL missing from server");
      window.location.assign(url);
    } catch (err) {
      checkoutStartedRef.current = false;
      toast.error(err.message || "Unable to start Stripe checkout");
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className={mobile ? "h-11" : "h-10 w-28 animate-pulse rounded-xl bg-slate-100"} aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <Button variant="ghost" href="/login" size="default" {...fullWidth}>
          Login
        </Button>
        <Button variant="primary" href="/register?plan=free" {...fullWidth}>
          Register
        </Button>
      </>
    );
  }

  if (isAdmin) {
    return (
      <>
        <Button variant="secondary" href="/admin" {...fullWidth}>
          Admin Area
        </Button>
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200/80 bg-violet-50 px-3.5 py-2.5 text-sm font-semibold text-violet-800 ${
            mobile ? "w-full" : ""
          }`}
        >
          Admin
        </span>
      </>
    );
  }

  if (isPro) {
    return (
      <>
        <Button variant="secondary" href="/dashboard" {...fullWidth}>
          Dashboard
        </Button>
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-800 ${
            mobile ? "w-full" : ""
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-current" />
          PRO MEMBER
        </span>
      </>
    );
  }

  return (
    <>
      <Button variant="secondary" href="/dashboard" {...fullWidth}>
        Dashboard
      </Button>
      <Button
        variant="primary"
        type="button"
        disabled={upgrading}
        onClick={startProCheckout}
        {...(mobile ? { fullWidth: true } : {})}
      >
        {upgrading ? "Opening Stripe…" : "Upgrade to Pro"}
      </Button>
    </>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const location = useLocation();

  useScrollLock(mobileOpen);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    navLinks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  // Smooth-scroll when landing with a hash (e.g. /#pricing)
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.pathname, location.hash]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 min-w-0 overflow-x-clip ${
          scrolled
            ? "glass shadow-[0_4px_24px_rgba(15,23,42,0.06)] py-2.5 sm:py-3"
            : "bg-white/0 py-3 sm:py-4"
        }`}
      >
        <nav className="section-container flex items-center justify-between gap-3 sm:gap-4">
          <Logo />

          <ul className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === "/" && activeSection === link.id;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`relative px-2.5 xl:px-3.5 py-2 text-[13px] font-medium transition-colors duration-300 group rounded-lg ${
                      isActive
                        ? "text-primary"
                        : "text-text-muted hover:text-secondary hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0.5 left-2.5 right-2.5 xl:left-3.5 xl:right-3.5 h-[2px] bg-primary rounded-full transition-transform duration-300 origin-left ${
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="hidden lg:flex items-center gap-2">
            <AuthActions />
          </div>

          <motion.button
            type="button"
            onClick={() => setMobileOpen(true)}
            whileTap={{ scale: 0.92 }}
            className="lg:hidden p-2.5 -mr-1 rounded-xl text-secondary hover:bg-surface transition-colors touch-target"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] lg:hidden min-w-0 overflow-x-clip"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-100/55 backdrop-blur-[6px]"
              onClick={closeMobile}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-[min(100%,340px)] bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <Logo />
                <motion.button
                  type="button"
                  onClick={closeMobile}
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="p-2.5 rounded-xl text-secondary hover:bg-surface transition-colors touch-target"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <ul className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.a
                      href={link.href}
                      onClick={closeMobile}
                      whileTap={{ scale: 0.98, x: 4 }}
                      className={`block px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors touch-target ${
                        location.pathname === "/" && activeSection === link.id
                          ? "bg-primary/8 text-primary"
                          : "text-secondary hover:bg-surface"
                      }`}
                    >
                      {link.label}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>

              <div className="px-5 py-5 border-t border-slate-100 space-y-2.5">
                <AuthActions mobile onNavigate={closeMobile} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
