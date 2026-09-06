// Auth routes — mount at /api/auth (see src/index.ts).
//   POST /register  { name, email, password, phone? } -> 201 { user } + cookie
//   POST /login     { email, password }               -> { user } + cookie (401 wrong creds, 403 blocked)
//   POST /logout                                      -> { ok: true } + clears cookie
//   GET  /me                                          -> { user: SessionUser | null, profile: AccountProfile | null } (always 200)
import { Router } from "express";
import type { Response } from "express";
import { User } from "../models/User.ts";
import {
  hashPassword,
  verifyPassword,
  signSession,
  sessionCookie,
} from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { toAccountProfile, toSessionUser } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setSessionCookie(res: Response, token: string): void {
  res.cookie(sessionCookie.name, token, sessionCookie.options);
}

function clearSessionCookie(res: Response): void {
  // clearCookie must not carry maxAge/expires or some browsers keep the cookie.
  const { maxAge: _maxAge, expires: _expires, ...clearOptions } = sessionCookie.options;
  res.clearCookie(sessionCookie.name, clearOptions);
}

router.post(
  "/register",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2) {
      return res
        .status(400)
        .json({ error: "Name must be at least 2 characters." });
    }
    if (!EMAIL_RE.test(email)) {
      return res
        .status(400)
        .json({ error: "Please enter a valid email address." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }

    let phone: string | undefined;
    if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
      if (typeof body.phone !== "string") {
        return res.status(400).json({ error: "Invalid phone number." });
      }
      phone = body.phone.trim();
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const doc = new User({
      name,
      email,
      passwordHash,
      ...(phone ? { phone } : {}),
      role: "customer",
      blocked: false,
    });
    try {
      await doc.save();
    } catch (err) {
      // Duplicate key race between findOne and save.
      if ((err as { code?: number } | null)?.code === 11000) {
        return res
          .status(409)
          .json({ error: "An account with this email already exists." });
      }
      throw err;
    }

    const user = toSessionUser(doc);
    setSessionCookie(res, await signSession(user));
    return res.status(201).json({ user });
  }),
);

router.post(
  "/login",
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const doc = await User.findOne({ email });
    if (!doc) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const valid = await verifyPassword(password, doc.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (doc.blocked) {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }

    const user = toSessionUser(doc);
    setSessionCookie(res, await signSession(user));
    return res.json({ user });
  }),
);

router.post(
  "/logout",
  wrap(async (_req, res) => {
    clearSessionCookie(res);
    return res.json({ ok: true });
  }),
);

router.get(
  "/me",
  wrap(async (req: AuthedRequest, res) => {
    // `user` keeps its existing shape for current callers; `profile` adds the
    // saved phone/address from the User document when the session is valid.
    const user = req.user ?? null;
    let profile = null;
    if (user) {
      const doc = await User.findById(user.id);
      if (doc) profile = toAccountProfile(doc);
    }
    return res.json({ user, profile });
  }),
);

export const authRouter = router;
export default router;
