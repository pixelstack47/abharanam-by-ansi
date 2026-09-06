"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { POPULAR_SEARCHES } from "@/data/site";
import { useStore } from "@/lib/store";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatINR } from "@/lib/utils";

export function SearchOverlay() {
  const {
    searchOpen,
    setSearchOpen,
    recentSearches,
    addRecentSearch,
    products,
    categories,
  } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(searchOpen);

  // Clearing on close keeps the input empty for the next open.
  const close = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, [setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      // Focus after the entrance animation begins.
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) =>
        [p.name, p.category, p.material, p.collection, ...p.tags]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [query, products]);

  const commitSearch = (term: string) => {
    addRecentSearch(term);
    close();
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          ref={trapRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 overflow-y-auto bg-ivory outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="mx-auto max-w-3xl px-6 pb-24 pt-8 lg:pt-14">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-luxe text-stone">Search Abharanam</p>
              <button
                onClick={close}
                className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-ink/5"
                aria-label="Close search"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 flex items-center gap-4 border-b-2 border-ink pb-4"
            >
              <Search size={26} strokeWidth={1.25} className="shrink-0 text-stone" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) commitSearch(query);
                }}
                placeholder="Search for necklaces, jhumkas, bridal sets…"
                className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-stone/50 lg:text-3xl"
                aria-label="Search products"
              />
            </motion.div>

            {query.trim() === "" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-10 space-y-10"
              >
                {recentSearches.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-[11px] uppercase tracking-luxe text-stone">
                      <Clock size={13} /> Recent
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="border border-line bg-cream px-4 py-2 text-sm text-espresso transition-colors hover:border-gold hover:text-gold-dark"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">
                    Popular Searches
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="border border-line bg-cream px-4 py-2 text-sm text-espresso transition-colors hover:border-gold hover:text-gold-dark"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {categories.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-luxe text-stone">
                      Browse Categories
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                      {categories.slice(0, 6).map((c) => (
                        <Link
                          key={c.name}
                          href={`/shop?category=${encodeURIComponent(c.name)}`}
                          onClick={() => commitSearch(c.name)}
                          className="group flex items-center justify-between border-b border-line py-3 font-serif text-lg transition-colors hover:text-gold-dark"
                        >
                          {c.name}
                          <ArrowUpRight
                            size={16}
                            className="text-sand transition-all group-hover:translate-x-0.5 group-hover:text-gold"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="mt-8">
                <p className="text-[11px] uppercase tracking-luxe text-stone">
                  {results.length > 0
                    ? `${results.length} result${results.length === 1 ? "" : "s"}`
                    : "No results found"}
                </p>
                {results.length === 0 ? (
                  <p className="mt-6 font-serif text-xl text-stone">
                    Nothing matches “{query}”. Try “pearl”, “choker” or “bridal”.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {results.map((p, i) => (
                      <motion.li
                        key={p.slug}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                      >
                        <Link
                          href={`/product/${p.slug}`}
                          onClick={() => commitSearch(query)}
                          className="group flex items-center gap-5 py-4"
                        >
                          <span className="relative block h-20 w-16 shrink-0 overflow-hidden bg-champagne/30">
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </span>
                          <span className="flex-1">
                            <span className="block font-serif text-lg leading-snug group-hover:text-gold-dark">
                              {p.name}
                            </span>
                            <span className="mt-0.5 block text-xs uppercase tracking-luxe-sm text-stone">
                              {p.category}
                            </span>
                          </span>
                          <span className="text-sm font-medium">{formatINR(p.price)}</span>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
