"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/lib/store";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import { Rating } from "@/components/ui/rating";

export function ProductCard({
  product,
  priority = false,
  showRating = false,
}: {
  product: Product;
  priority?: boolean;
  showRating?: boolean;
}) {
  const { addToCart, toggleWishlist, isWishlisted, setCartOpen, setQuickViewSlug, hydrated } =
    useStore();
  const wishlisted = hydrated && isWishlisted(product.slug);
  const discount = discountPercent(product.price, product.compareAtPrice);

  const quickAdd = () => {
    addToCart(product.slug);
    setCartOpen(true);
  };

  return (
    <article className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-champagne/30">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            preload={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.04] lg:group-hover:opacity-0"
          />
          <Image
            src={product.images[1] ?? product.images[0]}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="hidden object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100 lg:block"
          />
        </Link>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-luxe-sm text-ivory">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="bg-gold-dark px-2.5 py-1 text-[10px] font-semibold uppercase tracking-luxe-sm text-ivory">
              −{discount}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-stone px-2.5 py-1 text-[10px] font-semibold uppercase tracking-luxe-sm text-ivory">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => toggleWishlist(product.slug)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-ivory/90 shadow-sm backdrop-blur transition-all duration-300 hover:scale-110",
            wishlisted ? "text-gold-dark" : "text-espresso",
          )}
        >
          <Heart size={16} strokeWidth={1.5} className={wishlisted ? "fill-gold-dark" : ""} />
        </button>

        {/* Desktop hover actions */}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 gap-2 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
          <button
            onClick={quickAdd}
            disabled={!product.inStock}
            className="flex h-10 flex-1 items-center justify-center gap-2 bg-ink/90 text-[11px] font-medium uppercase tracking-luxe-sm text-ivory backdrop-blur transition-colors hover:bg-ink disabled:opacity-50"
          >
            <ShoppingBag size={14} strokeWidth={1.5} />
            {product.inStock ? "Quick Add" : "Sold Out"}
          </button>
          <button
            onClick={() => setQuickViewSlug(product.slug)}
            aria-label={`Quick view ${product.name}`}
            className="inline-flex size-10 items-center justify-center bg-ivory/90 text-ink backdrop-blur transition-colors hover:bg-ivory"
          >
            <Eye size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mt-3.5 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-[16px] leading-snug">
            <Link
              href={`/product/${product.slug}`}
              className="transition-colors hover:text-gold-dark"
            >
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="line-clamp-1 text-xs text-stone">{product.shortDescription}</p>
        {showRating && product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Rating value={product.rating} size={11} />
            <span className="text-[11px] text-stone">({product.reviewCount})</span>
          </div>
        )}
        <p className="flex items-baseline gap-2 pt-0.5">
          <span className="text-sm font-semibold">{formatINR(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-stone line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
        </p>
        {/* Mobile quick add */}
        <button
          onClick={quickAdd}
          disabled={!product.inStock}
          className="mt-1 w-full border border-line py-2 text-[11px] font-medium uppercase tracking-luxe-sm text-espresso transition-colors active:bg-ink active:text-ivory disabled:opacity-50 lg:hidden"
        >
          {product.inStock ? "Add to Bag" : "Sold Out"}
        </button>
      </div>
    </article>
  );
}
