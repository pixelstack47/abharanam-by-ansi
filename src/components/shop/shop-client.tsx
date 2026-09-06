"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { CATEGORIES, COLLECTIONS, MATERIALS, PRICE_RANGES } from "@/data/site";
import type { Product, SortOption } from "@/types";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/products/product-card";
import { Rating } from "@/components/ui/rating";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
  "best-selling": "Best Selling",
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ShopClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterTrapRef = useFocusTrap<HTMLDivElement>(mobileFiltersOpen);

  // — All filter state lives in the URL, so nav links and sharing both work. —
  const selected = useMemo(
    () => ({
      categories: searchParams.getAll("category"),
      collections: searchParams.getAll("collection"),
      materials: searchParams.getAll("material"),
      prices: searchParams.getAll("price").map(Number).filter(Number.isInteger),
      inStockOnly: searchParams.get("stock") === "in",
      minRating: Number(searchParams.get("rating")) || 0,
      sort: (searchParams.get("sort") as SortOption) || "featured",
    }),
    [searchParams],
  );

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setMulti = (key: string, values: string[]) =>
    updateParams((p) => {
      p.delete(key);
      values.forEach((v) => p.append(key, v));
    });

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selected.categories.length && !selected.categories.includes(p.category))
        return false;
      if (selected.collections.length && !selected.collections.includes(p.collection))
        return false;
      if (selected.materials.length && !selected.materials.includes(p.material))
        return false;
      if (selected.prices.length) {
        const inRange = selected.prices.some((i) => {
          const range = PRICE_RANGES[i];
          return range && p.price >= range.min && p.price <= range.max;
        });
        if (!inRange) return false;
      }
      if (selected.inStockOnly && !p.inStock) return false;
      if (selected.minRating && p.rating < selected.minRating) return false;
      return true;
    });

    switch (selected.sort) {
      case "newest":
        list = [...list.filter((p) => p.isNew), ...list.filter((p) => !p.isNew)];
        break;
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "best-selling":
        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        list = [...list].sort(
          (a, b) => Number(b.isBestseller ?? false) - Number(a.isBestseller ?? false),
        );
    }
    return list;
  }, [products, selected]);

  const activeFilterCount =
    selected.categories.length +
    selected.collections.length +
    selected.materials.length +
    selected.prices.length +
    (selected.inStockOnly ? 1 : 0) +
    (selected.minRating ? 1 : 0);

  const clearAll = () =>
    updateParams((p) => {
      ["category", "collection", "material", "price", "stock", "rating"].forEach((k) =>
        p.delete(k),
      );
    });

  const filterPanel = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        {CATEGORIES.map((c) => (
          <FilterCheckbox
            key={c.name}
            label={c.name}
            checked={selected.categories.includes(c.name)}
            onChange={() =>
              setMulti("category", toggleValue(selected.categories, c.name))
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {PRICE_RANGES.map((range, i) => (
          <FilterCheckbox
            key={range.label}
            label={range.label}
            checked={selected.prices.includes(i)}
            onChange={() =>
              setMulti(
                "price",
                toggleValue(selected.prices.map(String), String(i)),
              )
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Material">
        {MATERIALS.map((m) => (
          <FilterCheckbox
            key={m}
            label={m}
            checked={selected.materials.includes(m)}
            onChange={() => setMulti("material", toggleValue(selected.materials, m))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Collection">
        {COLLECTIONS.map((c) => (
          <FilterCheckbox
            key={c.name}
            label={c.name}
            checked={selected.collections.includes(c.name)}
            onChange={() =>
              setMulti("collection", toggleValue(selected.collections, c.name))
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <FilterCheckbox
          label="In stock only"
          checked={selected.inStockOnly}
          onChange={() =>
            updateParams((p) =>
              selected.inStockOnly ? p.delete("stock") : p.set("stock", "in"),
            )
          }
        />
      </FilterGroup>

      <FilterGroup title="Rating">
        {[4.5, 4.7, 4.9].map((r) => (
          <label
            key={r}
            className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-espresso"
          >
            <input
              type="radio"
              name="rating"
              checked={selected.minRating === r}
              onChange={() => updateParams((p) => p.set("rating", String(r)))}
              className="size-3.5 accent-[#b0862f]"
            />
            <Rating value={5} size={11} />
            <span className="text-xs text-stone">{r} & up</span>
          </label>
        ))}
        {selected.minRating > 0 && (
          <button
            onClick={() => updateParams((p) => p.delete("rating"))}
            className="mt-1 text-xs text-stone underline underline-offset-2 hover:text-ink"
          >
            Clear rating
          </button>
        )}
      </FilterGroup>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full border border-ink/30 py-2.5 text-[11px] font-medium uppercase tracking-luxe-sm transition-colors hover:bg-ink hover:text-ivory"
        >
          Clear All ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-10">
      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 flex items-center justify-between gap-3 border-b border-line bg-ivory/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-2 lg:backdrop-blur-none">
        <p className="text-xs uppercase tracking-luxe-sm text-stone">
          {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 border border-line bg-cream px-4 py-2.5 text-[11px] font-medium uppercase tracking-luxe-sm lg:hidden"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-gold-dark text-[9px] font-semibold text-ivory">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="inline-flex items-center gap-2 border border-line bg-cream px-4 py-2.5 text-[11px] font-medium uppercase tracking-luxe-sm"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              {SORT_LABELS[selected.sort] ?? "Featured"}
              <ChevronDown
                size={14}
                className={cn("transition-transform", sortOpen && "rotate-180")}
              />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full z-40 mt-1 w-52 border border-line bg-cream shadow-lg"
                  role="listbox"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <li key={option}>
                      <button
                        role="option"
                        aria-selected={selected.sort === option}
                        onClick={() => {
                          updateParams((p) =>
                            option === "featured"
                              ? p.delete("sort")
                              : p.set("sort", option),
                          );
                          setSortOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-champagne/40",
                          selected.sort === option
                            ? "font-semibold text-gold-dark"
                            : "text-espresso",
                        )}
                      >
                        {SORT_LABELS[option]}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8 pr-3">
            {filterPanel}
          </div>
        </aside>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-serif text-3xl font-light">Nothing matches — yet</p>
            <p className="mt-3 max-w-xs text-sm text-stone">
              Try removing a filter or two. Beautiful things rarely fit in narrow boxes.
            </p>
            <button
              onClick={clearAll}
              className="mt-7 border border-ink px-8 py-3 text-[11px] font-medium uppercase tracking-luxe-sm transition-colors hover:bg-ink hover:text-ivory"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((product: Product, i) => (
              <motion.div
                key={product.slug}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.03, 0.25) }}
              >
                <ProductCard product={product} showRating priority={i < 3} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.button
              aria-label="Close filters"
              className="fixed inset-0 z-50 bg-ink/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              ref={filterTrapRef}
              tabIndex={-1}
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-cream outline-none lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <p className="font-serif text-xl">Filters</p>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-full hover:bg-ink/5"
                  aria-label="Close filters"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">{filterPanel}</div>
              <div className="border-t border-line p-5">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-ink py-3.5 text-[11px] font-medium uppercase tracking-luxe-sm text-ivory"
                >
                  Show {filtered.length} {filtered.length === 1 ? "Piece" : "Pieces"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-luxe text-ink">
        {title}
      </legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-espresso transition-colors hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-[#b0862f]"
      />
      {label}
    </label>
  );
}
