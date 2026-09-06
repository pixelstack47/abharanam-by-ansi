"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxe-sm text-stone transition-colors hover:text-maroon"
      >
        <ArrowLeft size={13} strokeWidth={1.5} /> Products
      </Link>
      <header className="mt-4">
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          Catalogue
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light">Add Product</h1>
      </header>
      <ProductForm mode="create" />
    </div>
  );
}
