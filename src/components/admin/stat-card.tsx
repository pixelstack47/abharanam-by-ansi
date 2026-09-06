import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading = false,
  className,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("border border-line bg-white p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-luxe-sm text-stone">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse bg-champagne/40" />
          ) : (
            <p className="mt-2 truncate font-serif text-3xl font-light text-ink">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-[11px] text-stone">{hint}</p>
          )}
        </div>
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center bg-champagne/40 text-gold-dark">
            <Icon size={16} strokeWidth={1.5} />
          </span>
        )}
      </div>
    </div>
  );
}
