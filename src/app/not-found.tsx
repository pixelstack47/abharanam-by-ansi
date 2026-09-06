import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-20 text-center">
      <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Error 404</p>
      <h1 className="mt-4 font-serif text-5xl font-light sm:text-6xl">
        Lost its <em className="italic">sparkle</em>
      </h1>
      <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone">
        The page you’re looking for has slipped off the chain. Let’s get you back
        to something beautiful.
      </p>
      <div className="mt-9 flex gap-3">
        <Link href="/">
          <Button variant="outline">Back Home</Button>
        </Link>
        <Link href="/shop">
          <Button>Shop Jewellery</Button>
        </Link>
      </div>
    </div>
  );
}
