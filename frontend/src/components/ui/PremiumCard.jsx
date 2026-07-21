import { motion } from "framer-motion";
import { cardHover } from "../../utils/animations";

const paddingMap = {
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export default function PremiumCard({
  children,
  className = "",
  padding = "md",
  interactive = true,
  glass = false,
  accent = false,
  as: Component = motion.div,
  ...props
}) {
  const baseClasses = `
    relative h-full min-w-0 overflow-hidden group
    ${glass ? "glass" : "card-premium"}
    ${interactive ? "card-premium-hover cursor-pointer" : ""}
    ${paddingMap[padding]}
    ${className}
  `;

  if (!interactive) {
    return (
      <Component className={baseClasses} {...props}>
        {accent && (
          <div
            className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={baseClasses}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={cardHover}
      {...props}
    >
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent"
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/0 to-accent/0 group-hover:from-primary/[0.03] group-hover:to-accent/[0.03] transition-all duration-300 pointer-events-none" />
      {children}
    </Component>
  );
}
