import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { config } from "../config.ts";
import { User } from "../models/User.ts";
import { toSessionUser } from "../serializers.ts";
import type { SessionUser } from "../types.ts";

// ---------------------------------------------------------------------------
// Passwords (bcryptjs, cost 10)
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Session JWT (jose, HS256, 30 days)
// ---------------------------------------------------------------------------

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const secretKey = new TextEncoder().encode(config.jwtSecret);

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "customer" && payload.role !== "admin")
    ) {
      return null;
    }
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session cookie
// ---------------------------------------------------------------------------

export const COOKIE_NAME = "ab_session";

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: config.isProduction,
  maxAge: SESSION_TTL_SECONDS * 1000, // express takes milliseconds
};

/** Aliases, so either naming convention resolves. */
export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_COOKIE_OPTIONS = COOKIE_OPTIONS;
export const sessionCookie = { name: COOKIE_NAME, options: COOKIE_OPTIONS };

/** Sign a session for `user` and set it as the auth cookie on `res`. */
export async function setSessionCookie(
  res: Response,
  user: SessionUser
): Promise<void> {
  const token = await signSession(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

/** Clear the auth cookie (options minus maxAge so the clear actually sticks). */
export function clearSessionCookie(res: Response): void {
  const { maxAge: _maxAge, ...options } = COOKIE_OPTIONS;
  res.clearCookie(COOKIE_NAME, options);
}

// ---------------------------------------------------------------------------
// Express middlewares
// ---------------------------------------------------------------------------

/** Request with the session user attached by `attachUser`. */
export interface AuthedRequest extends Request {
  user?: SessionUser | null;
}

/**
 * Reads the session cookie and sets `req.user` (SessionUser | null).
 * Never fails a request — invalid/expired/absent tokens yield null.
 */
export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authed = req as AuthedRequest;
  authed.user = null;
  try {
    const cookies = (req as unknown as { cookies?: Record<string, string> })
      .cookies;
    const token = cookies?.[COOKIE_NAME];
    if (token) authed.user = await verifySession(token);
  } catch {
    authed.user = null;
  }
  next();
}

/**
 * Re-checks the session against the database so blocking, demotion, or
 * deletion takes effect immediately instead of when the JWT expires.
 * Sends 401/403 and resolves null when there is no session or the account
 * is gone/blocked; otherwise refreshes `req.user` from the document (so
 * downstream handlers see current role/name/email) and resolves it.
 */
async function loadDbUser(
  req: Request,
  res: Response
): Promise<SessionUser | null> {
  const authed = req as AuthedRequest;
  const session = authed.user;
  if (!session) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  const doc = await User.findById(session.id);
  if (!doc) {
    res.status(401).json({ error: "Account no longer exists" });
    return null;
  }
  if (doc.blocked) {
    res.status(403).json({ error: "Account is blocked" });
    return null;
  }
  authed.user = toSessionUser(doc);
  return authed.user;
}

/** 401 unless the session maps to an existing, unblocked user. */
export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  loadDbUser(req, res)
    .then((user) => {
      if (user) next();
    })
    .catch(next);
}

/** 401 without a session, 403 unless the DB user is an unblocked admin. */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  loadDbUser(req, res)
    .then((user) => {
      if (!user) return;
      if (user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      next();
    })
    .catch(next);
}
