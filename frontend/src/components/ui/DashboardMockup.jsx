import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CircleDot,
  TrendingUp,
  Users,
} from "lucide-react";
import { floatingAnimation } from "../../utils/animations";

function FloatingCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      animate={floatingAnimation.animate}
      transition={{
        ...floatingAnimation.animate.transition,
        delay,
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function DashboardMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none safe-overflow px-1 sm:px-0">
      {/* Contained area prevents floating cards from causing horizontal scroll */}
      <div className="relative pt-6 pb-4 sm:pt-8 sm:pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative rounded-2xl bg-white shadow-[0_8px_40px_rgba(15,23,42,0.1)] border border-slate-200/60 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-surface border-b border-slate-100">
            <div className="flex gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1 min-w-0 mx-2 sm:mx-3">
              <div className="h-5 sm:h-6 bg-white rounded-lg border border-slate-200 flex items-center px-2 sm:px-3 overflow-hidden">
                <span className="text-[9px] sm:text-[10px] text-text-muted truncate">
                  app.crickettournament.com/dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-text-muted">Live Match</p>
                <p className="text-xs sm:text-sm font-bold text-secondary truncate">
                  Mumbai Strikers vs Delhi Royals
                </p>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-red-50 text-red-600 text-[9px] sm:text-[10px] font-semibold shrink-0">
                <CircleDot className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { team: "Mumbai Strikers", score: "187", wickets: "4", overs: "18.2 overs" },
                { team: "Delhi Royals", score: "142", wickets: "7", overs: "16.0 overs" },
              ].map((item) => (
                <div
                  key={item.team}
                  className="p-2.5 sm:p-3 rounded-xl bg-surface border border-slate-100 min-w-0"
                >
                  <p className="text-[9px] sm:text-[10px] text-text-muted mb-0.5 truncate">
                    {item.team}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-secondary">
                    {item.score}
                    <span className="text-xs sm:text-sm text-text-muted">/{item.wickets}</span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-text-muted">{item.overs}</p>
                </div>
              ))}
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-linear-to-r from-primary/5 to-accent/5 border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-secondary">
                  Win Probability
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="h-1.5 sm:h-2 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-linear-to-r from-primary to-primary-light"
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-primary font-semibold">68%</span>
                <span className="text-[10px] text-text-muted">32%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { icon: Activity, label: "Run Rate", value: "9.2" },
                { icon: BarChart3, label: "Boundaries", value: "24" },
                { icon: Users, label: "Viewers", value: "12.4K" },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-100 text-center min-w-0"
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary mx-auto mb-0.5" />
                  <p className="text-[11px] sm:text-xs font-bold text-secondary">{value}</p>
                  <p className="text-[8px] sm:text-[9px] text-text-muted truncate">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Floating cards — repositioned to stay within bounds on mobile */}
        <FloatingCard className="top-0 left-0 sm:-top-2 sm:-left-4" delay={0}>
          <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl glass shadow-md border border-white/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] text-text-muted">Top Scorer</p>
                <p className="text-[11px] sm:text-xs font-bold text-secondary whitespace-nowrap">
                  R. Sharma 78*
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="bottom-0 right-0 sm:-bottom-2 sm:-right-4" delay={1.2}>
          <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl glass shadow-md border border-white/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] text-text-muted">Next Match</p>
                <p className="text-[11px] sm:text-xs font-bold text-secondary whitespace-nowrap">
                  Today, 3:30 PM
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="top-1/3 -translate-y-1/2 right-0 sm:-right-6 hidden min-[480px]:block" delay={0.6}>
          <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
            <p className="text-[9px] sm:text-[10px] font-medium opacity-90">Active</p>
            <p className="text-base sm:text-lg font-bold leading-none">24</p>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
