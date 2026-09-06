import type { Metadata } from "next";
import { WishlistClient } from "@/components/wishlist/wishlist-client";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The Abharanam pieces you love, saved in one place.",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 lg:pt-32">
      <header className="pb-8 lg:pb-12">
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Saved</p>
        <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl lg:text-6xl">
          Your <em className="italic">wishlist</em>
        </h1>
      </header>
      <WishlistClient />
    </div>
  );
}
