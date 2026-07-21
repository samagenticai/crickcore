import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { fadeUp } from "../../utils/animations";

export default function ScrollReveal({
  children,
  className = "",
  variant = fadeUp,
  delay = 0,
  once = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variant}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
