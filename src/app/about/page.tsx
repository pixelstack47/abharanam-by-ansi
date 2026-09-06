import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gem, HandHeart, Leaf, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, ImageReveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Abharanam is a modern luxury jewellery house — designed in our studio, hand-finished, and made to be lived in. Read our story.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    Icon: Gem,
    title: "Craft first",
    body: "Every piece passes through at least six pairs of hands before it reaches yours — cast, set, polished, sealed, inspected and packed.",
  },
  {
    Icon: HandHeart,
    title: "Honest luxury",
    body: "Premium finishes at honest prices. We design in-house and sell directly to you, so nothing is spent on middlemen — only on the piece.",
  },
  {
    Icon: Leaf,
    title: "Made to last",
    body: "Our anti-tarnish pieces carry a shine guarantee. Jewellery should be lived in, not locked away — we build for years, not seasons.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 lg:pt-32">
      {/* Intro */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Our Story</p>
            <h1 className="mt-4 font-serif text-4xl font-light leading-[1.12] sm:text-5xl lg:text-7xl">
              The art of
              <br />
              <em className="italic text-gold-dark">timeless</em> beauty
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-stone lg:text-lg">
              Abharanam began with a simple belief: that jewellery worthy of your
              biggest moments should also survive your everyday ones. From a small
              studio in Kerala, we design pieces that carry the weight of Indian
              craft heritage with the ease of modern life.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Image band */}
      <section className="mx-auto mt-16 grid max-w-[1440px] grid-cols-12 gap-4 px-4 sm:px-6 lg:mt-24 lg:gap-6 lg:px-10">
        <ImageReveal className="col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden bg-champagne/30">
            <Image
              src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=1600&auto=format&fit=crop"
              alt="Abharanam jewellery being worn"
              fill
              sizes="(max-width: 1024px) 60vw, 58vw"
              className="object-cover"
            />
          </div>
        </ImageReveal>
        <ImageReveal delay={0.15} className="col-span-5 self-end">
          <div className="relative aspect-[3/4] overflow-hidden bg-champagne/30">
            <Image
              src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1200&auto=format&fit=crop"
              alt="Hand-finishing detail work in the Abharanam studio"
              fill
              sizes="(max-width: 1024px) 40vw, 38vw"
              className="object-cover"
            />
          </div>
        </ImageReveal>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="grid gap-10 md:grid-cols-3 lg:gap-14">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.1}>
              <value.Icon size={28} strokeWidth={1} className="text-gold-dark" />
              <h2 className="mt-5 font-serif text-2xl font-light">{value.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone">{value.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Care & contact */}
      <section id="care" className="border-t border-line bg-cream py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
              Shipping, Returns & Care
            </p>
            <h2 className="mt-4 font-serif text-3xl font-light sm:text-4xl">
              Looked after, <em className="italic">always</em>
            </h2>
            <dl className="mt-8 space-y-6 text-sm leading-relaxed text-stone">
              <div>
                <dt className="font-medium uppercase tracking-luxe-sm text-ink">
                  Shipping & Delivery
                </dt>
                <dd className="mt-1.5">
                  Free shipping above ₹1,999. Dispatch within 48 hours; delivery in 2–5
                  business days across India. Cash on delivery available.
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-luxe-sm text-ink">
                  Returns & Exchanges
                </dt>
                <dd className="mt-1.5">
                  7-day easy returns with doorstep pickup. Bridal sets include a
                  complimentary pre-wedding polish and check.
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-luxe-sm text-ink">
                  Jewellery Care
                </dt>
                <dd className="mt-1.5">
                  Store pieces in their pouch, away from sunlight and perfume.
                  Anti-tarnish pieces are waterproof; all others prefer to stay dry.
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.15}>
            <div id="contact" className="border border-line bg-ivory p-8 lg:p-12">
              <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
                Contact Us
              </p>
              <h2 className="mt-4 font-serif text-3xl font-light">
                We’d love to <em className="italic">hear</em> from you
              </h2>
              <ul className="mt-8 space-y-5 text-sm text-stone">
                <li className="flex items-center gap-3.5">
                  <Mail size={17} strokeWidth={1.5} className="text-gold-dark" />
                  care@abharanam.example.com
                </li>
                <li className="flex items-center gap-3.5">
                  <Phone size={17} strokeWidth={1.5} className="text-gold-dark" />
                  +91 98470 00000 (Mon–Sat, 10am–6pm)
                </li>
                <li className="flex items-center gap-3.5">
                  <MapPin size={17} strokeWidth={1.5} className="text-gold-dark" />
                  Studio Abharanam, Kochi, Kerala, India
                </li>
              </ul>
              <Link href="/shop" className="mt-10 inline-block">
                <Button>Shop the Collection</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
