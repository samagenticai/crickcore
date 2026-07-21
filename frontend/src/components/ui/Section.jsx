export default function Section({
  id,
  children,
  className = "",
  variant = "default",
  size = "default",
  padded = true,
}) {
  const variants = {
    default: "bg-white",
    surface: "bg-surface",
    dark: "bg-secondary",
  };

  const sizes = {
    default: "section-padding",
    sm: "section-padding-sm",
    none: "",
  };

  return (
    <section
      id={id}
      className={`relative min-w-0 max-w-full overflow-x-clip ${variants[variant]} ${padded ? sizes[size] : ""} ${className}`}
    >
      {children}
    </section>
  );
}
