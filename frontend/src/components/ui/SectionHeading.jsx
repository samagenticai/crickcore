import ScrollReveal from "./ScrollReveal";

export default function SectionHeading({
  badge,
  title,
  subtitle,
  align = "center",
  dark = false,
}) {
  const alignClass =
    align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-3xl mb-9 sm:mb-12 lg:mb-14 ${alignClass}`}>
      {badge && (
        <ScrollReveal>
          <span
            className={`inline-block px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4 shadow-sm ${
              dark
                ? "bg-primary/20 text-primary-light"
                : "bg-primary/8 text-primary border border-primary/15"
            }`}
          >
            {badge}
          </span>
        </ScrollReveal>
      )}
      <ScrollReveal delay={0.08}>
        <h2
          className={`heading-xl mb-3 sm:mb-4 ${
            dark ? "text-white" : "text-secondary"
          }`}
        >
          {title}
        </h2>
      </ScrollReveal>
      {subtitle && (
        <ScrollReveal delay={0.15}>
          <p
            className={`body-lg max-w-2xl ${align === "center" ? "mx-auto" : ""} ${
              dark ? "text-slate-400" : "text-text-muted"
            }`}
          >
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
