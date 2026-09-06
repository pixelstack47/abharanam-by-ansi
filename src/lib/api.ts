/**
 * Server-side REST client for the standalone Express backend.
 *
 * Server components talk to the backend directly (no rewrite hop) via
 * BACKEND_URL. Browser code must NOT import this — client components call
 * relative `/api/...` URLs, which next.config.ts rewrites to the backend.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

/** Non-2xx response from the backend, carrying its HTTP status. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * GET `${BACKEND_URL}${path}` with caching disabled (every render sees live
 * data). Resolves with the parsed JSON body, or throws ApiError on !ok using
 * the backend's `{ error }` message when present.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });

  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body?.error === "string" && body.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

/**
 * Like apiGet, but a 404 resolves to null instead of throwing — for pages
 * that map "missing" to notFound() (product detail, order confirmation).
 */
export async function apiGetOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
