"use client";

import { motion } from "framer-motion";

export function LoginCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-sm"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 animate-pulse rounded-[40px] bg-primary/20 blur-3xl"
      />
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-glow">{children}</div>
    </motion.div>
  );
}
