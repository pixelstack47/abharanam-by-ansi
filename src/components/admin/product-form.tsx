"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import type { Product } from "@/types";
import { cn, slugify } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import { apiFetch } from "@/components/admin/use-api";

const inputClass =
  "h-11 w-full border border-ink/20 bg-white px-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink disabled:bg-cream disabled:text-stone";
const labelClass = "mb-1.5 block text-[11px] uppercase tracking-luxe-sm text-stone";

interface FormState {
  name: string;
  slug: string;
  category: string;
  collection: string;
  material: string;
  price: string;
  compareAtPrice: string;
  shortDescription: string;
  description: string;
  rating: string;
  reviewCount: string;
  isNew: boolean;
  isBestseller: boolean;
  inStock: boolean;
  tags: string;
  images: string[];
}

function initialState(initial?: Product): FormState {
  return {
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    // Category/collection/material lists load from the API via the store —
    // default to the first entry once they arrive (see the effects in
    // ProductForm).
    category: initial?.category ?? "",
    collection: initial?.collection ?? "",
    material: initial?.material ?? "",
    price: initial ? String(initial.price) : "",
    compareAtPrice: initial?.compareAtPrice ? String(initial.compareAtPrice) : "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    rating: initial ? String(initial.rating) : "4.5",
    reviewCount: initial ? String(initial.reviewCount) : "0",
    isNew: initial?.isNew ?? false,
    isBestseller: initial?.isBestseller ?? false,
    inStock: initial?.inStock ?? true,
    tags: initial?.tags.join(", ") ?? "",
    images: initial?.images ?? [],
  };
}

export function ProductForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Product;
}) {
  const router = useRouter();
  const { categories, collections, materials, taxonomyLoaded } = useStore();
  const [form, setForm] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // The taxonomy lists arrive from the API after mount — once they do, give a
  // fresh form the first entry as its default (never overriding a choice or an
  // existing product's value).
  useEffect(() => {
    if (categories.length > 0) {
      setForm((f) => (f.category ? f : { ...f, category: categories[0].name }));
    }
  }, [categories]);

  useEffect(() => {
    if (collections.length > 0) {
      setForm((f) =>
        f.collection ? f : { ...f, collection: collections[0].name },
      );
    }
  }, [collections]);

  useEffect(() => {
    if (materials.length > 0) {
      setForm((f) => (f.material ? f : { ...f, material: materials[0].name }));
    }
  }, [materials]);

  /* ——— Images ——— */

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`“${file.name}” is not an image file.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        // 1) Ask the backend for a presigned S3 PUT + the public path.
        const { uploadUrl, publicPath } = await apiFetch<{
          key: string;
          uploadUrl: string;
          publicPath: string;
        }>("/api/admin/uploads", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        // 2) PUT the bytes straight to S3 with the matching Content-Type.
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);
        // 3) Reference the image via the backend's streaming proxy path.
        setForm((f) => ({ ...f, images: [...f.images, publicPath] }));
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : `Could not upload “${file.name}”.`,
        );
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addImageUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/)/.test(url)) {
      setUploadError("Image URL must start with https:// or /");
      return;
    }
    setUploadError(null);
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setUrlDraft("");
  }

  function removeImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function moveImage(index: number, delta: -1 | 1) {
    setForm((f) => {
      const next = [...f.images];
      const target = index + delta;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, images: next };
    });
  }

  /* ——— Submit ——— */

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name needs at least 2 characters.";
    if (!form.category) {
      e.category =
        taxonomyLoaded && categories.length === 0
          ? "No categories yet — create one under Categories first."
          : "Choose a category.";
    }
    if (!form.collection) {
      e.collection =
        taxonomyLoaded && collections.length === 0
          ? "No collections yet — create one under Collections first."
          : "Choose a collection.";
    }
    if (!form.material) {
      e.material =
        taxonomyLoaded && materials.length === 0
          ? "No materials yet — create one under Materials first."
          : "Choose a material.";
    }
    // Validate the rounded integers the payload actually sends — "0.4"
    // rounds to 0, which must fail here rather than at the backend.
    const price = Math.round(Number(form.price));
    if (!form.price || !Number.isFinite(price) || price < 1) {
      e.price = "Enter a price of at least ₹1.";
    }
    if (form.compareAtPrice) {
      const cmp = Math.round(Number(form.compareAtPrice));
      if (!Number.isFinite(cmp) || cmp < 1) {
        e.compareAtPrice = "Compare-at price must be at least ₹1.";
      } else if (Number.isFinite(price) && cmp <= price) {
        e.compareAtPrice = "Compare-at price should exceed the selling price.";
      }
    }
    if (!form.shortDescription.trim()) {
      e.shortDescription = "A short description is required.";
    }
    if (!form.description.trim()) e.description = "A description is required.";
    const rating = Number(form.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      e.rating = "Rating must be between 0 and 5.";
    }
    const reviews = Number(form.reviewCount);
    if (!Number.isFinite(reviews) || reviews < 0) {
      e.reviewCount = "Review count must be zero or more.";
    }
    if (form.images.length === 0) e.images = "Add at least one image.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      category: form.category,
      collection: form.collection,
      material: form.material,
      price: Math.round(Number(form.price)),
      compareAtPrice: form.compareAtPrice
        ? Math.round(Number(form.compareAtPrice))
        : mode === "edit"
          ? null
          : undefined,
      images: form.images,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      rating: Number(form.rating),
      reviewCount: Math.round(Number(form.reviewCount)),
      isNew: form.isNew,
      isBestseller: form.isBestseller,
      inStock: form.inStock,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (mode === "create" && form.slug.trim()) {
      payload.slug = slugify(form.slug);
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Product created.");
      } else {
        await apiFetch(`/api/products/${initial!.slug}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Product updated.");
      }
      router.push("/admin/products");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save the product.";
      setSubmitError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-700">{errors[key]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-10">
      {/* ——— Essentials ——— */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
          Essentials
        </h2>
        <div className="mt-3 grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className={labelClass}>
              Name *
            </label>
            <input
              id="pf-name"
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. The Meenakshi Temple Necklace"
              className={inputClass}
            />
            {fieldError("name")}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pf-slug" className={labelClass}>
              Slug {mode === "create" && "(optional — generated from name)"}
            </label>
            <input
              id="pf-slug"
              type="text"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-generated-from-name"
              disabled={mode === "edit"}
              className={inputClass}
            />
            {mode === "edit" && (
              <p className="mt-1 text-[11px] text-stone">
                Slugs are permanent — they anchor product URLs and order
                snapshots.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pf-category" className={labelClass}>
              Category *
            </label>
            <select
              id="pf-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              disabled={categories.length === 0}
              className={cn(inputClass, "cursor-pointer")}
            >
              {categories.length === 0 ? (
                <option value="">
                  {taxonomyLoaded ? "No categories yet" : "Loading categories…"}
                </option>
              ) : (
                <>
                  {form.category !== "" &&
                    !categories.some((c) => c.name === form.category) && (
                      <option value={form.category}>
                        {form.category} (missing)
                      </option>
                    )}
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {fieldError("category")}
          </div>

          <div>
            <label htmlFor="pf-collection" className={labelClass}>
              Collection *
            </label>
            <select
              id="pf-collection"
              value={form.collection}
              onChange={(e) => set("collection", e.target.value)}
              disabled={collections.length === 0}
              className={cn(inputClass, "cursor-pointer")}
            >
              {collections.length === 0 ? (
                <option value="">
                  {taxonomyLoaded ? "No collections yet" : "Loading collections…"}
                </option>
              ) : (
                <>
                  {form.collection !== "" &&
                    !collections.some((c) => c.name === form.collection) && (
                      <option value={form.collection}>
                        {form.collection} (missing)
                      </option>
                    )}
                  {collections.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {fieldError("collection")}
          </div>

          <div>
            <label htmlFor="pf-material" className={labelClass}>
              Material *
            </label>
            <select
              id="pf-material"
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
              disabled={materials.length === 0}
              className={cn(inputClass, "cursor-pointer")}
            >
              {materials.length === 0 ? (
                <option value="">
                  {taxonomyLoaded ? "No materials yet" : "Loading materials…"}
                </option>
              ) : (
                <>
                  {form.material !== "" &&
                    !materials.some((m) => m.name === form.material) && (
                      <option value={form.material}>
                        {form.material} (missing)
                      </option>
                    )}
                  {materials.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {fieldError("material")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-price" className={labelClass}>
                Price (₹) *
              </label>
              <input
                id="pf-price"
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="2499"
                className={inputClass}
              />
              {fieldError("price")}
            </div>
            <div>
              <label htmlFor="pf-compare" className={labelClass}>
                Compare-at (₹)
              </label>
              <input
                id="pf-compare"
                type="number"
                min={1}
                value={form.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                placeholder="3299"
                className={inputClass}
              />
              {fieldError("compareAtPrice")}
            </div>
          </div>
        </div>
      </section>

      {/* ——— Story ——— */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
          Story
        </h2>
        <div className="mt-3 space-y-4 border border-line bg-white p-5">
          <div>
            <label htmlFor="pf-short" className={labelClass}>
              Short description *
            </label>
            <input
              id="pf-short"
              type="text"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One elegant line shown on cards and quick view"
              className={inputClass}
            />
            {fieldError("shortDescription")}
          </div>
          <div>
            <label htmlFor="pf-desc" className={labelClass}>
              Description *
            </label>
            <textarea
              id="pf-desc"
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="The full story of the piece — craft, finish, occasion."
              className={cn(inputClass, "h-auto py-3 leading-relaxed")}
            />
            {fieldError("description")}
          </div>
          <div>
            <label htmlFor="pf-tags" className={labelClass}>
              Tags (comma-separated)
            </label>
            <input
              id="pf-tags"
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="temple, kundan, bridal"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ——— Images ——— */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
          Images
        </h2>
        <div className="mt-3 border border-line bg-white p-5">
          {form.images.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {form.images.map((src, i) => (
                <li key={`${src}-${i}`} className="group relative">
                  <div className="relative aspect-square overflow-hidden border border-line bg-champagne/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Product image ${i + 1}`}
                      className="size-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 bg-ink/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-luxe-sm text-ivory">
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move image ${i + 1} earlier`}
                      className="inline-flex size-7 cursor-pointer items-center justify-center border border-line text-espresso transition-colors hover:bg-maroon-soft disabled:opacity-30"
                    >
                      <ArrowUp size={12} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === form.images.length - 1}
                      aria-label={`Move image ${i + 1} later`}
                      className="inline-flex size-7 cursor-pointer items-center justify-center border border-line text-espresso transition-colors hover:bg-maroon-soft disabled:opacity-30"
                    >
                      <ArrowDown size={12} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove image ${i + 1}`}
                      className="inline-flex size-7 cursor-pointer items-center justify-center border border-line text-espresso transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <X size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div
            className={cn(
              "flex flex-col gap-3 sm:flex-row sm:items-center",
              form.images.length > 0 && "mt-5",
            )}
          >
            <input
              ref={fileInputRef}
              id="pf-files"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void handleFiles(e.target.files)}
              className="sr-only"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading > 0}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading > 0 ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <ImagePlus size={14} strokeWidth={1.5} /> Upload images
                </>
              )}
            </Button>
            <div className="flex flex-1 gap-2">
              <input
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="…or paste an image URL"
                aria-label="Image URL"
                className={cn(inputClass, "h-9 flex-1 text-xs")}
              />
              <Button type="button" variant="ghost" size="sm" onClick={addImageUrl}>
                <Link2 size={13} strokeWidth={1.5} /> Add
              </Button>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-stone">
            The first image is the cover; the second shows on card hover.
            Uploads go straight to storage and are served from /api/images.
          </p>
          {uploadError && (
            <p className="mt-2 text-xs text-red-700">{uploadError}</p>
          )}
          {fieldError("images")}
        </div>
      </section>

      {/* ——— Merchandising ——— */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
          Merchandising
        </h2>
        <div className="mt-3 grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-rating" className={labelClass}>
                Rating (0–5)
              </label>
              <input
                id="pf-rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => set("rating", e.target.value)}
                className={inputClass}
              />
              {fieldError("rating")}
            </div>
            <div>
              <label htmlFor="pf-reviews" className={labelClass}>
                Review count
              </label>
              <input
                id="pf-reviews"
                type="number"
                min={0}
                value={form.reviewCount}
                onChange={(e) => set("reviewCount", e.target.value)}
                className={inputClass}
              />
              {fieldError("reviewCount")}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {(
              [
                ["inStock", "In stock"],
                ["isNew", "New arrival"],
                ["isBestseller", "Bestseller"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 text-sm text-espresso"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="size-4 cursor-pointer accent-maroon"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {submitError && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || uploading > 0}>
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create Product"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
