"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Search, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlist, hydrated, setCartOpen, setSearchOpen } = useStore();

  const itemClass = (active: boolean) =>
    cn(
      "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors",
      active ? "text-gold-dark" : "text-stone",
    );

  const badge =
    "absolute right-1/2 top-0.5 flex size-4 translate-x-4 items-center justify-center rounded-full bg-gold-dark text-[9px] font-semibold text-ivory";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <div className="flex">
        <Link href="/" className={itemClass(pathname === "/")}>
          <House size={20} strokeWidth={1.5} />
          Home
        </Link>
        <Link href="/shop" className={itemClass(pathname === "/shop")}>
          <Store size={20} strokeWidth={1.5} />
          Shop
        </Link>
        <button onClick={() => setSearchOpen(true)} className={itemClass(false)}>
          <Search size={20} strokeWidth={1.5} />
          Search
        </button>
        <Link href="/wishlist" className={itemClass(pathname === "/wishlist")}>
          <Heart size={20} strokeWidth={1.5} />
          {hydrated && wishlist.length > 0 && (
            <span className={badge}>{wishlist.length}</span>
          )}
          Wishlist
        </Link>
        <button onClick={() => setCartOpen(true)} className={itemClass(false)}>
          <ShoppingBag size={20} strokeWidth={1.5} />
          {hydrated && cartCount > 0 && <span className={badge}>{cartCount}</span>}
          Cart
        </button>
      </div>
    </nav>
  );
}
