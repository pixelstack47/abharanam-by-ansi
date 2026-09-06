"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Product } from "@/types";
import { ProductForm } from "@/components/admin/product-form";
import { useApi } from "@/components/admin/use-api";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16: params is a Promise — unwrap it in this client page with use().
  const { slug } = use(params);
  const { data, loading, error } = useApi<{
    product: Product;
    related: Product[];
  }>(`/api/products/${slug}`);

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxe-sm text-stone transition-colors hover:text-maroon"
      >
        <ArrowLeft size={13} strokeWidth={1.5} /> Products
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light">
            {data ? data.product.name : "Edit Product"}
          </h1>
        </div>
        {data && (
          <a
            href={`/product/${data.product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxe-sm text-gold-dark transition-colors hover:text-maroon"
          >
            View on storefront <ExternalLink size={13} strokeWidth={1.5} />
          </a>
        )}
      </header>

      {loading && !data && (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse border border-line bg-champagne/20" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <p className="mt-2 text-xs text-stone">
            The product may have been deleted or the slug changed.
          </p>
        </div>
      )}

      {data && <ProductForm mode="edit" initial={data.product} />}
    </div>
  );
}
