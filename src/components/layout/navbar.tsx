"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE_NAME, SITE_SUBNAME } from "@/data/site";
import { useStore } from "@/lib/store";
import { MobileMenu } from "./mobile-menu";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { cartCount, wishlist, hydrated, setCartOpen, setSearchOpen, setMenuOpen } =
    useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Transparent over the cinematic hero on the homepage only.
  const transparent = pathname === "/" && !scrolled;

  const iconBtn = cn(
    "relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors duration-300",
    transparent ? "text-ivory hover:bg-ivory/15" : "text-ink hover:bg-ink/5",
  );

  const badge =
    "absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold-dark text-[9px] font-semibold text-ivory";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-500",
          transparent
            ? "bg-transparent"
            : "border-b border-line bg-ivory/85 shadow-[0_1px_20px_rgba(42,17,22,0.07)] backdrop-blur-xl",
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10"
          aria-label="Main navigation"
        >
          {/* Left: hamburger (mobile) / links (desktop) */}
          <div className="flex flex-1 items-center gap-1">
            <button
              className={cn(iconBtn, "lg:hidden")}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <ul className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={cn(
                      "group relative text-[11px] font-medium uppercase tracking-luxe-sm transition-colors duration-300",
                      transparent
                        ? "text-ivory/90 hover:text-ivory"
                        : "text-espresso hover:text-ink",
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full",
                        transparent ? "bg-ivory" : "bg-gold",
                      )}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Centre: wordmark lockup — name above a gold-ruled "by Ansi" line,
              mirroring the badge logo. */}
          <Link
            href="/"
            className="flex flex-col items-center leading-none"
            aria-label={`${SITE_NAME} ${SITE_SUBNAME} — home`}
          >
            <span
              className={cn(
                "font-serif text-xl font-medium tracking-[0.28em] uppercase transition-colors duration-300 sm:text-2xl lg:text-[26px]",
                transparent ? "text-ivory" : "text-ink",
              )}
            >
              {SITE_NAME}
            </span>
            <span
              className={cn(
                "mt-1.5 flex items-center gap-2 text-[8px] uppercase tracking-luxe transition-colors duration-300 lg:text-[9px]",
                transparent ? "text-ivory/75" : "text-gold-dark",
              )}
            >
              <span className="h-px w-3 bg-current opacity-60 lg:w-4" aria-hidden />
              {SITE_SUBNAME}
              <span className="h-px w-3 bg-current opacity-60 lg:w-4" aria-hidden />
            </span>
          </Link>

          {/* Right: actions */}
          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1.5">
            <button
              className={iconBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>
            <Link
              href="/account"
              className={cn(iconBtn, "hidden sm:inline-flex")}
              aria-label="Account"
            >
              <User size={19} strokeWidth={1.5} />
            </Link>
            <Link href="/wishlist" className={iconBtn} aria-label="Wishlist">
              <Heart size={19} strokeWidth={1.5} />
              {hydrated && wishlist.length > 0 && (
                <span className={badge}>{wishlist.length}</span>
              )}
            </Link>
            <button
              className={iconBtn}
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {hydrated && cartCount > 0 && <span className={badge}>{cartCount}</span>}
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu />
    </>
  );
}
