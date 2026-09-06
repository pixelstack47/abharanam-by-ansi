import Image from "next/image";
import { InstagramIcon } from "@/components/ui/social-icons";
import { GALLERY_IMAGES } from "@/data/site";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

// Asymmetric masonry rhythm — tall tiles punctuate the grid.
const spans = [
  "row-span-2",
  "",
  "",
  "row-span-2",
  "",
  "row-span-2",
  "",
  "",
];

export function SocialGallery() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <Reveal className="mb-12 text-center">
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          @abharanam.byansi
        </p>
        <h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
          As <em className="italic">worn</em> by you
        </h2>
      </Reveal>

      <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4 lg:gap-4">
        {GALLERY_IMAGES.map((src, i) => (
          <Reveal key={src} delay={(i % 4) * 0.07} className={cn(spans[i])}>
            <a
              href="#"
              aria-label="View on Instagram"
              className="group relative block h-full w-full overflow-hidden bg-champagne/30"
            >
              <Image
                src={src}
                alt="Abharanam jewellery worn by a customer"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-500 group-hover:bg-ink/40">
                <InstagramIcon
                  size={22}
                  className="scale-75 text-ivory opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
                />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
