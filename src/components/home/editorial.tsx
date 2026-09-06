import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, ImageReveal } from "@/components/ui/reveal";

export function EditorialCollection() {
  return (
    <section className="bg-cream py-20 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-0 lg:px-10">
        {/* Large image, offset like a magazine spread */}
        <ImageReveal className="relative lg:col-span-7">
          <div className="relative aspect-[4/5] max-h-[720px] w-full overflow-hidden bg-champagne/30">
            <Image
              src="https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1600&auto=format&fit=crop"
              alt="The Heritage Collection — temple jewellery in antique gold"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
          <Reveal
            delay={0.3}
            className="absolute -bottom-8 right-4 hidden w-56 lg:right-[-40px] lg:block"
          >
            <div className="relative aspect-[3/4] overflow-hidden border-[6px] border-cream bg-champagne/30 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=700&auto=format&fit=crop"
                alt="Detail of hand-set kundan work"
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          </Reveal>
        </ImageReveal>

        {/* Copy */}
        <div className="lg:col-span-5 lg:pl-20">
          <Reveal>
            <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
              The Editorial · No. 01
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 font-serif text-4xl font-light uppercase leading-[1.08] tracking-[0.04em] sm:text-5xl lg:text-6xl">
              The
              <br />
              Heritage
              <br />
              <em className="italic normal-case text-gold-dark">Collection</em>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-stone">
              Temple motifs, hand-pressed kundan and antique finishes — centuries of
              Indian craft, composed for the way you dress today. Each piece is
              burnished by hand until it glows like an heirloom.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <Link
              href="/shop?collection=Heritage"
              className="group mt-9 inline-flex items-center gap-3 border-b border-ink pb-1.5 text-[11px] font-medium uppercase tracking-luxe transition-colors hover:border-gold hover:text-gold-dark"
            >
              Explore Collection
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1.5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
