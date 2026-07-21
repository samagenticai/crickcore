import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Globe,
  Shield,
  Trophy,
  Users,
  Zap,
  Radio,
} from "lucide-react";
import BackgroundDecor from "../ui/BackgroundDecor";
import PremiumCard from "../ui/PremiumCard";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";
import { iconHover } from "../../utils/animations";

const features = [
  {
    icon: Trophy,
    title: "Tournament Brackets",
    description:
      "Create knockout, round-robin, or hybrid formats with automatic bracket generation and seeding.",
  },
  {
    icon: Radio,
    title: "Live Scoring",
    description:
      "Ball-by-ball scoring with real-time updates pushed to fans, broadcasters, and social media instantly.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "AI-powered fixture scheduling that avoids conflicts, optimizes venues, and handles rain delays.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Register teams, manage rosters, track player eligibility, and handle transfers seamlessly.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Deep performance insights with strike rates, economy figures, heat maps, and custom reports.",
  },
  {
    icon: Globe,
    title: "Public Portal",
    description:
      "Beautiful public-facing pages for standings, schedules, and live scores your fans will love.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Granular permissions for admins, scorers, team managers, and viewers with audit trails.",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description:
      "Push alerts for match starts, milestones, results, and schedule changes via email and SMS.",
  },
];

function FeatureCard({ icon: Icon, title, description, index }) {
  return (
    <ScrollReveal delay={index * 0.05} className="h-full">
      <PremiumCard accent className="group h-full">
        <motion.div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center mb-4 sm:mb-5 transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:shadow-md group-hover:shadow-primary/25"
          variants={iconHover}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:text-white transition-colors duration-300" />
        </motion.div>
        <h3 className="text-base sm:text-lg font-bold text-secondary mb-1.5 sm:mb-2 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </PremiumCard>
    </ScrollReveal>
  );
}

export default function Features() {
  return (
    <Section id="features" className="overflow-x-clip">
      <BackgroundDecor />

      <div className="section-container relative">
        <SectionHeading
          badge="Features"
          title="Everything You Need to Run World-Class Tournaments"
          subtitle="Powerful tools designed specifically for cricket — from grassroots clubs to professional leagues."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </div>
    </Section>
  );
}
