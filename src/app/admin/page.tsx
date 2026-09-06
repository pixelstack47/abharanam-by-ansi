"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { OrderStatus, SerializedOrder } from "@/types";
import { formatINR } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { ORDER_STATUSES, StatusBadge } from "@/components/admin/status-badge";
import { useApi } from "@/components/admin/use-api";

interface AdminStats {
  productCount: number;
  orderCount: number;
  userCount: number;
  pendingOrders: number;
  revenue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const stats = useApi<AdminStats>("/api/admin/stats");
  const recent = useApi<{ orders: SerializedOrder[]; total: number }>(
    "/api/orders?limit=8",
  );

  const s = stats.data;

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          Overview
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light">Dashboard</h1>
      </header>

      {stats.error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {stats.error}
        </p>
      )}

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <StatCard
          label="Revenue"
          value={s ? formatINR(s.revenue) : "—"}
          hint="Excludes cancelled"
          icon={IndianRupee}
          loading={stats.loading && !s}
          className="col-span-2 sm:col-span-1"
        />
        <StatCard
          label="Orders"
          value={s ? String(s.orderCount) : "—"}
          icon={ShoppingBag}
          loading={stats.loading && !s}
        />
        <StatCard
          label="Pending"
          value={s ? String(s.pendingOrders) : "—"}
          hint="Awaiting confirmation"
          icon={Clock}
          loading={stats.loading && !s}
        />
        <StatCard
          label="Products"
          value={s ? String(s.productCount) : "—"}
          icon={Package}
          loading={stats.loading && !s}
        />
        <StatCard
          label="Users"
          value={s ? String(s.userCount) : "—"}
          icon={Users}
          loading={stats.loading && !s}
        />
      </div>

      {/* Orders by status */}
      <section className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
          Orders by status
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ORDER_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/orders?status=${status}`}
              className="inline-flex items-center gap-2 border border-line bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:border-sand"
            >
              <StatusBadge status={status} />
              <span className="text-sm font-semibold tabular-nums">
                {s ? (s.ordersByStatus?.[status] ?? 0) : "—"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-luxe-sm text-gold-dark hover:text-maroon"
          >
            View all <ArrowUpRight size={13} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto border border-line bg-white">
          {recent.error ? (
            <p className="px-4 py-6 text-sm text-red-700">{recent.error}</p>
          ) : recent.loading && !recent.data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-9 animate-pulse bg-champagne/30" />
              ))}
            </div>
          ) : !recent.data || recent.data.orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone">
              No orders yet — they will appear here as customers check out.
            </p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-maroon hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">{order.customer.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
