"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Product, SerializedReview } from "@/types";
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

const REVIEW_INPUT_CLASS =
  "w-full border border-ink/25 bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink";

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProductDetail({
  product,
  initialReviews,
  reviewsTotal,
}: {
  product: Product;
  initialReviews: SerializedReview[];
  reviewsTotal: number;
}) {
  const router = useRouter();
  const {
    addToCart,
    setCartOpen,
    toggleWishlist,
    isWishlisted,
    hydrated,
    user,
    userLoaded,
  } = useStore();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantityLocal] = useState(1);
  const [openSection, setOpenSection] = useState<number>(0);
  const wishlisted = hydrated && isWishlisted(product.slug);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const sections = DETAILS_SECTIONS(product);

  // Live review state — seeded server-side, refreshed from PUT/DELETE
  // responses (which return the re-aggregated product).
  const [reviews, setReviews] = useState<SerializedReview[]>(initialReviews);
  const [totalReviews, setTotalReviews] = useState(reviewsTotal);
  const [agg, setAgg] = useState({
    rating: product.rating,
    reviewCount: product.reviewCount,
  });

  const ownReview = useMemo(
    () => (user ? reviews.find((r) => r.userId === user.id) : undefined),
    [user, reviews],
  );

  // Write-review form.
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const prefilled = useRef(false);

  // Prefill the form once with the signed-in user's existing review.
  useEffect(() => {
    if (!ownReview || prefilled.current) return;
    prefilled.current = true;
    /* eslint-disable react-hooks/set-state-in-effect */
    setFormRating(ownReview.rating);
    setFormTitle(ownReview.title ?? "");
    setFormBody(ownReview.body);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ownReview]);

  const applyAggregate = (next: Product) => {
    setAgg({ rating: next.rating, reviewCount: next.reviewCount });
    setTotalReviews(next.reviewCount);
  };

  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormNotice(null);
    const title = formTitle.trim();
    const body = formBody.trim();
    if (formRating < 1) {
      setFormError("Pick a star rating first.");
      return;
    }
    if (body.length < 10) {
      setFormError("Tell us a little more — at least 10 characters.");
      return;
    }
    if (body.length > 2000) {
      setFormError("Reviews are limited to 2,000 characters.");
      return;
    }
    if (title.length > 120) {
      setFormError("Titles are limited to 120 characters.");
      return;
    }
    setFormError(null);
    setSaving(true);
    const hadReview = ownReview !== undefined;
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(product.slug)}/reviews`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: formRating,
            ...(title ? { title } : {}),
            body,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        review?: SerializedReview;
        product?: Product;
        error?: string;
      } | null;
      if (!res.ok || !data?.review || !data.product) {
        throw new Error(data?.error ?? "Could not save your review.");
      }
      const saved = data.review;
      setReviews((prev) =>
        prev.some((r) => r.id === saved.id)
          ? prev.map((r) => (r.id === saved.id ? saved : r))
          : [saved, ...prev],
      );
      applyAggregate(data.product);
      prefilled.current = true;
      setFormNotice(
        hadReview
          ? "Your review has been updated."
          : "Thank you — your review is live.",
      );
      // Collapse back to the compact row — the notice shows there.
      setFormOpen(false);
      setConfirmingDelete(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save your review.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOwnReview() {
    if (!ownReview || deleting) return;
    setDeleting(true);
    setFormError(null);
    setFormNotice(null);
    const removedId = ownReview.id;
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(product.slug)}/reviews`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        product?: Product;
        error?: string;
      } | null;
      if (!res.ok || !data?.product) {
        throw new Error(data?.error ?? "Could not delete your review.");
      }
      setReviews((prev) => prev.filter((r) => r.id !== removedId));
      applyAggregate(data.product);
      prefilled.current = true;
      setFormRating(0);
      setFormTitle("");
      setFormBody("");
      setFormNotice("Your review has been removed.");
      setFormOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not delete your review.",
      );
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

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
            {agg.reviewCount > 0 && (
              <div className="mt-3 flex items-center gap-2.5">
                <Rating value={agg.rating} />
                <span className="text-xs text-stone">
                  {agg.rating} · {agg.reviewCount}{" "}
                  {agg.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

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
      <section
        id="reviews"
        className="mt-24 border-t border-line pt-16"
        aria-label="Customer reviews"
      >
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
            {agg.reviewCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="font-serif text-4xl">{agg.rating}</span>
                <div>
                  <Rating value={agg.rating} />
                  <p className="mt-0.5 text-xs text-stone">
                    Based on {agg.reviewCount}{" "}
                    {agg.reviewCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 max-w-2xl">
            {/* Write / sign-in — a single compact row until expanded */}
            {user && formOpen ? (
              <div className="border border-line bg-cream p-6 sm:p-8">
                <h3 className="font-serif text-2xl font-light">
                  {ownReview ? (
                    <>
                      Your <em className="italic">review</em>
                    </>
                  ) : (
                    <>
                      Share your <em className="italic">experience</em>
                    </>
                  )}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  {ownReview
                    ? "Edit or remove what you wrote — one review per piece, always yours to change."
                    : "Owned this piece a while? A few honest words help someone else choose well."}
                </p>

                <form onSubmit={submitReview} className="mt-6 space-y-4" noValidate>
                  <div>
                    <span className="text-[11px] uppercase tracking-luxe-sm text-stone">
                      Your rating
                    </span>
                    <div
                      className="mt-2 flex items-center gap-0.5"
                      role="radiogroup"
                      aria-label="Your rating"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={formRating === n}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          onClick={() => setFormRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onFocus={() => setHoverRating(n)}
                          onBlur={() => setHoverRating(0)}
                          className="cursor-pointer p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={22}
                            strokeWidth={1.25}
                            className={
                              (hoverRating || formRating) >= n
                                ? "fill-gold text-gold"
                                : "fill-transparent text-sand"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="review-title"
                      className="text-[11px] uppercase tracking-luxe-sm text-stone"
                    >
                      Title <span className="normal-case">(optional)</span>
                    </label>
                    <input
                      id="review-title"
                      type="text"
                      maxLength={120}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Sums it up in a line"
                      className={cn(REVIEW_INPUT_CLASS, "h-11")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="review-body"
                      className="text-[11px] uppercase tracking-luxe-sm text-stone"
                    >
                      Your review
                    </label>
                    <textarea
                      id="review-body"
                      rows={5}
                      maxLength={2000}
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="How does it wear? How does it feel in person?"
                      className={cn(
                        REVIEW_INPUT_CLASS,
                        "resize-y py-3 leading-relaxed",
                      )}
                    />
                  </div>

                  {formError && (
                    <p className="text-xs text-maroon" role="alert">
                      {formError}
                    </p>
                  )}
                  {formNotice && !formError && (
                    <p className="text-xs text-gold-dark" role="status">
                      {formNotice}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={saving || deleting}>
                    {saving
                      ? "Saving…"
                      : ownReview
                        ? "Update Your Review"
                        : "Submit Review"}
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormOpen(false);
                        setFormError(null);
                        setConfirmingDelete(false);
                      }}
                      disabled={saving || deleting}
                      className="cursor-pointer text-xs uppercase tracking-luxe-sm text-stone underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    {ownReview &&
                      (confirmingDelete ? (
                        <p className="flex items-center gap-4 text-xs text-stone">
                          Delete your review?
                          <button
                            type="button"
                            onClick={() => void deleteOwnReview()}
                            disabled={deleting}
                            className="cursor-pointer font-medium uppercase tracking-luxe-sm text-maroon underline underline-offset-4 hover:text-ink disabled:opacity-50"
                          >
                            {deleting ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(false)}
                            disabled={deleting}
                            className="cursor-pointer uppercase tracking-luxe-sm text-espresso underline underline-offset-4 hover:text-ink disabled:opacity-50"
                          >
                            Keep it
                          </button>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(true)}
                          disabled={deleting}
                          className="cursor-pointer text-xs uppercase tracking-luxe-sm text-stone underline underline-offset-4 transition-colors hover:text-maroon"
                        >
                          Delete my review
                        </button>
                      ))}
                  </div>
                </form>
              </div>
            ) : (
              <div className="border border-line bg-cream px-5 py-4 sm:px-6">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm leading-relaxed text-stone">
                    {user
                      ? ownReview
                        ? "Edit or remove what you wrote — one review per piece, always yours to change."
                        : "Owned this piece a while? A few honest words help someone else choose well."
                      : "Sign in to review this piece — a few honest words help someone else choose well."}
                  </p>
                  {user ? (
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        setFormNotice(null);
                        setFormOpen(true);
                      }}
                    >
                      {ownReview ? "Edit Your Review" : "Write a Review"}
                    </Button>
                  ) : (
                    userLoaded && (
                      <Link
                        href={`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`}
                        className="shrink-0"
                      >
                        <Button size="sm">Sign in to Review</Button>
                      </Link>
                    )
                  )}
                </div>
                {formNotice && (
                  <p className="mt-2 text-xs text-gold-dark" role="status">
                    {formNotice}
                  </p>
                )}
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="mt-10 flex flex-col items-center border-t border-line py-10 text-center">
                <Star size={20} strokeWidth={1} className="text-sand" />
                <p className="mt-3 font-serif text-lg font-light">No reviews yet</p>
                <p className="mt-1 text-sm text-stone">
                  Be the first to share how this piece wears.
                </p>
              </div>
            ) : (
              <div className="mt-10">
                <div className="divide-y divide-line border-t border-line">
                  {reviews.map((review) => (
                    <article key={review.id} className="py-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Rating value={review.rating} size={12} />
                        <time
                          dateTime={review.createdAt}
                          className="text-xs text-stone"
                        >
                          {formatReviewDate(review.createdAt)}
                        </time>
                      </div>
                      {review.title && (
                        <h3 className="mt-2.5 font-serif text-lg leading-snug">
                          {review.title}
                        </h3>
                      )}
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone">
                        {review.body}
                      </p>
                      <footer className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-stone">
                        <span className="font-medium text-ink">
                          {review.name}
                        </span>
                        {user && review.userId === user.id && (
                          <span className="border border-line bg-champagne/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-luxe-sm text-espresso">
                            You
                          </span>
                        )}
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 border border-gold/40 bg-champagne/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-luxe-sm text-gold-dark">
                            <BadgeCheck size={11} strokeWidth={1.75} />
                            Verified purchase
                          </span>
                        )}
                      </footer>
                    </article>
                  ))}
                </div>
                {totalReviews > reviews.length && (
                  <p className="mt-4 text-xs uppercase tracking-luxe-sm text-stone">
                    Showing {reviews.length} of {totalReviews} reviews
                  </p>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
