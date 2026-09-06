"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useStore } from "@/lib/store";
import type { SessionUser } from "@/types";

const inputClass =
  "h-12 w-full border border-ink/25 bg-transparent px-5 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink";

/** Only allow same-site relative destinations from ?next=. */
function safeNext(raw: string | null): string | null {
  // Browsers treat "\" as "/", so "/\evil.com" would escape the site — require
  // a single leading "/" and reject backslashes anywhere.
  if (!raw || !/^\/(?![/\\])/.test(raw) || raw.includes("\\")) return null;
  return raw;
}

function destinationFor(user: SessionUser, next: string | null): string {
  if (next) return next;
  return user.role === "admin" ? "/admin" : "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { refreshUser } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = "Enter your email address.";
    if (!password) errs.password = "Enter your password.";
    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => null)) as {
        user?: SessionUser;
        error?: string;
      } | null;
      if (!res.ok || !data?.user) {
        setError(data?.error ?? "Unable to sign in right now. Please try again.");
        setSubmitting(false);
        return;
      }
      await refreshUser();
      router.push(destinationFor(data.user, next));
    } catch {
      setError("Unable to reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <Reveal>
      <div className="border border-line bg-cream px-7 py-10 shadow-[0_24px_70px_rgba(42,17,22,0.07)] sm:px-10">
        <p className="text-center text-[11px] uppercase tracking-luxe text-gold-dark">
          Welcome Back
        </p>
        <h1 className="mt-3 text-center font-serif text-4xl font-light">
          Sign <em className="italic">in</em>
        </h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-4" noValidate>
          <div className="space-y-1.5">
            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-maroon">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-maroon">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <p className="border border-maroon/20 bg-maroon-soft px-4 py-3 text-xs text-maroon" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Signing In…" : "Sign In"}
          </Button>
        </form>

        <div className="hairline my-8" />

        <p className="text-center text-xs text-stone">
          New to Abharanam?{" "}
          <Link
            href={registerHref}
            className="text-espresso underline underline-offset-4 hover:text-ink"
          >
            Create an account
          </Link>
        </p>
      </div>

      <p className="mt-8 text-center">
        <Link
          href="/shop"
          className="text-xs uppercase tracking-luxe-sm text-espresso underline underline-offset-4 hover:text-ink"
        >
          Continue Shopping
        </Link>
      </p>
    </Reveal>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-5 pb-24 pt-28 sm:px-6">
      {/* useSearchParams must sit under a Suspense boundary in Next 16. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
