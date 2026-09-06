"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";
import { Reveal } from "@/components/ui/reveal";

interface ProductCarouselProps {
  eyebrow: string;
  title: React.ReactNode;
  products: Product[];
  href?: string;
  hrefLabel?: string;
  showRating?: boolean;
  dark?: boolean;
}

export function ProductCarousel({
  eyebrow,
  title,
  products,
  href,
  hrefLabel = "View All",
  showRating = false,
}: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal className="mb-10 flex items-end justify-between gap-6 lg:mb-14">
          <div>
            <p className="text-[11px] uppercase tracking-luxe text-gold-dark">{eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl font-light leading-tight sm:text-5xl">
              {title}
            </h2>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            {href && (
              <Link
                href={href}
                className="mr-4 text-[11px] font-medium uppercase tracking-luxe-sm text-espresso underline-offset-4 hover:underline"
              >
                {hrefLabel}
              </Link>
            )}
            <button
              onClick={() => scrollBy(-1)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-espresso transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
              aria-label="Scroll left"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-espresso transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
              aria-label="Scroll right"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </Reveal>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 sm:px-6 lg:gap-6 lg:px-10"
      >
        {/* Leading spacer aligns the track with the page container on very wide screens */}
        <div className="hidden w-[max(0px,calc((100vw-1440px)/2-2.5rem))] shrink-0 min-[1440px]:block" />
        {products.map((product, i) => (
          <div
            key={product.slug}
            className="w-[68vw] shrink-0 snap-start sm:w-[42vw] lg:w-[300px]"
          >
            <Reveal delay={Math.min(i * 0.06, 0.3)} y={20}>
              <ProductCard product={product} showRating={showRating} />
            </Reveal>
          </div>
        ))}
        <div className="hidden w-[max(0px,calc((100vw-1440px)/2-2.5rem))] shrink-0 min-[1440px]:block" />
      </div>

      {href && (
        <div className="mt-8 px-4 sm:hidden">
          <Link
            href={href}
            className="block border border-ink/30 py-3 text-center text-[11px] font-medium uppercase tracking-luxe-sm"
          >
            {hrefLabel}
          </Link>
        </div>
      )}
    </section>
  );
}
