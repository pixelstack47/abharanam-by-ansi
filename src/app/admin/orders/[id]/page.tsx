"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Printer } from "lucide-react";
import type { OrderStatus, SerializedOrder } from "@/types";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUSES, StatusBadge } from "@/components/admin/status-badge";
import { apiFetch, useApi } from "@/components/admin/use-api";

/** wa.me link to the CUSTOMER's phone — prefix 91 for bare 10-digit numbers. */
function customerWhatsAppUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: params is a Promise — unwrap with use() in this client page.
  const { id } = use(params);
  const { data, loading, error, refetch } = useApi<{
    order: SerializedOrder;
    whatsappUrl: string;
  }>(`/api/orders/${id}`);

  const [saving, setSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState<SerializedOrder | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function updateStatus(status: OrderStatus) {
    setSaving(true);
    setActionError(null);
    try {
      const { order } = await apiFetch<{ order: SerializedOrder }>(
        `/api/orders/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      // Show the saved order immediately — the refetch below may fail
      // without undoing the PATCH.
      setSavedOrder(order);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update the order",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse bg-champagne/40" />
        <div className="h-64 animate-pulse border border-line bg-champagne/20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxe-sm text-stone transition-colors hover:text-maroon"
        >
          <ArrowLeft size={13} strokeWidth={1.5} /> Orders
        </Link>
        <div className="mt-6 border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="text-sm text-red-700">{error ?? "Order not found."}</p>
        </div>
      </div>
    );
  }

  const order = savedOrder ?? data.order;
  const { customer } = order;

  return (
    <div>
      <div className="print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxe-sm text-stone transition-colors hover:text-maroon"
        >
          <ArrowLeft size={13} strokeWidth={1.5} /> Orders
        </Link>
      </div>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
            Abharanam — Order
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl font-light">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-xs text-stone">
            Placed {formatDateTime(order.createdAt)}
            {order.updatedAt !== order.createdAt &&
              ` · Updated ${formatDateTime(order.updatedAt)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center gap-2 border border-line bg-white px-4 py-2.5 text-xs uppercase tracking-luxe-sm text-espresso transition-colors hover:border-sand print:hidden"
        >
          <Printer size={14} strokeWidth={1.5} /> Print
        </button>
      </header>

      {actionError && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
          {actionError}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* ——— Items + totals ——— */}
        <section className="border border-line bg-white lg:col-span-2">
          <h2 className="border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-luxe-sm text-stone">
            Items
          </h2>
          <ul>
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.slug}`}
                className="flex items-center gap-4 border-b border-line/70 px-5 py-3 last:border-b-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  className="size-14 shrink-0 border border-line object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="block truncate text-sm font-medium text-ink hover:text-maroon"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-stone">
                    {formatINR(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatINR(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line bg-cream/60 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone">Shipping</dt>
              <dd className="tabular-nums">
                {order.shippingFee === 0 ? (
                  <span className="text-green-700">Free</span>
                ) : (
                  formatINR(order.shippingFee)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-semibold tabular-nums">
                {formatINR(order.total)}
              </dd>
            </div>
          </dl>
        </section>

        {/* ——— Customer + status ——— */}
        <div className="space-y-6">
          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-luxe-sm text-stone">
              Customer
            </h2>
            <div className="px-5 py-4 text-sm">
              <p className="font-medium">{customer.name}</p>
              <p className="mt-1 text-stone">{customer.phone}</p>
              {customer.email && <p className="text-stone">{customer.email}</p>}
              <address className="mt-3 border-t border-line/70 pt-3 not-italic leading-relaxed text-stone">
                {customer.address.line1}
                {customer.address.line2 && (
                  <>
                    <br />
                    {customer.address.line2}
                  </>
                )}
                <br />
                {customer.address.city}, {customer.address.state} —{" "}
                {customer.address.pincode}
              </address>
              {order.note && (
                <p className="mt-3 border-t border-line/70 pt-3 text-stone">
                  <span className="text-[10px] uppercase tracking-luxe-sm">
                    Note
                  </span>
                  <br />
                  {order.note}
                </p>
              )}
              <a
                href={customerWhatsAppUrl(customer.phone)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-green-700 px-4 py-2.5 text-xs font-medium uppercase tracking-luxe-sm text-ivory transition-colors hover:bg-green-800 print:hidden"
              >
                <MessageCircle size={14} strokeWidth={1.5} />
                WhatsApp Customer
              </a>
            </div>
          </section>

          <section className="border border-line bg-white print:hidden">
            <h2 className="border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-luxe-sm text-stone">
              Update status
            </h2>
            <div className="px-5 py-4">
              <select
                value={order.status}
                disabled={saving}
                onChange={(e) => void updateStatus(e.target.value as OrderStatus)}
                aria-label="Order status"
                className="h-11 w-full cursor-pointer border border-ink/20 bg-white px-4 text-sm capitalize outline-none transition-colors focus:border-ink disabled:opacity-50"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] leading-relaxed text-stone">
                {saving
                  ? "Saving…"
                  : "Changes apply immediately and show on the customer's order page."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
