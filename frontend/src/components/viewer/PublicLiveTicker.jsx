import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildTickerItems } from "../../utils/tournamentViewer";

export default function PublicLiveTicker({ fixtures = [], visible = true, tournamentName }) {
  const items = useMemo(
    () => buildTickerItems(fixtures, { tournamentName }),
    [fixtures, tournamentName]
  );

  if (!visible || items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-red-200/80 bg-linear-to-r from-red-600 via-red-500 to-red-600 text-white overflow-hidden"
        aria-live="polite"
        aria-label="Live match updates"
      >
        <div className="relative flex items-center h-9 sm:h-10">
          <span className="absolute left-0 z-10 flex items-center gap-1.5 px-3 sm:px-4 h-full bg-red-600/95 backdrop-blur-sm text-[11px] sm:text-xs font-extrabold uppercase tracking-wider shrink-0 border-r border-red-400/40">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Live
          </span>

          <div className="flex-1 overflow-hidden pl-[4.5rem] sm:pl-20">
            <div className="viewer-ticker-track flex items-center gap-8 whitespace-nowrap py-2">
              {loop.map((item, i) => (
                <span
                  key={`${item.type}-${i}`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold"
                >
                  <span className="opacity-60">•</span>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
