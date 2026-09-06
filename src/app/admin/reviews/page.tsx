"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import type { SerializedReview } from "@/types";
import { Rating } from "@/components/ui/rating";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { apiFetch, useApi } from "@/components/admin/use-api";

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<SerializedReview | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce the search box into the server-side ?search= param.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const url =
    `/api/admin/reviews?limit=${PAGE_SIZE}&page=${page}` +
    (query ? `&search=${encodeURIComponent(query)}` : "");
  const { data, loading, error, refetch } = useApi<{
    reviews: SerializedReview[];
    total: number;
  }>(url);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // If the current page emptied out (e.g. the last review on it was deleted),
  // clamp back to the last page that still has rows.
  useEffect(() => {
    if (data && data.reviews.length === 0 && page > 1 && data.total > 0) {
      setPage(Math.max(1, Math.min(page, Math.ceil(data.total / PAGE_SIZE))));
    }
  }, [data, page]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/admin/reviews/${pendingDelete.id}`, {
        method: "DELETE",
      });
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete the review",
      );
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          Community
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light">Reviews</h1>
      </header>

      <label className="relative mt-8 block">
        <Search
          size={15}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product or reviewer…"
          aria-label="Search reviews"
          className="h-11 w-full border border-ink/20 bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
        />
      </label>

      {(error || actionError) && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError ?? error}
        </p>
      )}

      <p className="mt-4 text-xs uppercase tracking-luxe-sm text-stone">
        {loading && !data
          ? "Loading…"
          : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "review" : "reviews"}`}
      </p>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse bg-champagne/30" />
            ))}
          </div>
        ) : !data || data.reviews.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            No reviews found{query ? ` for “${query}”` : ""}.
          </p>
        ) : (
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Reviewer</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 align-top text-stone">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="max-w-48 px-4 py-2.5 align-top">
                    {r.productSlug ? (
                      <Link
                        href={`/product/${r.productSlug}`}
                        className="font-medium text-espresso underline-offset-4 hover:text-maroon hover:underline"
                        title="Open product page"
                      >
                        {r.productName ?? r.productSlug}
                      </Link>
                    ) : (
                      <span className="text-stone">
                        {r.productName ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="max-w-44 px-4 py-2.5 align-top">
                    <p className="truncate font-medium">{r.name}</p>
                    {r.verified && (
                      <span className="mt-1 inline-flex items-center gap-1 border border-gold/40 bg-champagne/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-luxe-sm text-gold-dark">
                        <BadgeCheck size={10} strokeWidth={1.75} />
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 align-top">
                    <Rating value={r.rating} size={11} />
                  </td>
                  <td className="max-w-md px-4 py-2.5 align-top">
                    {r.title && (
                      <p className="truncate font-medium">{r.title}</p>
                    )}
                    <p className="line-clamp-2 text-xs leading-relaxed text-stone">
                      {r.body}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPendingDelete(r)}
                        title="Delete review"
                        aria-label={`Delete review by ${r.name}`}
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

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex cursor-pointer items-center gap-1 border border-line bg-white px-3 py-2 text-xs uppercase tracking-luxe-sm text-espresso transition-colors hover:border-sand disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={13} strokeWidth={1.5} /> Prev
          </button>
          <p className="text-xs text-stone">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex cursor-pointer items-center gap-1 border border-line bg-white px-3 py-2 text-xs uppercase tracking-luxe-sm text-espresso transition-colors hover:border-sand disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete review?"
        message={
          pendingDelete
            ? `${pendingDelete.name}'s ${pendingDelete.rating}-star review${
                pendingDelete.productName
                  ? ` of ${pendingDelete.productName}`
                  : ""
              } will be removed permanently and the product's rating re-calculated.`
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
