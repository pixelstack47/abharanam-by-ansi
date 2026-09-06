"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchOverlay } from "@/components/search/search-overlay";
import { QuickView } from "@/components/products/quick-view";
import { LuxeCursor } from "@/components/ui/cursor";

/**
 * Storefront chrome — navbar, footer, drawers and overlays — rendered around
 * every page except the admin area, which brings its own shell. StoreProvider
 * stays global in the root layout; only the visual chrome is conditional.
 */
export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-5 focus:py-3 focus:text-xs focus:uppercase focus:tracking-luxe-sm focus:text-ivory"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="min-h-screen">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <CartDrawer />
      <SearchOverlay />
      <QuickView />
      <LuxeCursor />
    </>
  );
}
