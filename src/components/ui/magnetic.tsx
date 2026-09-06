"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useRef, type ReactNode } from "react";

/** Subtle magnetic pull toward the cursor on fine-pointer devices. */
export function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.3 });

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      x.set((e.clientX - rect.left - rect.width / 2) * strength);
      y.set((e.clientY - rect.top - rect.height / 2) * strength);
    },
    [x, y, strength],
  );

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: "inline-block" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}
