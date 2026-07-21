const CARD = "rounded-2xl border border-slate-200/80 bg-white shadow-sm";

export default function ProfileSection({ title, subtitle, children, className = "" }) {
  return (
    <section className={`${CARD} p-5 sm:p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h2 className="text-lg font-bold text-secondary">{title}</h2>}
          {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export { CARD as PROFILE_CARD };
