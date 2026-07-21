export default function BackgroundDecor({ variant = "light" }) {
  const isDark = variant === "dark";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className={`absolute -top-24 -right-24 sm:-top-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl ${
          isDark ? "bg-primary/10" : "bg-primary/5"
        }`}
      />
      <div
        className={`absolute top-1/2 -left-16 sm:-left-32 w-40 h-40 sm:w-80 sm:h-80 rounded-full blur-3xl ${
          isDark ? "bg-accent/10" : "bg-accent/5"
        }`}
      />
      <div
        className={`absolute -bottom-12 sm:-bottom-20 right-1/4 w-36 h-36 sm:w-72 sm:h-72 rounded-full blur-3xl ${
          isDark ? "bg-primary/5" : "bg-primary/6"
        }`}
      />
      {!isDark && (
        <div className="absolute inset-0 dot-pattern opacity-20 sm:opacity-25" />
      )}
    </div>
  );
}
