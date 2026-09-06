"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-svh min-h-[620px] overflow-hidden bg-ink">
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0 scale-110"
        style={reduce ? undefined : { y: imageY }}
      >
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
        >
          <Image
            src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=2200&auto=format&fit=crop"
            alt="Model wearing Abharanam fine jewellery"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        {/* Scrim is weighted to keep the centred copy legible over any crop of the photo. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/45" />
      </motion.div>

      {/* Floating light accents */}
      {!reduce && (
        <>
          <div className="animate-float absolute left-[12%] top-[28%] size-2 rounded-full bg-gold-light/60 blur-[1px]" />
          <div
            className="animate-float absolute right-[18%] top-[36%] size-3 rounded-full bg-champagne/40 blur-[2px]"
            style={{ animationDelay: "-2.5s" }}
          />
          <div
            className="animate-float absolute bottom-[30%] left-[24%] size-1.5 rounded-full bg-gold/50 blur-[1px]"
            style={{ animationDelay: "-4s" }}
          />
        </>
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-ivory"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: EASE }}
          className="text-[11px] font-medium uppercase tracking-luxe text-champagne"
        >
          Est. 2024 · Crafted in India
        </motion.p>

        <h1 className="mt-6 font-serif text-[13vw] font-light uppercase leading-[0.95] tracking-[0.06em] sm:text-6xl lg:text-8xl">
          {["Jewellery that", "tells your story"].map((line, i) => (
            <span key={line} className="block overflow-hidden py-1">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 1.1, ease: EASE }}
              >
                {i === 1 ? (
                  <>
                    tells <em className="font-light italic text-gold-light">your</em> story
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 1, ease: EASE }}
          className="mt-6 max-w-md text-sm leading-relaxed text-ivory sm:text-base"
        >
          Timeless craftsmanship. Contemporary elegance.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 1, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          <Magnetic>
            <Link href="/shop">
              <Button variant="light" size="lg" className="min-w-52">
                Shop Collection
              </Button>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/shop?sort=newest">
              <Button
                variant="outline"
                size="lg"
                className="min-w-52 border-ivory/50 text-ivory hover:bg-ivory hover:text-ink"
              >
                Explore New Arrivals
              </Button>
            </Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <div className="flex flex-col items-center gap-2 text-ivory/60">
          <span className="text-[10px] uppercase tracking-luxe">Scroll</span>
          <motion.span
            className="block h-10 w-px bg-gradient-to-b from-ivory/70 to-transparent"
            animate={reduce ? undefined : { scaleY: [1, 0.4, 1], originY: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
