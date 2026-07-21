import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import BackgroundDecor from "../ui/BackgroundDecor";
import DashboardMockup from "../ui/DashboardMockup";
import Section from "../ui/Section";
import { fadeLeft, fadeRight, floatingAnimation } from "../../utils/animations";

const stats = [
  { value: "500+", label: "Tournaments" },
  { value: "10K+", label: "Teams" },
  { value: "99.9%", label: "Uptime" },
];

export default function Hero() {
  return (
    <Section
      id="home"
      padded={false}
      className="min-h-0 lg:min-h-screen flex items-center pt-[4.5rem] sm:pt-24 pb-12 sm:pb-16 lg:pb-20"
    >
      <BackgroundDecor />
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="section-container relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeLeft} className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/8 border border-primary/15 mb-4 sm:mb-6 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-primary">
                #1 Cricket Tournament Platform
              </span>
            </motion.div>

            <h1 className="text-[1.6rem] min-[360px]:text-[1.75rem] min-[480px]:text-3xl sm:text-4xl lg:text-[3.1rem] xl:text-[3.5rem] font-extrabold text-secondary leading-[1.12] tracking-tight mb-4 sm:mb-6 text-balance">
              Manage Cricket Tournaments{" "}
              <span className="text-gradient">Like a Professional</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-text-muted mb-6 sm:mb-8 max-w-xl leading-relaxed text-pretty">
              Streamline every aspect of your cricket league — from team
              registration and fixture scheduling to real-time live scoring and
              advanced analytics. Built for organizers who demand excellence.
            </p>

            <div className="flex flex-col min-[480px]:flex-row gap-3 sm:gap-4">
              <Button variant="primary" href="/register?plan=free" fullWidth className="min-[480px]:w-auto">
                Get Started
              </Button>
              <Button variant="secondary" href="/#pricing" fullWidth className="min-[480px]:w-auto">
                <Play className="w-4 h-4 shrink-0" />
                View Pricing
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 min-[360px]:gap-3 sm:gap-6 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200/80">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left min-w-0 px-0.5">
                  <p className="text-lg min-[360px]:text-xl sm:text-2xl font-bold text-secondary tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-[10px] min-[360px]:text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeRight}
            className="relative min-w-0 w-full"
          >
            <motion.div {...floatingAnimation} className="relative">
              <div className="absolute -inset-4 sm:-inset-6 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl pointer-events-none" />
              <DashboardMockup />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
