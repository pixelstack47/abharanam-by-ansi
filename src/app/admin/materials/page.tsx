"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { MaterialInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { apiFetch, useApi } from "@/components/admin/use-api";

const inputClass =
  "h-11 w-full border border-ink/20 bg-white px-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink disabled:bg-cream disabled:text-stone";
const labelClass = "mb-1.5 block text-[11px] uppercase tracking-luxe-sm text-stone";

interface FormState {
  name: string;
  sortOrder: string;
}

const EMPTY_FORM: FormState = { name: "", sortOrder: "0" };

export default function AdminMaterialsPage() {
  const { data, loading, error, refetch } = useApi<{ materials: MaterialInfo[] }>(
    "/api/materials",
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialInfo | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MaterialInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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
    setForm({ ...EMPTY_FORM, sortOrder: String(data?.materials.length ?? 0) });
    setErrors({});
    setSubmitError(null);
    setNotice(null);
    setPanelOpen(true);
  }

  function openEdit(material: MaterialInfo) {
    setEditing(material);
    setForm({
      name: material.name,
      sortOrder: String(material.sortOrder),
    });
    setErrors({});
    setSubmitError(null);
    setNotice(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditing(null);
  }

  /* ——— Submit ——— */

  const renaming = editing !== null && form.name.trim() !== editing.name;

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name needs at least 2 characters.";
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
      sortOrder: Math.round(Number(form.sortOrder)),
    };

    setSaving(true);
    try {
      if (editing === null) {
        await apiFetch<{ material: MaterialInfo }>("/api/admin/materials", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice(`“${payload.name}” added.`);
      } else {
        const res = await apiFetch<{
          material: MaterialInfo;
          updatedProducts?: number;
        }>(`/api/admin/materials/${editing.id}`, {
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
        err instanceof Error ? err.message : "Could not save the material.",
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
      await apiFetch<{ ok: true }>(`/api/admin/materials/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (editing?.id === pendingDelete.id) closePanel();
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      // Surfaces the backend guard verbatim, e.g.
      // "3 products still use this material. Reassign them first."
      setActionError(
        err instanceof Error ? err.message : "Could not delete the material",
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

  const count = data?.materials.length ?? 0;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light">Materials</h1>
        </div>
        <Button size="sm" variant="gold" onClick={openCreate}>
          <Plus size={14} strokeWidth={1.75} /> Add Material
        </Button>
      </header>

      {/* ——— Add / edit panel ——— */}
      {panelOpen && (
        <form ref={panelRef} onSubmit={handleSubmit} noValidate className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
            {editing ? `Edit “${editing.name}”` : "New material"}
          </h2>
          <div className="mt-3 grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="mf-name" className={labelClass}>
                Name *
              </label>
              <input
                id="mf-name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. 92.5 Silver"
                className={inputClass}
              />
              {renaming && (
                <p className="mt-1 text-xs text-amber-700">
                  Renaming updates all products made of this material.
                </p>
              )}
              {fieldError("name")}
            </div>

            <div>
              <label htmlFor="mf-sort" className={labelClass}>
                Sort order
              </label>
              <input
                id="mf-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-stone">
                Lower numbers appear first in the shop filters.
              </p>
              {fieldError("sortOrder")}
            </div>
          </div>

          {submitError && (
            <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Material"}
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
          : `${count} ${count === 1 ? "material" : "materials"}`}
      </p>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse bg-champagne/30" />
            ))}
          </div>
        ) : !data || data.materials.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            No materials yet — add the first one so products can describe their
            make.
          </p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 text-right font-medium">Products</th>
                <th className="px-4 py-3 text-right font-medium">Sort</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.materials.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50"
                >
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="cursor-pointer truncate font-medium text-ink hover:text-maroon"
                    >
                      {m.name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-stone">
                    {m.productCount}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-stone">
                    {m.sortOrder}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        aria-label={`Edit ${m.name}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center text-espresso transition-colors hover:bg-maroon-soft hover:text-maroon"
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(m)}
                        aria-label={`Delete ${m.name}`}
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
        title="Delete material?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed permanently. A material still used by products cannot be deleted.`
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
