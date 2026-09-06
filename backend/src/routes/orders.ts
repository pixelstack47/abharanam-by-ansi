// Order routes — mount at /api/orders (see src/index.ts).
//   POST  /      public (guest OK; userId attached when session present) -> 201 { order, whatsappUrl }
//   GET   /      auth required; own orders (admin: all), ?status=&page=&limit= -> { orders, total }
//   GET   /:id   public by unguessable ObjectId (confirmation page) -> { order, whatsappUrl }
//   PATCH /:id   admin { status } -> { order }
import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.ts";
import { Order } from "../models/Order.ts";
import { nextOrderNumber } from "../models/Counter.ts";
import { requireUser, requireAdmin } from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { buildOrderWhatsAppUrl } from "../lib/whatsapp.ts";
import { toOrder, toProduct } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";
import { ORDER_STATUSES } from "../types.ts";
import type { OrderCustomer, OrderItem, OrderStatus } from "../types.ts";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isOrderStatus(v: unknown): v is OrderStatus {
  return (
    typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v)
  );
}

function qnum(v: unknown): number | undefined {
  if (typeof v !== "string" || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/** 10 digits after stripping spaces, dashes and a +91 / 0 prefix. */
function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : null;
}

function parseCustomer(
  raw: unknown,
): { ok: true; customer: OrderCustomer } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Customer details are required." };
  }
  const c = raw as Record<string, unknown>;

  const name = typeof c.name === "string" ? c.name.trim() : "";
  if (name.length < 2) {
    return { ok: false, error: "Customer name must be at least 2 characters." };
  }

  const phone = typeof c.phone === "string" ? normalizePhone(c.phone) : null;
  if (!phone) {
    return { ok: false, error: "A valid 10-digit phone number is required." };
  }

  let email: string | undefined;
  if (c.email !== undefined && c.email !== null && c.email !== "") {
    if (
      typeof c.email !== "string" ||
      !EMAIL_RE.test(c.email.trim().toLowerCase())
    ) {
      return { ok: false, error: "Please enter a valid email address." };
    }
    email = c.email.trim().toLowerCase();
  }

  const a =
    c.address && typeof c.address === "object" && !Array.isArray(c.address)
      ? (c.address as Record<string, unknown>)
      : null;
  if (!a) return { ok: false, error: "Delivery address is required." };

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
    customer: {
      name,
      phone,
      ...(email ? { email } : {}),
      address: { line1, ...(line2 ? { line2 } : {}), city, state, pincode },
    },
  };
}

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------

router.post(
  "/",
  wrap(async (req: AuthedRequest, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: "Your bag is empty." });
    }

    // Dedupe by slug; quantities are clamped to 1–10. Prices are NEVER taken
    // from the client — everything is recomputed from the database below.
    const qtyBySlug = new Map<string, number>();
    for (const entry of rawItems) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return res.status(400).json({ error: "Invalid order item." });
      }
      const item = entry as Record<string, unknown>;
      const slug = typeof item.slug === "string" ? item.slug.trim() : "";
      if (!slug) return res.status(400).json({ error: "Invalid order item." });
      const qRaw = Number(item.quantity);
      const quantity = clampInt(Number.isFinite(qRaw) ? qRaw : 1, 1, 10);
      qtyBySlug.set(slug, Math.min(10, (qtyBySlug.get(slug) ?? 0) + quantity));
    }

    const parsedCustomer = parseCustomer(body.customer);
    if (!parsedCustomer.ok) {
      return res.status(400).json({ error: parsedCustomer.error });
    }

    let note: string | undefined;
    if (body.note !== undefined && body.note !== null && body.note !== "") {
      if (typeof body.note !== "string") {
        return res.status(400).json({ error: "Invalid note." });
      }
      note = body.note.trim().slice(0, 500) || undefined;
    }

    const slugs = [...qtyBySlug.keys()];
    const docs = await Product.find({ slug: { $in: slugs } });
    const bySlug = new Map(docs.map((d) => {
      const p = toProduct(d);
      return [p.slug, p] as const;
    }));
    for (const slug of slugs) {
      const product = bySlug.get(slug);
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${slug}` });
      }
      if (!product.inStock) {
        return res
          .status(400)
          .json({ error: `Currently unavailable: ${product.name}` });
      }
    }

    const items: OrderItem[] = slugs.map((slug) => {
      const product = bySlug.get(slug)!;
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? "",
        price: product.price,
        quantity: qtyBySlug.get(slug)!,
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = subtotal >= 1999 ? 0 : 99;
    const total = subtotal + shippingFee;
    const orderNumber = await nextOrderNumber();

    const doc = new Order({
      orderNumber,
      ...(req.user ? { userId: req.user.id } : {}),
      customer: parsedCustomer.customer,
      items,
      subtotal,
      shippingFee,
      total,
      status: "pending",
      ...(note ? { note } : {}),
    });
    await doc.save();

    const order = toOrder(doc);
    return res
      .status(201)
      .json({ order, whatsappUrl: buildOrderWhatsAppUrl(order) });
  }),
);

router.get(
  "/",
  requireUser,
  wrap(async (req: AuthedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Please sign in." });

    const filter: Record<string, unknown> =
      user.role === "admin" ? {} : { userId: user.id };

    const status = req.query.status;
    if (status !== undefined && status !== "") {
      if (!isOrderStatus(status)) {
        return res.status(400).json({ error: "Invalid status filter." });
      }
      filter.status = status;
    }

    const limit = clampInt(qnum(req.query.limit) ?? 20, 1, 100);
    const page = Math.max(1, Math.trunc(qnum(req.query.page) ?? 1));

    const [total, docs] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    return res.json({ orders: docs.map(toOrder), total });
  }),
);

router.get(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Order not found." });
    }
    const doc = await Order.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Order not found." });
    const order = toOrder(doc);
    return res.json({ order, whatsappUrl: buildOrderWhatsAppUrl(order) });
  }),
);

router.patch(
  "/:id",
  requireAdmin,
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!isOrderStatus(body.status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Order not found." });
    }
    const doc = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status: body.status } },
      { new: true },
    );
    if (!doc) return res.status(404).json({ error: "Order not found." });
    return res.json({ order: toOrder(doc) });
  }),
);

export const ordersRouter = router;
export default router;
