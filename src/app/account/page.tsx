"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useStore } from "@/lib/store";
import { cn, formatINR } from "@/lib/utils";
import type { OrderStatus, SerializedOrder } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-violet-200 bg-violet-50 text-violet-700",
  delivered: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[10px] font-medium uppercase tracking-luxe-sm",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrderRow({ order }: { order: SerializedOrder }) {
  const itemCount = order.items.reduce((n, item) => n + item.quantity, 0);
  const thumbs = order.items.slice(0, 3);
  const extra = order.items.length - thumbs.length;

  return (
    <li className="border border-line bg-cream">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-medium tracking-wide">{order.orderNumber}</p>
          <p className="mt-0.5 text-xs text-stone">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          {thumbs.map((item, i) => (
            <span
              key={`${item.productId}-${i}`}
              className="relative block h-16 w-13 shrink-0 overflow-hidden bg-champagne/30"
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="52px"
                  className="object-cover"
                />
              )}
            </span>
          ))}
          {extra > 0 && (
            <span className="flex h-16 w-13 shrink-0 items-center justify-center bg-champagne/30 text-xs text-espresso">
              +{extra}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-stone">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <p className="mt-0.5 font-serif text-xl">{formatINR(order.total)}</p>
        </div>
      </div>

      <Link
        href={`/order-confirmation/${order.id}`}
        className="flex items-center justify-between border-t border-line px-5 py-3 text-[11px] uppercase tracking-luxe-sm text-espresso transition-colors hover:bg-maroon-soft hover:text-ink"
      >
        View Order
        <ChevronRight size={14} strokeWidth={1.5} />
      </Link>
    </li>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, userLoaded, logout } = useStore();

  const [orders, setOrders] = useState<SerializedOrder[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Client-side guard — the backend API remains the real security boundary.
  // Skipped while signing out so logout lands on the home page, not /login.
  useEffect(() => {
    if (userLoaded && !user && !signingOut) router.replace("/login?next=/account");
  }, [userLoaded, user, signingOut, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { orders: SerializedOrder[] }) => {
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrdersError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onLogout() {
    setSigningOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  if (!userLoaded || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="animate-pulse text-[11px] uppercase tracking-luxe text-stone">
          Loading your account
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-6 lg:pt-36">
      <Reveal>
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Your Space</p>
        <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
          My <em className="italic">Account</em>
        </h1>
      </Reveal>

      {/* Profile card */}
      <Reveal delay={0.1}>
        <div className="mt-10 border border-line bg-cream px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
                <UserRound size={22} strokeWidth={1.25} />
              </span>
              <div>
                <p className="font-serif text-2xl leading-tight">{user.name}</p>
                <p className="mt-0.5 text-sm text-stone">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              disabled={signingOut}
            >
              <LogOut size={13} strokeWidth={1.5} />
              {signingOut ? "Signing Out…" : "Sign Out"}
            </Button>
          </div>

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[11px] uppercase tracking-luxe-sm text-espresso transition-colors hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard size={14} strokeWidth={1.5} />
                Admin Dashboard
              </span>
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </Reveal>

      {/* Order history */}
      <Reveal delay={0.18}>
        <div className="mt-14 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-light">
            Order <em className="italic">History</em>
          </h2>
          {orders && orders.length > 0 && (
            <p className="text-xs text-stone">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
          )}
        </div>
        <div className="hairline mt-4" />

        {ordersError ? (
          <p className="mt-8 text-sm text-stone">
            We couldn’t load your orders just now. Please refresh the page to try
            again.
          </p>
        ) : orders === null ? (
          <div className="mt-8 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse border border-line bg-cream" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-5 border border-line bg-cream px-8 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
              <Package size={26} strokeWidth={1.25} />
            </span>
            <div>
              <p className="font-serif text-2xl">No orders yet</p>
              <p className="mt-2 text-sm text-stone">
                When you place an order, it will appear here.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="outline">Shop Collection</Button>
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
