import ScrollReveal from "../ui/ScrollReveal";
import Section from "../ui/Section";

const brands = [
  "Premier League",
  "County Cricket",
  "IPL Academy",
  "National Board",
  "Club Champions",
  "Stadium Pro",
];

export default function TrustedBy() {
  return (
    <Section id="about" variant="surface" size="sm" className="border-y border-slate-200/60">
      <div className="section-container">
        <ScrollReveal>
          <p className="text-center text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wider mb-6 sm:mb-8 px-2">
            Trusted by leading cricket organizations worldwide
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 items-center">
          {brands.map((brand, i) => (
            <ScrollReveal key={brand} delay={i * 0.06}>
              <div className="flex items-center justify-center h-10 sm:h-12 px-2 sm:px-4 rounded-xl hover:bg-white/80 transition-colors duration-300 group">
                <span className="text-[11px] sm:text-sm font-bold text-slate-300 group-hover:text-slate-500 transition-colors text-center leading-tight">
                  {brand}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
