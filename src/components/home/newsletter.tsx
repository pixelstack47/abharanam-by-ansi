"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubscribed(true);
  };

  return (
    <section className="border-t border-line bg-maroon-soft py-24 lg:py-32">
      <div className="mx-auto max-w-xl px-6 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
            Join the Inner Circle
          </p>
          <h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">
            Beauty, <em className="italic">first</em> to your inbox
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-stone">
            Be the first to discover new collections, private previews and
            exclusive offers.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          {subscribed ? (
            <p className="mt-9 inline-flex items-center gap-2.5 border border-gold/40 bg-champagne/30 px-6 py-4 text-sm text-gold-dark">
              <Check size={16} /> Welcome to the inner circle. Watch your inbox.
            </p>
          ) : (
            <form
              onSubmit={submit}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-0"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="h-13 flex-1 border border-ink/25 bg-transparent px-5 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink sm:border-r-0"
              />
              <Button type="submit" size="lg">
                Subscribe
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
