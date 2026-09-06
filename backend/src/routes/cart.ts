// Cart route — mount at /api/cart with requireUser (see src/index.ts).
//   PUT /  { items: { slug, quantity }[] }  -> { items } (replaces the stored cart)
//
// Each item's slug must be a string of 1..120 chars and its quantity a number
// (400 otherwise); quantities are truncated to integers and clamped to 1..10.
// Items are deduped by slug (first occurrence wins) and the deduped list is
// capped at 100 entries (400 otherwise). Slugs are NOT validated against the
// catalog — the storefront prunes unknown slugs after loading products. The
// stored cart is also returned by GET /api/auth/me in the profile payload
// (see serializers.toAccountProfile).
import { Router } from "express";
import { User } from "../models/User.ts";
import { requireUser } from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

router.use(requireUser);

const MAX_SLUG_LENGTH = 120;
const MAX_CART_SIZE = 100;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;

router.put(
  "/",
  wrap(async (req: AuthedRequest, res) => {
    const me = req.user;
    if (!me) return res.status(401).json({ error: "Please sign in." });

    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!Array.isArray(body.items)) {
      return res
        .status(400)
        .json({ error: "items must be an array of { slug, quantity }." });
    }

    const items: { slug: string; quantity: number }[] = [];
    const seen = new Set<string>();
    for (const value of body.items) {
      const raw = (value ?? {}) as Record<string, unknown>;
      const slug = raw.slug;
      if (
        typeof slug !== "string" ||
        slug.length < 1 ||
        slug.length > MAX_SLUG_LENGTH
      ) {
        return res.status(400).json({
          error: `Each slug must be a string of 1-${MAX_SLUG_LENGTH} characters.`,
        });
      }
      const quantity = raw.quantity;
      if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
        return res
          .status(400)
          .json({ error: "Each quantity must be a number." });
      }
      if (seen.has(slug)) continue;
      seen.add(slug);
      items.push({
        slug,
        quantity: Math.min(
          MAX_QUANTITY,
          Math.max(MIN_QUANTITY, Math.trunc(quantity)),
        ),
      });
    }
    if (items.length > MAX_CART_SIZE) {
      return res.status(400).json({
        error: `Cart can hold at most ${MAX_CART_SIZE} items.`,
      });
    }

    const doc = await User.findByIdAndUpdate(
      me.id,
      { $set: { cart: items } },
      { new: true },
    );
    if (!doc) return res.status(404).json({ error: "Account not found." });

    return res.json({
      items: Array.isArray(doc.cart)
        ? doc.cart.map((item) => ({
            slug: String(item.slug),
            quantity: Number(item.quantity),
          }))
        : [],
    });
  }),
);

export const cartRouter = router;
export default router;
