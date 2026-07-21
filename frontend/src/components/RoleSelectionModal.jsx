import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowRight, Eye, LayoutDashboard } from "lucide-react";
import { MODAL_BACKDROP } from "./ui/modalUi";

// Remembered per browser session so the popup only greets the user once when
// the application opens, not on every in-app navigation.
const STORAGE_KEY = "cm_selected_role";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + i * 0.07, type: "spring", stiffness: 320, damping: 26 },
  }),
};

export default function RoleSelectionModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  // Lock background scrolling while the popup is visible.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const choose = (role, to) => {
    sessionStorage.setItem(STORAGE_KEY, role);
    setOpen(false);
    navigate(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 min-w-0"
        >
          {/* Soft, light backdrop — not a heavy dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={MODAL_BACKDROP}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-[520px] sm:max-w-2xl max-h-[min(92vh,720px)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl sm:rounded-3xl border border-white/60 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.12),0_4px_16px_rgba(15,23,42,0.06)] backdrop-blur-xl p-4 sm:p-6 md:p-8 min-w-0"
          >
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-2.5 sm:gap-3 mb-5 sm:mb-7 min-w-0">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary shadow-md shadow-primary/25"
              >
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </motion.div>
              <div className="min-w-0 px-1">
                <h2
                  id="role-modal-title"
                  className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-secondary leading-snug"
                >
                  Welcome to{" "}
                  <span className="text-gradient">CricketTournament</span>
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-text-muted leading-relaxed">
                  Choose how you&apos;d like to continue
                </p>
              </div>
            </div>

            {/* Two role cards — no empty third column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
              <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="min-w-0">
                <RoleCard
                  icon={Eye}
                  accent="primary"
                  title="Viewer"
                  description="Browse live matches, tournaments, scorecards, and points tables."
                  action={{
                    label: "Continue as Viewer",
                    onClick: () => choose("viewer", "/viewer"),
                  }}
                />
              </motion.div>

              <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="min-w-0">
                <RoleCard
                  icon={LayoutDashboard}
                  accent="accent"
                  title="Organizer"
                  description="Manage tournaments, teams, fixtures, matches, and live scoring."
                  action={{
                    label: "Continue as Organizer",
                    onClick: () => choose("organizer", "/"),
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function RoleCard({ icon: Icon, title, description, action, accent = "primary" }) {
  const accentRing = {
    primary: "hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(22,163,74,0.12)]",
    accent: "hover:border-accent/40 hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)]",
  }[accent];

  const iconWrap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-amber-700",
  }[accent];

  const buttonClass = {
    primary:
      "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30",
    accent:
      "bg-gradient-to-r from-accent to-accent-light text-secondary shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30",
  }[accent];

  return (
    <div
      onClick={action.onClick}
      className={`relative flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 text-center cursor-pointer transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 min-w-0 ${accentRing}`}
    >
      <div
        className={`mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-3 sm:mb-4 ${iconWrap}`}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.25} />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-secondary">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-text-muted leading-relaxed flex-1">
        {description}
      </p>

      <div className="mt-4 sm:mt-5 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] touch-target ${buttonClass}`}
        >
          <span className="truncate">{action.label}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
