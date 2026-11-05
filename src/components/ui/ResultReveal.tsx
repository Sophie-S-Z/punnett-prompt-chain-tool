"use client";
import { motion, useReducedMotion } from "motion/react";
/** A softened content reveal informed by React Bits, using the existing Motion runtime. */
export function ResultReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0.65, filter: "blur(3px)", y: 6 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: reduce ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
