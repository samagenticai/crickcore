import { motion } from "framer-motion";
import { formatCountdownLabel } from "../../utils/tournamentViewer";

export default function PublicTournamentHeroStatus({ isLive, countdownParts }) {
  if (isLive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="inline-flex items-center gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <span className="text-xl sm:text-2xl leading-none animate-pulse">🔴</span>
          <span className="text-xl sm:text-3xl font-extrabold tracking-[0.2em] text-white uppercase">
            Live
          </span>
        </div>
      </motion.div>
    );
  }

  if (!countdownParts || countdownParts.isPast) return null;

  const label = formatCountdownLabel(countdownParts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="text-center px-4 py-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/80 mb-1">
          Starts in
        </p>
        <p className="text-lg sm:text-2xl font-extrabold tabular-nums text-white tracking-wide">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
