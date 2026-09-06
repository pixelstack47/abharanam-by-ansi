import { TESTIMONIALS } from "@/data/site";
import { Rating } from "@/components/ui/rating";
import { Reveal } from "@/components/ui/reveal";

export function Testimonials() {
  return (
    <section className="bg-espresso py-20 text-ivory lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal className="mb-12 lg:mb-16">
          <p className="text-[11px] uppercase tracking-luxe text-gold-light">
            Kind Words
          </p>
          <h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
            Loved, worn, <em className="italic text-champagne">treasured</em>
          </h2>
        </Reveal>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-10">
        <div className="hidden w-[max(0px,calc((100vw-1440px)/2-2.5rem))] shrink-0 min-[1440px]:block" />
        {TESTIMONIALS.map((t, i) => (
          <Reveal
            key={t.name}
            delay={Math.min(i * 0.07, 0.28)}
            className="w-[82vw] shrink-0 snap-start sm:w-[400px]"
          >
            <figure className="flex h-full flex-col border border-ivory/10 bg-ink/30 p-8 backdrop-blur-sm lg:p-10">
              <Rating value={t.rating} className="text-gold-light" />
              <blockquote className="mt-5 flex-1 font-serif text-xl font-light leading-relaxed text-ivory/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-7">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-0.5 text-xs uppercase tracking-luxe-sm text-ivory/65">
                  {t.location}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
        <div className="hidden w-[max(0px,calc((100vw-1440px)/2-2.5rem))] shrink-0 min-[1440px]:block" />
      </div>
    </section>
  );
}
