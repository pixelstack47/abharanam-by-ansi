"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";

export function WishlistClient() {
  const { wishlist, hydrated, products, productsLoaded } = useStore();
  const items = products.filter((p) => wishlist.includes(p.slug));

  // Wait for both localStorage hydration and the catalog — rendering the
  // empty state before either would flash "no saved pieces" at real savers.
  if (!hydrated || !productsLoaded) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse bg-champagne/30" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center py-24 text-center"
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-champagne/40 text-gold-dark">
          <Heart size={30} strokeWidth={1.25} />
        </span>
        <h2 className="mt-7 font-serif text-3xl font-light sm:text-4xl">
          Your wishlist is waiting to <em className="italic">sparkle</em>
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone">
          Tap the heart on any piece you love and it will live here — ready for
          the moment you are.
        </p>
        <Link href="/shop" className="mt-9">
          <Button size="lg">Discover Jewellery</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <p className="mb-8 text-xs uppercase tracking-luxe-sm text-stone">
        {items.length} saved {items.length === 1 ? "piece" : "pieces"}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {items.map((product, i) => (
          <motion.div
            key={product.slug}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.3) }}
          >
            <ProductCard product={product} showRating />
          </motion.div>
        ))}
      </div>
    </>
  );
}
