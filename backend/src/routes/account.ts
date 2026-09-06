// Self-service account routes — mount at /api/account with requireUser (see src/index.ts).
//   PATCH /          { name?, phone?, address? }        -> { user, profile }
//   POST  /password  { currentPassword, newPassword }   -> { ok: true }
//
// Validation mirrors the order customer fields (routes/orders.ts): name >= 2,
// phone 10 digits normalized, address line1/city/state + 6-digit pincode.
// Email and role are NOT editable here; password changes go through
// POST /password (current password required, new password >= 8 chars).
import { Router } from "express";
import { User } from "../models/User.ts";
import {
  hashPassword,
  requireUser,
  setSessionCookie,
  verifyPassword,
} from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { toAccountProfile, toSessionUser } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";
import type { Address } from "../types.ts";

const router = Router();

router.use(requireUser);

/** 10 digits after stripping spaces, dashes and a +91 / 0 prefix. */
function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : null;
}

function parseAddress(
  raw: unknown,
): { ok: true; address: Address } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid address." };
  }
  const a = raw as Record<string, unknown>;

  const line1 = typeof a.line1 === "string" ? a.line1.trim() : "";
  if (line1.length < 3) return { ok: false, error: "Address line 1 is required." };

  let line2: string | undefined;
  if (a.line2 !== undefined && a.line2 !== null && a.line2 !== "") {
    if (typeof a.line2 !== "string") {
      return { ok: false, error: "Invalid address line 2." };
    }
    line2 = a.line2.trim() || undefined;
  }

  const city = typeof a.city === "string" ? a.city.trim() : "";
  if (!city) return { ok: false, error: "City is required." };
  const state = typeof a.state === "string" ? a.state.trim() : "";
  if (!state) return { ok: false, error: "State is required." };
  const pincode = typeof a.pincode === "string" ? a.pincode.trim() : "";
  if (!/^\d{6}$/.test(pincode)) {
    return { ok: false, error: "A valid 6-digit pincode is required." };
  }

  return {
    ok: true,
    address: { line1, ...(line2 ? { line2 } : {}), city, state, pincode },
  };
}

router.patch(
  "/",
  wrap(async (req: AuthedRequest, res) => {
    const me = req.user;
    if (!me) return res.status(401).json({ error: "Please sign in." });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2) {
        return res
          .status(400)
          .json({ error: "Name must be at least 2 characters." });
      }
      update.name = name;
    }

    if (body.phone !== undefined) {
      const phone =
        typeof body.phone === "string" ? normalizePhone(body.phone) : null;
      if (!phone) {
        return res
          .status(400)
          .json({ error: "A valid 10-digit phone number is required." });
      }
      update.phone = phone;
    }

    if (body.address !== undefined) {
      const parsed = parseAddress(body.address);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      update.address = parsed.address;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const doc = await User.findByIdAndUpdate(
      me.id,
      { $set: update },
      { new: true },
    );
    if (!doc) return res.status(404).json({ error: "Account not found." });

    const user = toSessionUser(doc);
    // Keep the session cookie in sync when the display name changes.
    if (update.name !== undefined && update.name !== me.name) {
      await setSessionCookie(res, user);
    }
    return res.json({ user, profile: toAccountProfile(doc) });
  }),
);

router.post(
  "/password",
  wrap(async (req: AuthedRequest, res) => {
    const me = req.user;
    if (!me) return res.status(401).json({ error: "Please sign in." });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({ error: "Current password is required." });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters." });
    }

    const doc = await User.findById(me.id);
    if (!doc) return res.status(404).json({ error: "Account not found." });

    const matches = await verifyPassword(currentPassword, doc.passwordHash);
    if (!matches) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    doc.passwordHash = await hashPassword(newPassword);
    await doc.save();
    return res.json({ ok: true });
  }),
);

export const accountRouter = router;
export default router;
