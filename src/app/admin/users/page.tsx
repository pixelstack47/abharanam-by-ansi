"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Undo2,
} from "lucide-react";
import type { SerializedUser } from "@/types";
import { cn } from "@/lib/utils";
import { useAdminUser } from "@/components/admin/admin-context";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { apiFetch, useApi } from "@/components/admin/use-api";

const PAGE_SIZE = 50;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const me = useAdminUser();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SerializedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce the search box into the server-side ?search= param.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const url =
    `/api/admin/users?limit=${PAGE_SIZE}&page=${page}` +
    (query ? `&search=${encodeURIComponent(query)}` : "");
  const { data, loading, error, refetch } = useApi<{
    users: SerializedUser[];
    total: number;
  }>(url);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // If the current page emptied out (e.g. the last user on it was deleted),
  // clamp back to the last page that still has rows.
  useEffect(() => {
    if (data && data.users.length === 0 && page > 1 && data.total > 0) {
      setPage(Math.max(1, Math.min(page, Math.ceil(data.total / PAGE_SIZE))));
    }
  }, [data, page]);

  async function patchUser(
    user: SerializedUser,
    patch: { role?: "admin" | "customer"; blocked?: boolean },
  ) {
    setActingId(user.id);
    setActionError(null);
    try {
      await apiFetch<{ user: SerializedUser }>(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update the user",
      );
    } finally {
      setActingId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/admin/users/${pendingDelete.id}`, {
        method: "DELETE",
      });
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete the user",
      );
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const iconButton =
    "inline-flex size-8 cursor-pointer items-center justify-center text-espresso transition-colors disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">
          Community
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light">Users</h1>
      </header>

      <label className="relative mt-8 block">
        <Search
          size={15}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search users"
          className="h-11 w-full border border-ink/20 bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
        />
      </label>

      {(error || actionError) && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError ?? error}
        </p>
      )}

      <p className="mt-4 text-xs uppercase tracking-luxe-sm text-stone">
        {loading && !data
          ? "Loading…"
          : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "user" : "users"}`}
      </p>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse bg-champagne/30" />
            ))}
          </div>
        ) : !data || data.users.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            No users found{query ? ` for “${query}”` : ""}.
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-luxe-sm text-stone">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const isSelf = u.id === me.id;
                const busy = actingId === u.id;
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b border-line/70 last:border-b-0 hover:bg-maroon-soft/50",
                      u.blocked && "bg-red-50/40",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 border border-gold/40 bg-champagne/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-luxe-sm text-gold-dark">
                                You
                              </span>
                            )}
                            {u.blocked && (
                              <span className="ml-2 border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-luxe-sm text-red-700">
                                Blocked
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-stone">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-stone">
                      {u.phone ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.role === "admin" ? (
                        <span className="border border-maroon/30 bg-maroon-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-luxe-sm text-maroon">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-stone">Customer</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-stone">
                      {u.orderCount ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-stone">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {u.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => void patchUser(u, { role: "customer" })}
                            disabled={isSelf || busy}
                            title={
                              isSelf
                                ? "You cannot demote your own account"
                                : "Demote to customer"
                            }
                            aria-label={`Demote ${u.name} to customer`}
                            className={cn(iconButton, "hover:bg-maroon-soft hover:text-maroon")}
                          >
                            <ShieldOff size={14} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void patchUser(u, { role: "admin" })}
                            disabled={busy}
                            title="Promote to admin"
                            aria-label={`Promote ${u.name} to admin`}
                            className={cn(iconButton, "hover:bg-maroon-soft hover:text-maroon")}
                          >
                            <ShieldCheck size={14} strokeWidth={1.5} />
                          </button>
                        )}
                        {u.blocked ? (
                          <button
                            type="button"
                            onClick={() => void patchUser(u, { blocked: false })}
                            disabled={isSelf || busy}
                            title="Unblock"
                            aria-label={`Unblock ${u.name}`}
                            className={cn(iconButton, "hover:bg-green-50 hover:text-green-700")}
                          >
                            <Undo2 size={14} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void patchUser(u, { blocked: true })}
                            disabled={isSelf || busy}
                            title={
                              isSelf
                                ? "You cannot block your own account"
                                : "Block sign-in"
                            }
                            aria-label={`Block ${u.name}`}
                            className={cn(iconButton, "hover:bg-amber-50 hover:text-amber-700")}
                          >
                            <Ban size={14} strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingDelete(u)}
                          disabled={isSelf || busy}
                          title={
                            isSelf
                              ? "You cannot delete your own account"
                              : "Delete user"
                          }
                          aria-label={`Delete ${u.name}`}
                          className={cn(iconButton, "hover:bg-red-50 hover:text-red-700")}
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex cursor-pointer items-center gap-1 border border-line bg-white px-3 py-2 text-xs uppercase tracking-luxe-sm text-espresso transition-colors hover:border-sand disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={13} strokeWidth={1.5} /> Prev
          </button>
          <p className="text-xs text-stone">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex cursor-pointer items-center gap-1 border border-line bg-white px-3 py-2 text-xs uppercase tracking-luxe-sm text-espresso transition-colors hover:border-sand disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete user?"
        message={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.email}) will be removed permanently. Their orders remain on record.`
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
