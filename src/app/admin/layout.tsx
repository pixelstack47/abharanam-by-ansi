"use client";

/**
 * /admin shell — client-side auth guard + sidebar chrome.
 *
 * The guard asks GET /api/auth/me on mount: no session → /login?next=/admin,
 * a signed-in non-admin → /. This is a UX convenience only; every admin API
 * call is enforced server-side by the backend (401/403).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";
import { AdminUserProvider } from "@/components/admin/admin-context";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as { user: SessionUser | null };
        if (cancelled) return;
        if (!data.user) {
          router.replace("/login?next=/admin");
          return;
        }
        if (data.user.role !== "admin") {
          router.replace("/");
          return;
        }
        setUser(data.user);
      } catch {
        if (!cancelled) router.replace("/login?next=/admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="text-center">
          <p className="font-serif text-3xl font-light text-maroon">Abharanam</p>
          <p className="mt-3 animate-pulse text-[10px] uppercase tracking-luxe text-stone">
            Checking your session…
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminUserProvider value={user}>
      <div className="min-h-screen bg-cream text-ink">
        <AdminSidebar user={user} />
        <div className="lg:pl-64 lg:print:pl-0">
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-10 print:pt-4">
            {children}
          </main>
        </div>
      </div>
    </AdminUserProvider>
  );
}
