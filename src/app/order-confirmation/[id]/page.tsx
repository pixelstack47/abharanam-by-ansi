import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import type { OrderStatus, SerializedOrder } from "@/types";
import { apiGetOrNull } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { WhatsAppButton } from "./whatsapp-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Your Abharanam order details.",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-violet-200 bg-violet-50 text-violet-700",
  delivered: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await apiGetOrNull<{ order: SerializedOrder; whatsappUrl: string }>(
    `/api/orders/${id}`,
  );
  if (!data) notFound();
  const { order, whatsappUrl } = data;

  const firstName = order.customer.name.split(" ")[0];
  const placedOn = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-24 sm:px-6 lg:pt-32">
      {/* ——— Header ——— */}
      <header className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
          <CircleCheck size={28} strokeWidth={1.25} />
        </span>
        <p className="mt-6 text-[11px] uppercase tracking-luxe text-gold-dark">
          Order Placed
        </p>
        <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
          Thank you, <em className="italic">{firstName}</em>
        </h1>
        <p className="mt-4 text-sm text-stone">
          Order <span className="font-medium text-ink">{order.orderNumber}</span> ·{" "}
          {placedOn}
        </p>
        <span
          className={cn(
            "mt-4 inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-luxe-sm",
            STATUS_STYLES[order.status],
          )}
        >
          {order.status}
        </span>
      </header>

      {/* ——— Summary card ——— */}
      <div className="mt-12 border border-line bg-cream p-6 sm:p-8">
        <h2 className="font-serif text-2xl">
          Your Order{" "}
          <span className="text-sm text-stone">
            ({order.items.length} {order.items.length === 1 ? "item" : "items"})
          </span>
        </h2>

        <ul className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.slug} className="flex items-center gap-4 py-4">
              <Link
                href={`/product/${item.slug}`}
                className="relative block h-20 w-16 shrink-0 overflow-hidden bg-champagne/30"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </Link>
              <div className="flex-1">
                <Link
                  href={`/product/${item.slug}`}
                  className="font-serif text-[15px] leading-snug hover:text-gold-dark"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-xs text-stone">
                  {formatINR(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">
                {formatINR(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-2.5 border-t border-line pt-5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-stone">Subtotal</dt>
            <dd className="font-medium">{formatINR(order.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone">Shipping</dt>
            <dd
              className={cn(
                "font-medium",
                order.shippingFee === 0 && "text-gold-dark",
              )}
            >
              {order.shippingFee === 0 ? "Free" : formatINR(order.shippingFee)}
            </dd>
          </div>
          <div className="hairline my-2" aria-hidden />
          <div className="flex items-baseline justify-between">
            <dt className="text-xs uppercase tracking-luxe-sm text-stone">Total</dt>
            <dd className="font-serif text-3xl">{formatINR(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-6 border-t border-line pt-6 text-sm sm:grid-cols-2">
          <div>
            <h3 className="text-[11px] uppercase tracking-luxe-sm text-stone">
              Delivering To
            </h3>
            <address className="mt-2 not-italic leading-relaxed text-espresso">
              {order.customer.name}
              <br />
              {order.customer.address.line1}
              {order.customer.address.line2 && (
                <>
                  <br />
                  {order.customer.address.line2}
                </>
              )}
              <br />
              {order.customer.address.city}, {order.customer.address.state} —{" "}
              {order.customer.address.pincode}
            </address>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-luxe-sm text-stone">Contact</h3>
            <p className="mt-2 leading-relaxed text-espresso">
              {order.customer.phone}
              {order.customer.email && (
                <>
                  <br />
                  {order.customer.email}
                </>
              )}
            </p>
            {order.note && (
              <>
                <h3 className="mt-4 text-[11px] uppercase tracking-luxe-sm text-stone">
                  Note
                </h3>
                <p className="mt-2 leading-relaxed text-espresso">{order.note}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ——— Actions ——— */}
      <div className="mt-10 flex flex-col items-center text-center">
        <WhatsAppButton url={whatsappUrl} />
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-stone">
          No online payment — your order is confirmed on WhatsApp. If the chat
          didn’t open automatically, tap the button above.
        </p>
        <Link
          href="/shop"
          className="mt-8 text-xs uppercase tracking-luxe-sm text-espresso underline underline-offset-4 hover:text-ink"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
