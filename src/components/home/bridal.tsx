"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Magnetic } from "@/components/ui/magnetic";

export function BridalSection() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[620px] items-center overflow-hidden bg-maroon-deep py-24 text-ivory lg:min-h-[720px]"
    >
      <motion.div
        className="absolute inset-0 scale-[1.18]"
        style={reduce ? undefined : { y }}
      >
        <Image
          src="https://images.unsplash.com/photo-1583937443566-6fe1a1c6e400?q=80&w=2000&auto=format&fit=crop"
          alt="Bride wearing the Muhurtham bridal parure"
          fill
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-deep/92 via-maroon-deep/55 to-maroon-deep/30" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 lg:px-10">
        <div className="max-w-xl">
          <Reveal>
            <p className="text-[11px] uppercase tracking-luxe text-gold-light">
              Muhurtham Bridal
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 font-serif text-4xl font-light uppercase leading-[1.1] tracking-[0.04em] sm:text-5xl lg:text-6xl">
              For your most
              <br />
              <em className="italic normal-case text-champagne">beautiful</em>
              <br />
              beginning
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ivory/70">
              Parures composed under veil lighting and engineered to move as one —
              necklace, chandeliers and maang tikka in a single, breathtaking
              composition.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10">
              <Magnetic>
                <Link href="/shop?category=Bridal">
                  <Button variant="light" size="lg" className="min-w-56">
                    Explore Bridal
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
