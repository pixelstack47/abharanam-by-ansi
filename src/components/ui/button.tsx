import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "light" | "gold";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-ivory hover:bg-espresso border border-ink hover:border-espresso",
  outline:
    "bg-transparent text-ink border border-ink/40 hover:border-ink hover:bg-ink hover:text-ivory",
  ghost: "bg-transparent text-ink hover:bg-ink/5 border border-transparent",
  light:
    "bg-ivory text-ink border border-ivory hover:bg-transparent hover:text-ivory",
  gold: "bg-gold-dark text-ivory border border-gold-dark hover:bg-espresso hover:border-espresso",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-7 text-xs",
  lg: "h-13 px-9 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 font-medium uppercase tracking-luxe-sm transition-all duration-300 disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
