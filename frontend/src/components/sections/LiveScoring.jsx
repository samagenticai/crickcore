import { motion } from "framer-motion";
import { CheckCircle2, CircleDot } from "lucide-react";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";
import { fadeLeft, fadeRight } from "../../utils/animations";

const scoringFeatures = [
  "Ball-by-ball commentary feed",
  "Automatic run rate calculations",
  "Partnership and milestone tracking",
  "DLS method support for rain-affected matches",
  "Multi-scorer collaboration in real-time",
  "Embed live scores on any website",
];

export default function LiveScoring() {
  return (
    <Section id="live-scoring" variant="surface">
      <div className="section-container">
        <SectionHeading
          badge="Live Scoring"
          title="Real-Time Scoring That Keeps Everyone Connected"
          subtitle="Score matches from any device. Updates appear instantly for players, fans, and broadcasters."
        />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <ScrollReveal variant={fadeLeft}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(15,23,42,0.08)] border border-slate-200/80 safe-overflow"
            >
              <div className="bg-secondary px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 min-w-0">
                <CircleDot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-pulse shrink-0" />
                <span className="text-white text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                  Chennai Kings vs Bangalore Blazers
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 shrink-0">Over 15.3</span>
              </div>

              <div className="bg-white p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-surface border border-slate-100 min-w-0">
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1 truncate">Chennai Kings</p>
                    <p className="text-2xl sm:text-3xl font-bold text-secondary">
                      156<span className="text-base sm:text-lg text-text-muted">/3</span>
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-surface border border-slate-100 min-w-0">
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1">Target</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">189</p>
                    <p className="text-[10px] sm:text-xs text-text-muted">RRR: 8.25</p>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {[
                    { name: "V. Kohli", stat: "62 (41) · 4s: 6 · 6s: 2", tag: "Batting", tagClass: "bg-primary/10 text-primary" },
                    { name: "J. Bumrah", stat: "3/28 (3.3) · Econ: 8.0", tag: "Bowling", tagClass: "bg-accent/10 text-accent" },
                  ].map((player) => (
                    <div
                      key={player.name}
                      className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-surface border border-slate-100 min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-secondary truncate">{player.name}</p>
                        <p className="text-[11px] sm:text-xs text-text-muted truncate">{player.stat}</p>
                      </div>
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-lg font-medium shrink-0 ${player.tagClass}`}>
                        {player.tag}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-1 sm:gap-1.5 flex-wrap">
                  {["1", "4", "0", "6", "1", "W", "2", "4"].map((ball, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      whileTap={{ scale: 0.9 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 500, damping: 25 }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-bold touch-manipulation ${
                        ball === "W"
                          ? "bg-red-100 text-red-600"
                          : ball === "6" || ball === "4"
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-secondary"
                      }`}
                    >
                      {ball}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          <ScrollReveal variant={fadeRight}>
            <ul className="space-y-3 sm:space-y-4 mt-2 lg:mt-0">
              {scoringFeatures.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ x: 4 }}
                  className="flex items-start gap-3 p-2 -mx-2 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-secondary leading-relaxed">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </Section>
  );
}
