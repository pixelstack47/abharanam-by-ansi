"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";
import { PRODUCT_REVIEWS } from "@/data/site";
import { useStore } from "@/lib/store";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Reveal } from "@/components/ui/reveal";

const DETAILS_SECTIONS = (product: Product) => [
  {
    title: "Product Details",
    body: `${product.description}\n\nMaterial: ${product.material}. Collection: ${product.collection}. Each piece arrives in Abharanam signature packaging with an authenticity card.`,
  },
  {
    title: "Shipping",
    body: "Free shipping on orders above ₹1,999. Orders dispatch within 48 hours and arrive in 2–5 business days across India. Cash on delivery available.",
  },
  {
    title: "Returns",
    body: "7-day easy returns. If a piece doesn't feel right, initiate a return from your account and we arrange a doorstep pickup — no questions asked.",
  },
  {
    title: "Care Instructions",
    body: "Store in the pouch provided, away from direct sunlight. Avoid contact with perfume and water (except anti-tarnish pieces, which are waterproof). Wipe gently with the included polishing cloth after wear.",
  },
];

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, setCartOpen, toggleWishlist, isWishlisted, hydrated } = useStore();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantityLocal] = useState(1);
  const [openSection, setOpenSection] = useState<number>(0);
  const wishlisted = hydrated && isWishlisted(product.slug);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const sections = DETAILS_SECTIONS(product);

  const addToBag = () => {
    addToCart(product.slug, quantity);
    setCartOpen(true);
  };

  const buyNow = () => {
    addToCart(product.slug, quantity);
    router.push("/checkout");
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-24 sm:px-6 lg:px-10 lg:pt-36">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-ink"
        >
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden bg-champagne/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src={product.images[activeImage]}
                  alt={`${product.name} — view ${activeImage + 1}`}
                  fill
                  preload
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {discount > 0 && (
              <span className="absolute left-4 top-4 bg-gold-dark px-3 py-1.5 text-[10px] font-semibold uppercase tracking-luxe-sm text-ivory">
                Save {discount}%
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-3">
            {product.images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative h-24 w-20 overflow-hidden border transition-all",
                  activeImage === i
                    ? "border-gold opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Purchase panel */}
        <div>
          <Reveal y={16}>
            <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
              {product.collection} · {product.category}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-light leading-tight lg:text-5xl">
              {product.name}
            </h1>
            <div className="mt-3 flex items-center gap-2.5">
              <Rating value={product.rating} />
              <span className="text-xs text-stone">
                {product.rating} · {product.reviewCount} reviews
              </span>
            </div>

            <p className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-semibold">{formatINR(product.price)}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-base text-stone line-through">
                    {formatINR(product.compareAtPrice)}
                  </span>
                  <span className="text-sm font-semibold text-gold-dark">
                    {discount}% off
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-stone">Inclusive of all taxes</p>

            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-espresso">
              {product.description}
            </p>

            <dl className="mt-6 grid max-w-lg grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-luxe-sm text-stone">Material</dt>
                <dd className="mt-1 font-medium">{product.material}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-luxe-sm text-stone">
                  Availability
                </dt>
                <dd
                  className={cn(
                    "mt-1 font-medium",
                    product.inStock ? "text-gold-dark" : "text-stone",
                  )}
                >
                  {product.inStock ? "In stock — ships in 48h" : "Currently sold out"}
                </dd>
              </div>
            </dl>

            {/* Quantity + CTAs */}
            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center border border-ink/25">
                <button
                  onClick={() => setQuantityLocal((q) => Math.max(1, q - 1))}
                  className="flex size-11 items-center justify-center text-stone hover:text-ink"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantityLocal((q) => Math.min(10, q + 1))}
                  className="flex size-11 items-center justify-center text-stone hover:text-ink"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
              <button
                onClick={() => toggleWishlist(product.slug)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 border px-4 text-[11px] font-medium uppercase tracking-luxe-sm transition-colors",
                  wishlisted
                    ? "border-gold text-gold-dark"
                    : "border-ink/25 text-espresso hover:border-ink",
                )}
              >
                <Heart size={15} className={wishlisted ? "fill-gold-dark" : ""} />
                {wishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>

            <div className="mt-4 flex max-w-lg flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                size="lg"
                disabled={!product.inStock}
                onClick={addToBag}
              >
                {product.inStock ? "Add to Bag" : "Sold Out"}
              </Button>
              <Button
                variant="gold"
                size="lg"
                className="flex-1"
                disabled={!product.inStock}
                onClick={buyNow}
              >
                Buy Now
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-4 text-xs text-stone sm:grid-cols-4">
              {[
                { Icon: Truck, label: "Free shipping ₹1,999+" },
                { Icon: RefreshCcw, label: "7-day returns" },
                { Icon: ShieldCheck, label: "Quality checked" },
                { Icon: Sparkles, label: "Gift packaging" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <Icon size={18} strokeWidth={1.25} className="text-gold-dark" />
                  {label}
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="mt-10 max-w-lg border-t border-line">
              {sections.map((section, i) => (
                <div key={section.title} className="border-b border-line">
                  <button
                    onClick={() => setOpenSection(openSection === i ? -1 : i)}
                    className="flex w-full items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-luxe-sm"
                    aria-expanded={openSection === i}
                  >
                    {section.title}
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-stone transition-transform duration-300",
                        openSection === i && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openSection === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="whitespace-pre-line pb-5 text-sm leading-relaxed text-stone">
                          {section.body}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-24 border-t border-line pt-16" aria-label="Customer reviews">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
                Customer Reviews
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light sm:text-4xl">
                What they’re <em className="italic">saying</em>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-serif text-4xl">{product.rating}</span>
              <div>
                <Rating value={product.rating} />
                <p className="mt-0.5 text-xs text-stone">
                  Based on {product.reviewCount} reviews
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 0.07}>
              <article className="flex h-full flex-col border border-line bg-cream p-6">
                <Rating value={review.rating} size={12} />
                <h3 className="mt-3 font-serif text-lg leading-snug">{review.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">
                  {review.body}
                </p>
                <footer className="mt-5 text-xs text-stone">
                  <span className="font-medium text-ink">{review.name}</span> ·{" "}
                  {review.location} ·{" "}
                  {new Date(review.date).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </footer>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
