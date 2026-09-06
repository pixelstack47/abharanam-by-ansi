import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { CollectionInfo } from "@/types";
import { Reveal, ImageReveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

// Catalogue-backed page: always render with live counts from the backend.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Four points of view, one house — Heritage, Modern Muse, Muhurtham Bridal and Everyday Luxe. Explore the Abharanam collections.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const { collections } = await apiGet<{ collections: CollectionInfo[] }>(
    "/api/collections",
  );

  return (
    <div className="pt-24 lg:pt-32">
      <header className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-6 lg:px-10 lg:pb-20">
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">The House</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
          Four points of view, <em className="italic">one</em> house
        </h1>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-20 px-4 pb-28 sm:px-6 lg:space-y-28 lg:px-10">
        {collections.length === 0 && (
          <p className="font-serif text-2xl font-light text-stone">
            New collections are being composed — return soon.
          </p>
        )}
        {collections.map((collection, i) => {
          const flipped = i % 2 === 1;
          return (
            <article
              key={collection.name}
              className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14"
            >
              <ImageReveal
                className={cn("lg:col-span-7", flipped && "lg:order-2")}
              >
                <Link
                  href={`/shop?collection=${encodeURIComponent(collection.name)}`}
                  className="group relative block aspect-[16/10] overflow-hidden bg-champagne/30"
                >
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
                  />
                </Link>
              </ImageReveal>
              <div className={cn("lg:col-span-5", flipped && "lg:order-1")}>
                <Reveal>
                  <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
                    No. 0{i + 1} · {collection.productCount} pieces
                  </p>
                  <h2 className="mt-4 font-serif text-3xl font-light sm:text-4xl lg:text-5xl">
                    {collection.title}
                  </h2>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone">
                    {collection.description}
                  </p>
                  <Link
                    href={`/shop?collection=${encodeURIComponent(collection.name)}`}
                    className="group mt-8 inline-flex items-center gap-3 border-b border-ink pb-1.5 text-[11px] font-medium uppercase tracking-luxe transition-colors hover:border-gold hover:text-gold-dark"
                  >
                    Explore Collection
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1.5"
                    />
                  </Link>
                </Reveal>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
