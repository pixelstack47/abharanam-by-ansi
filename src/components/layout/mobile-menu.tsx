"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE } from "@/data/site";
import { useStore } from "@/lib/store";
import { useFocusTrap } from "@/lib/use-focus-trap";

export function MobileMenu() {
  const { menuOpen, setMenuOpen, user, userLoaded } = useStore();
  const trapRef = useFocusTrap<HTMLDivElement>(menuOpen);

  /* Account entry mirrors the navbar icon: signed-in → account (admins →
     dashboard), signed-out → sign in. The menu only mounts after a click so
     userLoaded is almost always settled by now; the neutral fallback keeps
     the rare in-between state sensible. */
  const accountEntry =
    userLoaded && user
      ? {
          label: user.role === "admin" ? "Dashboard" : "My Account",
          href: user.role === "admin" ? "/admin" : "/account",
        }
      : userLoaded
        ? { label: "Sign In", href: "/login" }
        : { label: "Account", href: "/account" };

  const links = [...NAV_LINKS, accountEntry];

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          ref={trapRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex flex-col bg-ink text-ivory outline-none"
          initial={{ opacity: 0, y: "-4%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-4%" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-serif text-xl uppercase tracking-[0.28em]">
              {SITE_NAME}
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-full text-ivory hover:bg-ivory/10"
              aria-label="Close menu"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center px-8" aria-label="Mobile">
            <ul className="space-y-2">
              {links.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.07,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-4 py-2"
                  >
                    <span className="font-serif text-4xl font-light text-ivory transition-colors group-hover:text-gold-light">
                      {link.label}
                    </span>
                    <span className="text-xs text-ivory/55">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          <motion.div
            className="px-8 pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <div className="hairline mb-6 opacity-30" />
            <p className="font-serif text-lg italic text-ivory/70">{SITE_TAGLINE}</p>
            <p className="mt-2 text-xs uppercase tracking-luxe-sm text-ivory/55">
              Crafted in India · Shipped worldwide
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
