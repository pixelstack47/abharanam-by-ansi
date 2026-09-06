"use client";

/**
 * Tiny client-side data helpers for the admin dashboard.
 *
 * All admin traffic goes through relative `/api/...` URLs — same origin, so
 * the `ab_session` cookie flows through the Next.js rewrite to the backend
 * automatically. The backend is the security boundary; these helpers simply
 * surface its JSON `{ error }` bodies as thrown errors.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

/** fetch() a relative /api path, JSON in/out, throwing AdminApiError on !ok. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (unlikely) — fall through to the status-based error.
  }

  if (!res.ok) {
    const message =
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new AdminApiError(message, res.status);
  }

  return body as T;
}

/**
 * GET hook: fetches `path` on mount and whenever it changes; keeps stale data
 * around while a refetch is in flight so tables don't flash empty.
 */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const refetch = useCallback(async () => {
    if (path === null) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path);
      if (seq.current === id) setData(result);
    } catch (err) {
      if (seq.current === id) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      if (seq.current === id) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
