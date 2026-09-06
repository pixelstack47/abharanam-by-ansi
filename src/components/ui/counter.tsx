"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/** Number that counts up when scrolled into view. */
export function Counter({
  to,
  suffix = "",
  duration = 1.8,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = `${to.toLocaleString("en-IN")}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = `${Math.round(v).toLocaleString("en-IN")}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration, reduce]);

  return <span ref={ref}>0{suffix}</span>;
}
