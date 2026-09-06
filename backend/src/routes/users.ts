// Admin user routes — mount at /api/admin/users (see src/index.ts). All admin-only.
//   GET    /     ?search=&page=&limit= -> { users: SerializedUser[] (with orderCount), total }
//   PATCH  /:id  { role?, blocked? } (400 if targeting own account) -> { user }
//   DELETE /:id  (400 if self) -> { ok: true }
import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.ts";
import { Order } from "../models/Order.ts";
import { requireAdmin } from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { toUser } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

router.use(requireAdmin);

function qnum(v: unknown): number | undefined {
  if (typeof v !== "string" || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get(
  "/",
  wrap(async (req, res) => {
    const filter: Record<string, unknown> = {};
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const limit = clampInt(qnum(req.query.limit) ?? 20, 1, 100);
    const page = Math.max(1, Math.trunc(qnum(req.query.page) ?? 1));

    const [total, docs] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    // countDocuments casts the value through the Order schema, so this works
    // whether userId is stored as ObjectId or string.
    const counts = await Promise.all(
      docs.map((doc) => Order.countDocuments({ userId: doc._id })),
    );
    return res.json({
      users: docs.map((doc, i) => toUser(doc, counts[i])),
      total,
    });
  }),
);

router.patch(
  "/:id",
  wrap(async (req: AuthedRequest, res) => {
    const me = req.user;
    if (!me) return res.status(401).json({ error: "Please sign in." });
    if (req.params.id === me.id) {
      return res
        .status(400)
        .json({ error: "You cannot modify your own account." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "User not found." });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (body.role !== undefined) {
      if (body.role !== "customer" && body.role !== "admin") {
        return res.status(400).json({ error: "Invalid role." });
      }
      update.role = body.role;
    }
    if (body.blocked !== undefined) {
      if (typeof body.blocked !== "boolean") {
        return res.status(400).json({ error: "Invalid blocked value." });
      }
      update.blocked = body.blocked;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );
    if (!doc) return res.status(404).json({ error: "User not found." });
    const orderCount = await Order.countDocuments({ userId: doc._id });
    return res.json({ user: toUser(doc, orderCount) });
  }),
);

router.delete(
  "/:id",
  wrap(async (req: AuthedRequest, res) => {
    const me = req.user;
    if (!me) return res.status(401).json({ error: "Please sign in." });
    if (req.params.id === me.id) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "User not found." });
    }
    const doc = await User.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "User not found." });
    return res.json({ ok: true });
  }),
);

export const usersRouter = router;
export default router;
