import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/data/site";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const featured = ["Necklaces", "Earrings", "Bridal", "Anti-Tarnish"] as const;

export function FeaturedCategories() {
  const tiles = featured
    .map((name) => CATEGORIES.find((c) => c.name === name))
    .filter((c): c is (typeof CATEGORIES)[number] => Boolean(c));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <Reveal className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end lg:mb-16">
        <div>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Explore</p>
          <h2 className="mt-3 font-serif text-4xl font-light leading-tight sm:text-5xl">
            Shop by <em className="italic">desire</em>
          </h2>
        </div>
        <Link
          href="/shop"
          className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-luxe-sm text-espresso hover:text-ink"
        >
          View All Jewellery
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        {tiles.map((category, i) => (
          <Reveal
            key={category.name}
            delay={i * 0.08}
            className={cn(
              // Asymmetric editorial rhythm: wide, narrow, narrow, wide.
              i === 0 || i === 3 ? "lg:col-span-7" : "lg:col-span-5",
            )}
          >
            <Link
              href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group relative block h-[420px] overflow-hidden bg-champagne/30 lg:h-[520px]"
            >
              <Image
                src={category.image}
                alt={`${category.name} — ${category.blurb}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 58vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent transition-opacity duration-500 group-hover:from-ink/85" />
              {/* The caption carries its own scrim so the text stays legible over
                  a bright crop of any photograph, not just these four. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/85 to-transparent p-7 pt-24 text-ivory transition-transform duration-500 ease-out group-hover:-translate-y-2 lg:p-9 lg:pt-28">
                <p className="text-[10px] uppercase tracking-luxe text-champagne">
                  {category.blurb}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <h3 className="font-serif text-3xl font-light uppercase tracking-[0.08em] lg:text-4xl">
                    {category.name}
                  </h3>
                  <span className="inline-flex size-11 -translate-x-2 items-center justify-center rounded-full border border-ivory/40 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
