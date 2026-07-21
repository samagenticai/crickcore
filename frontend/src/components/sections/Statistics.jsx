import AnimatedCounter from "../ui/AnimatedCounter";
import BackgroundDecor from "../ui/BackgroundDecor";
import Section from "../ui/Section";
import ScrollReveal from "../ui/ScrollReveal";

const stats = [
  { value: 500, suffix: "+", label: "Tournaments", labelSm: "Tournaments Hosted" },
  { value: 10000, suffix: "+", label: "Teams", labelSm: "Teams Registered" },
  { value: 50000, suffix: "+", label: "Matches", labelSm: "Matches Scored" },
  { value: 99, suffix: ".9%", label: "Uptime", labelSm: "Platform Uptime" },
];

export default function Statistics() {
  return (
    <Section variant="dark" size="sm" className="overflow-x-clip">
      <BackgroundDecor variant="dark" />

      <div className="section-container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8 lg:gap-10">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.labelSm} delay={i * 0.08}>
              <div className="text-center px-1 sm:px-2 min-w-0 rounded-2xl py-2 sm:py-0">
                <p className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-1 sm:mb-2 tracking-tight tabular-nums">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[11px] sm:text-sm text-slate-400 font-medium leading-snug">
                  <span className="sm:hidden">{stat.label}</span>
                  <span className="hidden sm:inline">{stat.labelSm}</span>
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
