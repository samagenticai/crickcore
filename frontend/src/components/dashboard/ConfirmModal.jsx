import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import {
  DASHBOARD_MODAL_BACKDROP,
  DASHBOARD_MODAL_PANEL,
} from "./DashboardFormModal";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  icon: CustomIcon,
  zIndex = 90,
}) {
  const [mounted, setMounted] = useState(false);
  const isDanger = variant === "danger";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || loading) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  const iconBg = isDanger
    ? "bg-red-100 text-red-600"
    : variant === "warning"
      ? "bg-amber-100 text-amber-600"
      : "bg-primary/10 text-primary";

  const confirmClass = isDanger
    ? "bg-red-600 hover:bg-red-700 text-white"
    : variant === "warning"
      ? "bg-amber-500 hover:bg-amber-600 text-white"
      : "bg-primary hover:bg-primary-dark text-white";

  const Icon = CustomIcon || (isDanger ? AlertTriangle : Info);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-5 overflow-hidden"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={DASHBOARD_MODAL_BACKDROP}
            onClick={!loading ? onClose : undefined}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={`${DASHBOARD_MODAL_PANEL} relative z-[1] w-full max-w-sm p-6 sm:p-7`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-amber-400 rounded-t-2xl sm:rounded-t-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center gap-4 pt-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="min-w-0 w-full">
                <h3 id="confirm-modal-title" className="text-lg font-bold text-secondary break-words">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed break-words">{description}</p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${confirmClass}`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
