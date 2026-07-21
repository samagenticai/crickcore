import { motion } from "framer-motion";
import { BarChart3, Calendar, LayoutDashboard, Users } from "lucide-react";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";

const screenshots = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    description: "Complete tournament overview at a glance",
    gradient: "from-primary/15 to-primary/5",
    accent: "text-primary",
  },
  {
    icon: Calendar,
    title: "Fixture Manager",
    description: "Drag-and-drop scheduling interface",
    gradient: "from-accent/15 to-accent/5",
    accent: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Analytics Hub",
    description: "Deep performance insights and reports",
    gradient: "from-blue-500/15 to-blue-500/5",
    accent: "text-blue-500",
  },
  {
    icon: Users,
    title: "Team Portal",
    description: "Self-service team management portal",
    gradient: "from-purple-500/15 to-purple-500/5",
    accent: "text-purple-500",
  },
];

function ScreenshotCard({ icon: Icon, title, description, gradient, accent, index }) {
  return (
    <ScrollReveal delay={index * 0.08} className="h-full">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.98, y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="group h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200/70 bg-white shadow-sm hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-shadow duration-300 safe-overflow"
      >
        <div className={`aspect-4/3 bg-linear-to-br ${gradient} p-4 sm:p-5 flex flex-col min-h-0`}>
          <div className="flex-1 rounded-xl bg-white/85 backdrop-blur-sm border border-white/60 shadow-inner overflow-hidden transition-transform duration-300 group-hover:scale-[1.015] min-w-0">
            <div className="h-7 sm:h-8 bg-surface border-b border-slate-100 flex items-center px-3 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-300" />
              <div className="w-2 h-2 rounded-full bg-accent/60" />
              <div className="w-2 h-2 rounded-full bg-primary/60" />
            </div>
            <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${accent} shrink-0`} />
                <div className="h-2.5 sm:h-3 flex-1 max-w-24 bg-slate-200/80 rounded" />
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="h-12 sm:h-16 bg-surface rounded-lg" />
                <div className="h-12 sm:h-16 bg-surface rounded-lg" />
                <div className="h-12 sm:h-16 bg-surface rounded-lg" />
              </div>
              <div className="h-14 sm:h-20 bg-surface rounded-lg" />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 bg-white flex-1">
          <h3 className="font-bold text-secondary text-sm sm:text-base mb-0.5">{title}</h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{description}</p>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

export default function Screenshots() {
  return (
    <Section variant="surface">
      <div className="section-container">
        <SectionHeading
          badge="Screenshots"
          title="A Beautiful Interface Your Teams Will Love"
          subtitle="Every screen is crafted for clarity, speed, and ease of use — on any device."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {screenshots.map((item, i) => (
            <ScreenshotCard key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </Section>
  );
}
