import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { MODAL_BACKDROP } from "../../ui/modalUi";

export function LiveScoreModal({
  open,
  onClose,
  children,
  maxWidth = "max-w-md",
  closeOnBackdrop = true,
  zIndex = "z-[100]",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 sm:p-6`}
          role="presentation"
        >
          {closeOnBackdrop && onClose && (
            <button
              type="button"
              aria-label="Close dialog"
              className={MODAL_BACKDROP}
              onClick={onClose}
            />
          )}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={`relative flex w-full ${maxWidth} max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-secondary shadow-[0_4px_24px_rgba(15,23,42,0.08),0_8px_32px_rgba(22,163,74,0.06)]`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function LiveScoreModalAccent({ className = "bg-linear-to-r from-primary via-primary-light to-accent" }) {
  return <div className={`h-1 shrink-0 ${className}`} aria-hidden="true" />;
}

export function LiveScoreModalHeader({
  icon: Icon,
  badge,
  title,
  subtitle,
  onClose,
  accentClass,
}) {
  return (
    <>
      {accentClass && <LiveScoreModalAccent className={accentClass} />}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          {badge && (
            <div className="mb-1 flex items-center gap-2 text-primary">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">{badge}</span>
            </div>
          )}
          {!badge && Icon && <Icon className="mb-2 h-5 w-5 text-primary" />}
          <h2 className="text-lg font-bold leading-tight text-secondary">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-secondary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );
}

export function LiveScoreModalBody({ children, className = "" }) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 ${className}`}>
      {children}
    </div>
  );
}

export function LiveScoreModalFooter({ children, className = "" }) {
  return (
    <div className={`shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export const liveScoreFieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60";

export const liveScoreLabelClass =
  "text-xs font-semibold uppercase tracking-wide text-slate-500";
