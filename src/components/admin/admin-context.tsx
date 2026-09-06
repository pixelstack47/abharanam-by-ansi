"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/types";

/**
 * The signed-in admin, provided by app/admin/layout.tsx once the
 * GET /api/auth/me guard has passed. Pages use it to disable actions
 * against the admin's own account (users page) and to show identity.
 */
const AdminUserContext = createContext<SessionUser | null>(null);

export const AdminUserProvider = AdminUserContext.Provider;

export function useAdminUser(): SessionUser {
  const user = useContext(AdminUserContext);
  if (!user) {
    throw new Error("useAdminUser must be used inside the /admin layout");
  }
  return user;
}
