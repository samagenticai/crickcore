import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  LayoutGrid,
  Settings2,
} from "lucide-react";
import Button from "../ui/Button";
import BackgroundDecor from "../ui/BackgroundDecor";
import PremiumCard from "../ui/PremiumCard";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";
import { iconHover } from "../../utils/animations";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Create Tournament",
    description:
      "Set up your tournament in minutes. Define format, rules, venues, and registration deadlines.",
  },
  {
    icon: LayoutGrid,
    step: "02",
    title: "Manage Teams & Fixtures",
    description:
      "Add teams, assign groups, and let our engine generate optimized fixtures automatically.",
  },
  {
    icon: Settings2,
    step: "03",
    title: "Score & Analyze",
    description:
      "Score live matches, publish results, and access comprehensive analytics dashboards.",
  },
];

export default function TournamentManagement() {
  return (
    <Section id="tournaments" className="overflow-hidden">
      <BackgroundDecor />

      <div className="section-container relative">
        <SectionHeading
          badge="Tournament Management"
          title="From Setup to Final Whistle in Three Simple Steps"
          subtitle="Our intuitive workflow guides you through every stage of tournament management."
        />

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative items-stretch">
          <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((item, i) => (
            <ScrollReveal key={item.step} delay={i * 0.1} className="h-full">
              <PremiumCard padding="lg" className="text-center h-full">
                <div className="relative inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary text-white text-base sm:text-lg font-bold mb-5 sm:mb-6 shadow-md shadow-primary/25">
                  {item.step}
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent flex items-center justify-center shadow-sm"
                    variants={iconHover}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
                  </motion.div>
                </div>
                <h3 className="heading-lg text-secondary mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
              </PremiumCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="text-center mt-8 sm:mt-10 lg:mt-12">
          <Button variant="primary" href="/register?plan=free" size="lg">
            Create Your First Tournament
            <ArrowRight className="w-4 h-4" />
          </Button>
        </ScrollReveal>
      </div>
    </Section>
  );
}
