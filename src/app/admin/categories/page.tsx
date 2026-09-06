"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { CategoryInfo } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { apiFetch, useApi } from "@/components/admin/use-api";

const inputClass =
  "h-11 w-full border border-ink/20 bg-white px-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink disabled:bg-cream disabled:text-stone";
const labelClass = "mb-1.5 block text-[11px] uppercase tracking-luxe-sm text-stone";

interface FormState {
  name: string;
  blurb: string;
  sortOrder: string;
  image: string;
}

const EMPTY_FORM: FormState = { name: "", blurb: "", sortOrder: "0", image: "" };

export default function AdminCategoriesPage() {
  const { data, loading, error, refetch } = useApi<{ categories: CategoryInfo[] }>(
    "/api/categories",
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryInfo | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLFormElement>(null);

  // The edit buttons live below the panel — bring the form into view.
  useEffect(() => {
    if (panelOpen) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [panelOpen, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: String(data?.categories.length ?? 0) });
    setErrors({});
    setSubmitError(null);
    setUploadError(null);
    setUrlDraft("");
    setNotice(null);
    setPanelOpen(true);
  }

  function openEdit(category: CategoryInfo) {
    setEditing(category);
    setForm({
      name: category.name,
      blurb: category.blurb,
      sortOrder: String(category.sortOrder),
      image: category.image,
    });
    setErrors({});
    setSubmitError(null);
    setUploadError(null);
    setUrlDraft("");
    setNotice(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditing(null);
  }

  /* ——— Image (single: presigned upload OR pasted URL) ——— */

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError(`“${file.name}” is not an image file.`);
      return;
    }
    setUploadError(null);
    setUploading(true);
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
      set("image", publicPath);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : `Could not upload “${file.name}”.`,
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addImageUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/)/.test(url)) {
      setUploadError("Image URL must start with https:// or /");
      return;
    }
    setUploadError(null);
    set("image", url);
    setUrlDraft("");
  }

  /* ——— Submit ——— */

  const renaming = editing !== null && form.name.trim() !== editing.name;

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name needs at least 2 characters.";
    if (!form.blurb.trim()) e.blurb = "A blurb is required.";
    if (!form.image) e.image = "Add an image — upload one or paste a URL.";
    if (form.sortOrder.trim() === "" || !Number.isFinite(Number(form.sortOrder))) {
      e.sortOrder = "Sort order must be a number.";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      blurb: form.blurb.trim(),
      image: form.image,
      sortOrder: Math.round(Number(form.sortOrder)),
    };

    setSaving(true);
    try {
      if (editing === null) {
        await apiFetch<{ category: CategoryInfo }>("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice(`“${payload.name}” added.`);
      } else {
        const res = await apiFetch<{
          category: CategoryInfo;
          updatedProducts?: number;
        }>(`/api/admin/categories/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        const moved = res.updatedProducts ?? 0;
        setNotice(
          moved > 0
            ? `“${payload.name}” saved — ${moved} ${moved === 1 ? "product" : "products"} updated to the new name.`
            : `“${payload.name}” saved.`,
        );
      }
      setPanelOpen(false);
      setEditing(null);
      await refetch();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not save the category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/admin/categories/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (editing?.id === pendingDelete.id) closePanel();
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      // Surfaces the backend guard verbatim, e.g.
      // "3 products still use this category. Reassign them first."
      setActionError(
        err instanceof Error ? err.message : "Could not delete the category",
      );
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-700">{errors[key]}</p>
    ) : null;

  const count = data?.categories.length ?? 0;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light">Categories</h1>
        </div>
        <Button size="sm" variant="gold" onClick={openCreate}>
          <Plus size={14} strokeWidth={1.75} /> Add Category
        </Button>
      </header>

      {/* ——— Add / edit panel ——— */}
      {panelOpen && (
        <form ref={panelRef} onSubmit={handleSubmit} noValidate className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
            {editing ? `Edit “${editing.name}”` : "New category"}
          </h2>
          <div className="mt-3 grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="cf-name" className={labelClass}>
                Name *
              </label>
              <input
                id="cf-name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Necklaces"
                className={inputClass}
              />
              {renaming && (
                <p className="mt-1 text-xs text-amber-700">
                  Renaming updates all products in this category.
                </p>
              )}
              {fieldError("name")}
            </div>

            <div>
              <label htmlFor="cf-sort" className={labelClass}>
                Sort order
              </label>
              <input
                id="cf-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-stone">
                Lower numbers appear first on the storefront.
              </p>
              {fieldError("sortOrder")}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cf-blurb" className={labelClass}>
                Blurb *
              </label>
              <input
                id="cf-blurb"
                type="text"
                value={form.blurb}
                onChange={(e) => set("blurb", e.target.value)}
                placeholder="One elegant line shown on the home-page tile"
                className={inputClass}
              />
              {fieldError("blurb")}
            </div>

            <div className="sm:col-span-2">
              <span className={labelClass}>Image *</span>
              {form.image && (
                <div className="mb-3 flex items-start gap-2">
                  <div className="relative aspect-square w-28 overflow-hidden border border-line bg-champagne/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.image}
                      alt="Category"
                      className="size-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set("image", "")}
                    aria-label="Remove image"
                    className="inline-flex size-7 cursor-pointer items-center justify-center border border-line text-espresso transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  id="cf-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleFile(e.target.files)}
                  className="sr-only"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <ImagePlus size={14} strokeWidth={1.5} />{" "}
                      {form.image ? "Replace image" : "Upload image"}
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
                    <Link2 size={13} strokeWidth={1.5} /> Use
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-stone">
                Shown on the home-page category tile. Uploads go straight to
                storage and are served from /api/images.
              </p>
              {uploadError && (
                <p className="mt-2 text-xs text-red-700">{uploadError}</p>
              )}
              {fieldError("image")}
            </div>
          </div>

          {submitError && (
            <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Category"}
            </Button>
            <Button type="button" variant="ghost" onClick={closePanel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {notice && (
        <p className="mt-4 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}
      {(error || actionError) && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError ?? error}
        </p>
      )}

      <p className="mt-4 text-xs uppercase tracking-luxe-sm text-stone">
        {loading && !data
          ? "Loading…"
          : `${count} ${count === 1 ? "category" : "categories"}`}
      </p>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse bg-champagne/30" />
            ))}
          </div>
        ) : !data || data.categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            No categories yet — add the first one to build the storefront menu.
          </p>
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Blurb</th>
                <th className="px-4 py-3 text-right font-medium">Products</th>
                <th className="px-4 py-3 text-right font-medium">Sort</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image}
                        alt=""
                        className="size-11 shrink-0 border border-line object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="cursor-pointer truncate font-medium text-ink hover:text-maroon"
                      >
                        {c.name}
                      </button>
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-stone" title={c.blurb}>
                    {c.blurb}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-stone">
                    {c.productCount}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-stone">
                    {c.sortOrder}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        aria-label={`Edit ${c.name}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center text-espresso transition-colors hover:bg-maroon-soft hover:text-maroon"
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(c)}
                        aria-label={`Delete ${c.name}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center text-espresso transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete category?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from the storefront permanently. A category still used by products cannot be deleted.`
            : ""
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
