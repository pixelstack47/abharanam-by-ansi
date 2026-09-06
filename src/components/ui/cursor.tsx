"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Elegant custom cursor — a small gold dot with a trailing ring.
 * Renders only on fine-pointer (desktop) devices; the native cursor stays visible.
 */
export function LuxeCursor() {
  // false during SSR, real pointer capability on the client.
  const enabled = useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
  const [active, setActive] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 150, damping: 18, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 150, damping: 18, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      setActive(Boolean(target?.closest("a, button, [role='button'], input, select, textarea")));
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="luxe-cursor pointer-events-none fixed left-0 top-0 z-[100] size-1.5 rounded-full bg-gold"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden
        className="luxe-cursor pointer-events-none fixed left-0 top-0 z-[100] rounded-full border border-gold/50"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: active ? 44 : 28, height: active ? 44 : 28, opacity: active ? 0.9 : 0.5 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
    </>
  );
}
