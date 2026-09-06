import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  className,
  size = 13,
}: {
  value: number;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`Rated ${value} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(value)
              ? "fill-gold text-gold"
              : "fill-transparent text-sand"
          }
        />
      ))}
    </span>
  );
}
