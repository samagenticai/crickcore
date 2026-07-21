import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MODAL_BACKDROP,
  MODAL_MAX_HEIGHT,
  MODAL_PANEL,
} from "../ui/modalUi";

/** Shared light backdrop + fixed centered shell for dashboard create/edit modals */
export const DASHBOARD_MODAL_BACKDROP = MODAL_BACKDROP;

export const DASHBOARD_MODAL_PANEL = MODAL_PANEL;

/** Cap modal height: 90vh max, minus overlay padding, safe for mobile browser chrome */
export const DASHBOARD_MODAL_MAX_HEIGHT = MODAL_MAX_HEIGHT;

export default function DashboardFormModal({
  open,
  onClose,
  loading = false,
  zIndex = 50,
  maxWidthClass = "max-w-2xl",
  maxHeightClass = DASHBOARD_MODAL_MAX_HEIGHT,
  showAccent = true,
  header,
  toolbar = null,
  footer,
  children,
  panelClassName = "",
  formOnSubmit = null,
}) {
  const [mounted, setMounted] = useState(false);

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

  const scrollBody = (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth px-4 sm:px-5 py-4 sm:py-5">
      {children}
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-5 overflow-hidden"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={`${DASHBOARD_MODAL_PANEL} ${maxWidthClass} ${maxHeightClass} ${panelClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            {showAccent && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-light to-accent rounded-t-2xl sm:rounded-t-3xl pointer-events-none z-10" />
            )}

            {header && <div className="shrink-0 bg-white relative z-[1]">{header}</div>}

            {toolbar && <div className="shrink-0 bg-white relative z-[1]">{toolbar}</div>}

            {formOnSubmit ? (
              <form
                onSubmit={formOnSubmit}
                className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden"
              >
                {scrollBody}
                {footer && (
                  <div className="shrink-0 bg-white relative z-[1] border-t border-slate-100">
                    {footer}
                  </div>
                )}
              </form>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
                {scrollBody}
                {footer && (
                  <div className="shrink-0 bg-white relative z-[1] border-t border-slate-100">
                    {footer}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
