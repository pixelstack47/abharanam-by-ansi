"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { getProduct } from "@/data/products";
import { useStore } from "@/lib/store";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";

export function QuickView() {
  const { quickViewSlug, setQuickViewSlug, addToCart, setCartOpen, toggleWishlist, isWishlisted } =
    useStore();
  const product = quickViewSlug ? getProduct(quickViewSlug) : undefined;
  const trapRef = useFocusTrap<HTMLDivElement>(product !== undefined);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.button
            aria-label="Close quick view"
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickViewSlug(null)}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={trapRef}
              tabIndex={-1}
              className="pointer-events-auto relative grid w-full max-w-3xl overflow-hidden bg-cream shadow-2xl outline-none md:grid-cols-2"
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={`Quick view: ${product.name}`}
            >
              <button
                onClick={() => setQuickViewSlug(null)}
                className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-ivory/80 text-ink backdrop-blur hover:bg-ivory"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.5} />
              </button>

              <div className="relative aspect-[4/5] bg-champagne/30 max-md:hidden">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col p-7 md:p-9">
                <p className="text-[10px] uppercase tracking-luxe text-gold-dark">
                  {product.category} · {product.collection}
                </p>
                <h2 className="mt-2 font-serif text-2xl leading-tight md:text-3xl">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <Rating value={product.rating} />
                  <span className="text-xs text-stone">
                    {product.rating} · {product.reviewCount} reviews
                  </span>
                </div>
                <p className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-xl font-semibold">{formatINR(product.price)}</span>
                  {product.compareAtPrice && (
                    <>
                      <span className="text-sm text-stone line-through">
                        {formatINR(product.compareAtPrice)}
                      </span>
                      <span className="text-xs font-semibold text-gold-dark">
                        {discountPercent(product.price, product.compareAtPrice)}% off
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone">
                  {product.description}
                </p>
                <div className="mt-6 flex gap-2.5">
                  <Button
                    className="flex-1"
                    disabled={!product.inStock}
                    onClick={() => {
                      addToCart(product.slug);
                      setQuickViewSlug(null);
                      setCartOpen(true);
                    }}
                  >
                    {product.inStock ? "Add to Bag" : "Sold Out"}
                  </Button>
                  <button
                    onClick={() => toggleWishlist(product.slug)}
                    aria-label="Toggle wishlist"
                    className={cn(
                      "inline-flex size-11 shrink-0 items-center justify-center border transition-colors",
                      isWishlisted(product.slug)
                        ? "border-gold text-gold-dark"
                        : "border-ink/30 text-ink hover:border-ink",
                    )}
                  >
                    <Heart
                      size={17}
                      strokeWidth={1.5}
                      className={isWishlisted(product.slug) ? "fill-gold-dark" : ""}
                    />
                  </button>
                </div>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={() => setQuickViewSlug(null)}
                  className="mt-4 text-center text-xs uppercase tracking-luxe-sm text-stone underline-offset-4 hover:text-ink hover:underline"
                >
                  View Full Details
                </Link>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
