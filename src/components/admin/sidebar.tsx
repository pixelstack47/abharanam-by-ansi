"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Products", href: "/admin/products", icon: Package, exact: false },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag, exact: false },
  { label: "Users", href: "/admin/users", icon: Users, exact: false },
] as const;

/** trailingSlash: true — normalise before comparing. */
function normalise(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function AdminSidebar({ user }: { user: SessionUser }) {
  const pathname = normalise(usePathname() ?? "");
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, fall through — the storefront will
      // re-check the session on load.
    }
    // Full navigation so all client state (store user, admin guard) resets.
    window.location.assign("/");
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
      {NAV.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-luxe-sm transition-colors",
              active
                ? "bg-maroon text-ivory"
                : "text-espresso hover:bg-maroon-soft hover:text-maroon",
            )}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-line px-3 py-4">
      <p className="truncate px-3 pb-3 text-[11px] text-stone" title={user.email}>
        Signed in as <span className="text-espresso">{user.name}</span>
      </p>
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-luxe-sm text-espresso transition-colors hover:bg-maroon-soft hover:text-maroon"
      >
        <Store size={15} strokeWidth={1.5} />
        Storefront
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={signingOut}
        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-luxe-sm text-espresso transition-colors hover:bg-maroon-soft hover:text-maroon disabled:opacity-50"
      >
        <LogOut size={15} strokeWidth={1.5} />
        {signingOut ? "Signing out…" : "Logout"}
      </button>
    </div>
  );

  const brand = (
    <div className="flex items-center justify-between px-6 py-6">
      <Link href="/admin" className="block">
        <span className="font-serif text-2xl font-light text-maroon">
          Abharanam
        </span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-luxe text-gold-dark">
          Admin
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close menu"
        className="cursor-pointer p-1 text-espresso lg:hidden"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-white px-4 lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="cursor-pointer p-1.5 text-ink"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-serif text-lg font-light text-maroon">Abharanam</span>
          <span className="text-[10px] uppercase tracking-luxe text-gold-dark">
            Admin
          </span>
        </Link>
      </header>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-ink/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar: fixed on desktop, slide-over drawer on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white transition-transform duration-300 ease-out print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
