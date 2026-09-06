import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopClient } from "@/components/shop/shop-client";

export const metadata: Metadata = {
  title: "Shop All Jewellery",
  description:
    "Discover the full Abharanam collection — necklaces, chokers, earrings, chains, harams, bridal, anti-tarnish and diamond-look jewellery.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <div className="pt-24 lg:pt-32">
      <header className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-6 lg:px-10 lg:pb-12">
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          The Collection
        </p>
        <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl lg:text-6xl">
          All <em className="italic">jewellery</em>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">
          Every piece, hand-finished and quality-checked. Filter by category,
          material or collection to find the one that feels like you.
        </p>
      </header>
      <Suspense>
        <ShopClient />
      </Suspense>
    </div>
  );
}
