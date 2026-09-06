"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-20 text-center">
      <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
        Something went wrong
      </p>
      <h1 className="mt-4 font-serif text-5xl font-light sm:text-6xl">
        A loose <em className="italic">thread</em>
      </h1>
      <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone">
        We hit an unexpected snag loading this page. Try again — it usually
        settles on a second look.
      </p>
      <div className="mt-9 flex gap-3">
        <Button onClick={() => retry()}>Try Again</Button>
        <Link href="/">
          <Button variant="outline">Back Home</Button>
        </Link>
      </div>
    </div>
  );
}
