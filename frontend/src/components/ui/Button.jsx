import { motion } from "framer-motion";
import { useState } from "react";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:glow-primary",
  secondary:
    "bg-white text-secondary border border-slate-200/80 hover:border-primary/25 hover:bg-surface shadow-sm hover:shadow-md",
  ghost:
    "bg-transparent text-secondary hover:bg-slate-100/80",
  accent:
    "bg-accent text-secondary font-semibold hover:bg-accent-light shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 hover:glow-accent",
  outline:
    "bg-white/5 text-white border border-white/25 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm",
};

const sizes = {
  default: "px-5 py-2.5 sm:px-6 sm:py-3 text-sm",
  lg: "px-6 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  href,
  onClick,
  type = "button",
  fullWidth = false,
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      550
    );
    onClick?.(e);
  };

  const classes = `
    relative overflow-hidden inline-flex items-center justify-center gap-2
    rounded-xl font-semibold tracking-tight
    transition-colors duration-300 cursor-pointer touch-target
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    ${variants[variant]} ${sizes[size]}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring", stiffness: 400, damping: 25 },
  };

  const content = (
    <>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/35 pointer-events-none"
          initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y, opacity: 0.5 }}
          animate={{
            width: 280,
            height: 280,
            x: ripple.x - 140,
            y: ripple.y - 140,
            opacity: 0,
          }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        onClick={handleClick}
        {...motionProps}
        {...props}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={handleClick}
      {...motionProps}
      {...props}
    >
      {content}
    </motion.button>
  );
}
