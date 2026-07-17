"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function AnimatedNumber({ value }: { value: number }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);

  useMotionValueEvent(motionValue, "change", (latest) => {
    if (spanRef.current) {
      spanRef.current.textContent = formatCurrency(latest);
    }
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={spanRef}>{formatCurrency(0)}</span>;
}
