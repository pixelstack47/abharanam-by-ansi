"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toaster";
import { apiFetch, useApi } from "@/components/admin/use-api";

export default function AdminProductsPage() {
  const { data, loading, error, refetch } = useApi<{
    products: Product[];
    total: number;
  }>("/api/products?limit=500");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [extraProducts, setExtraProducts] = useState<Product[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The backend caps limit at 500 — if the catalogue outgrows one page,
  // fetch the remaining pages so search and counts cover every piece.
  useEffect(() => {
    setExtraProducts([]);
    if (!data || data.products.length >= data.total) return;
    let cancelled = false;
    void (async () => {
      const extra: Product[] = [];
      try {
        for (
          let page = 2;
          data.products.length + extra.length < data.total;
          page++
        ) {
          const next = await apiFetch<{ products: Product[]; total: number }>(
            `/api/products?limit=500&page=${page}`,
          );
          if (cancelled || next.products.length === 0) break;
          extra.push(...next.products);
        }
      } catch {
        // Keep whatever loaded — the table simply shows fewer pieces.
      }
      if (!cancelled) setExtraProducts(extra);
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  // Filter options come from the catalogue itself (categories are DB-managed
  // now, so the static list is gone) — only categories with products show up.
  const categoryOptions = useMemo(() => {
    const names = new Set([...(data?.products ?? []), ...extraProducts].map((p) => p.category));
    return Array.from(names).sort();
  }, [data, extraProducts]);

  const filtered = useMemo(() => {
    const products = [...(data?.products ?? []), ...extraProducts];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [data, extraProducts, search, category]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/products/${pendingDelete.slug}`, {
        method: "DELETE",
      });
      setPendingDelete(null);
      toast.success("Product deleted.");
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not delete the product";
      setActionError(message);
      toast.error(message);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light">Products</h1>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm" variant="gold">
            <Plus size={14} strokeWidth={1.75} /> Add Product
          </Button>
        </Link>
      </header>

      {/* Search + category filter */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, tag or material…"
            aria-label="Search products"
            className="h-11 w-full border border-ink/20 bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="h-11 cursor-pointer border border-ink/20 bg-white px-4 text-sm outline-none transition-colors focus:border-ink sm:w-52"
        >
          <option value="all">All categories</option>
          {categoryOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {(error || actionError) && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError ?? error}
        </p>
      )}

      <p className="mt-4 text-xs uppercase tracking-luxe-sm text-stone">
        {loading && !data
          ? "Loading…"
          : `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`}
      </p>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse bg-champagne/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            No products match — adjust the search or add a new piece.
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]}
                        alt=""
                        className="size-11 shrink-0 border border-line object-cover"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${p.slug}`}
                          className="block truncate font-medium text-ink hover:text-maroon"
                        >
                          {p.name}
                        </Link>
                        <p className="truncate text-[11px] text-stone">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-stone">
                    {p.category}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-stone">
                    {p.material}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <span className="font-semibold tabular-nums">
                      {formatINR(p.price)}
                    </span>
                    {p.compareAtPrice && (
                      <span className="ml-1.5 text-xs text-stone line-through">
                        {formatINR(p.compareAtPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {!p.inStock && (
                        <span className="border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-luxe-sm text-red-700">
                          Sold out
                        </span>
                      )}
                      {p.isNew && (
                        <span className="border border-line bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-luxe-sm text-ivory">
                          New
                        </span>
                      )}
                      {p.isBestseller && (
                        <span className="border border-gold/40 bg-champagne/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-luxe-sm text-gold-dark">
                          Bestseller
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.slug}`}
                        aria-label={`Edit ${p.name}`}
                        className="inline-flex size-8 items-center justify-center text-espresso transition-colors hover:bg-maroon-soft hover:text-maroon"
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        aria-label={`Delete ${p.name}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center text-espresso transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete product?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from the catalogue permanently. Existing orders keep their snapshot of it.`
            : ""
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
