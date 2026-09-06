import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

/* Contract colours: pending amber, confirmed blue, shipped violet,
   delivered green, cancelled red. */
const chip: Record<OrderStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  confirmed: "border-blue-300 bg-blue-50 text-blue-800",
  shipped: "border-violet-300 bg-violet-50 text-violet-800",
  delivered: "border-green-300 bg-green-50 text-green-800",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

const dot: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  shipped: "bg-violet-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-luxe-sm",
        chip[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot[status])} aria-hidden />
      {status}
    </span>
  );
}
