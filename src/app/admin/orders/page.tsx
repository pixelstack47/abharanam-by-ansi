"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { OrderStatus, SerializedOrder } from "@/types";
import { cn, formatINR } from "@/lib/utils";
import { ORDER_STATUSES, StatusBadge } from "@/components/admin/status-badge";
import { apiFetch, useApi } from "@/components/admin/use-api";

const PAGE_SIZE = 20;

type Tab = OrderStatus | "all";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrdersView() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [tab, setTab] = useState<Tab>(
    initialStatus && (ORDER_STATUSES as string[]).includes(initialStatus)
      ? (initialStatus as OrderStatus)
      : "all",
  );
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, OrderStatus>
  >({});
  const [actionError, setActionError] = useState<string | null>(null);

  const query =
    `/api/orders?limit=${PAGE_SIZE}&page=${page}` +
    (tab !== "all" ? `&status=${tab}` : "");
  const { data, loading, error, refetch } = useApi<{
    orders: SerializedOrder[];
    total: number;
  }>(query);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // If the current page emptied out (e.g. a status change moved its last
  // order off this tab), clamp back to the last page that still has rows.
  useEffect(() => {
    if (data && data.orders.length === 0 && page > 1 && data.total > 0) {
      setPage(Math.max(1, Math.min(page, Math.ceil(data.total / PAGE_SIZE))));
    }
  }, [data, page]);

  function selectTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  async function updateStatus(id: string, status: OrderStatus) {
    setSavingId(id);
    setActionError(null);
    try {
      const { order } = await apiFetch<{ order: SerializedOrder }>(
        `/api/orders/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      // Show the saved status immediately — the refetch below only refreshes
      // the list and totals, and may fail without undoing the PATCH.
      setStatusOverrides((prev) => ({ ...prev, [id]: order.status }));
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update the order",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          Fulfilment
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light">Orders</h1>
      </header>

      {/* Status tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
        {(["all", ...ORDER_STATUSES] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectTab(t)}
            className={cn(
              "-mb-px cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-medium uppercase tracking-luxe-sm transition-colors",
              tab === t
                ? "border-maroon text-maroon"
                : "border-transparent text-stone hover:text-espresso",
            )}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError ?? error}
        </p>
      )}

      <p className="mt-5 text-xs uppercase tracking-luxe-sm text-stone">
        {loading && !data
          ? "Loading…"
          : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "order" : "orders"}`}
      </p>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse bg-champagne/30" />
            ))}
          </div>
        ) : !data || data.orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            No {tab !== "all" ? `${tab} ` : ""}orders yet.
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">View</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                return (
                  <tr
                    key={order.id}
                    className="border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-maroon hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-stone">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <p>{order.customer.name}</p>
                      <p className="text-[11px] text-stone">
                        {order.customer.phone}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-stone">
                      {itemCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={statusOverrides[order.id] ?? order.status}
                        disabled={savingId === order.id}
                        onChange={(e) =>
                          void updateStatus(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                        aria-label={`Status of ${order.orderNumber}`}
                        className="h-8 cursor-pointer border border-ink/20 bg-white px-2 text-xs capitalize outline-none transition-colors focus:border-ink disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          aria-label={`View ${order.orderNumber}`}
                          className="inline-flex size-8 items-center justify-center text-espresso transition-colors hover:bg-maroon-soft hover:text-maroon"
                        >
                          <Eye size={15} strokeWidth={1.5} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
    </div>
  );
}

export default function AdminOrdersPage() {
  // useSearchParams (for ?status= deep links) must sit inside Suspense.
  return (
    <Suspense fallback={null}>
      <OrdersView />
    </Suspense>
  );
}
