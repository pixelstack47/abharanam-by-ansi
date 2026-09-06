import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to your Abharanam account.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 pb-24 pt-28">
      <Reveal>
        <p className="text-center text-[11px] uppercase tracking-luxe text-gold-dark">
          Welcome Back
        </p>
        <h1 className="mt-3 text-center font-serif text-4xl font-light">
          Sign <em className="italic">in</em>
        </h1>
        <form className="mt-10 space-y-4" action="#">
          <input
            type="email"
            placeholder="Email address"
            aria-label="Email address"
            className="h-12 w-full border border-ink/25 bg-transparent px-5 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            className="h-12 w-full border border-ink/25 bg-transparent px-5 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
          />
          <Button type="button" className="w-full" size="lg">
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-xs leading-relaxed text-stone">
          Accounts are coming soon — this is a design preview.
          <br />
          Your cart and wishlist are already saved on this device.
        </p>
        <p className="mt-8 text-center">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-luxe-sm text-espresso underline underline-offset-4 hover:text-ink"
          >
            Continue Shopping
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
