"use client";

/**
 * Site-wide toast notifications (storefront + admin).
 *
 * State lives in a module-level store outside the React tree, so a toast
 * fired right before router.push() survives the navigation — <Toaster />
 * (mounted once in the root layout) simply re-reads the same store on the
 * next route. Fire from any client component:
 *
 *   toast.success("Product created.");
 *   toast.error("Something went wrong.");
 *
 * Lives under components/admin/ for historical reasons (it started as an
 * admin-only affordance); the component itself has no admin dependency.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

const AUTO_DISMISS_MS = 3500;
const MAX_VISIBLE = 4;

/* ——— Module-level store (survives route changes) ——— */

let nextId = 0;
let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return toasts;
}

function push(variant: ToastVariant, message: string) {
  // Newest last; the oldest drops off once the stack exceeds MAX_VISIBLE.
  toasts = [...toasts, { id: nextId++, variant, message }].slice(-MAX_VISIBLE);
  for (const listener of listeners) listener();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  for (const listener of listeners) listener();
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

/* ——— Presentation ——— */

const surface: Record<ToastVariant, string> = {
  success: "border-line border-l-gold bg-cream text-ink",
  error: "border-red-200 border-l-red-700 bg-red-50 text-red-700",
};

const iconTone: Record<ToastVariant, string> = {
  success: "text-gold-dark",
  error: "text-red-700",
};

function ToastItem({ id, variant, message }: Toast) {
  const [paused, setPaused] = useState(false);
  const Icon = variant === "success" ? Check : AlertCircle;

  // Auto-dismiss unless hovered/focused; leaving restarts the full window.
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, paused]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex items-start gap-3 border border-l-2 px-4 py-3 shadow-lg",
        surface[variant],
      )}
    >
      <Icon
        size={14}
        strokeWidth={2}
        className={cn("mt-0.5 shrink-0", iconTone[variant])}
        aria-hidden
      />
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={13} strokeWidth={1.5} />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <ul
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-80 print:hidden"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
