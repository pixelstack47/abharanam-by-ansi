// Wishlist route — mount at /api/wishlist with requireUser (see src/index.ts).
//   PUT /  { slugs: string[] }  -> { slugs: string[] } (replaces the stored list)
//
// Each slug must be a string of 1..120 chars; slugs are deduped server-side
// and the deduped list is capped at 200 entries (400 otherwise). Slugs are NOT
// validated against the catalog — the storefront prunes unknown slugs after
// loading products. The stored wishlist is also returned by GET /api/auth/me
// in the profile payload (see serializers.toAccountProfile).
import { Router } from "express";
import { User } from "../models/User.ts";
import { requireUser } from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

router.use(requireUser);

const MAX_SLUG_LENGTH = 120;
const MAX_WISHLIST_SIZE = 200;

router.put(
  "/",
  wrap(async (req: AuthedRequest, res) => {
    const me = req.user;
    if (!me) return res.status(401).json({ error: "Please sign in." });

    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!Array.isArray(body.slugs)) {
      return res
        .status(400)
        .json({ error: "slugs must be an array of strings." });
    }

    const slugs: string[] = [];
    const seen = new Set<string>();
    for (const value of body.slugs) {
      if (
        typeof value !== "string" ||
        value.length < 1 ||
        value.length > MAX_SLUG_LENGTH
      ) {
        return res.status(400).json({
          error: `Each slug must be a string of 1-${MAX_SLUG_LENGTH} characters.`,
        });
      }
      if (seen.has(value)) continue;
      seen.add(value);
      slugs.push(value);
    }
    if (slugs.length > MAX_WISHLIST_SIZE) {
      return res.status(400).json({
        error: `Wishlist can hold at most ${MAX_WISHLIST_SIZE} items.`,
      });
    }

    const doc = await User.findByIdAndUpdate(
      me.id,
      { $set: { wishlist: slugs } },
      { new: true },
    );
    if (!doc) return res.status(404).json({ error: "Account not found." });

    return res.json({
      slugs: Array.isArray(doc.wishlist) ? doc.wishlist.map(String) : [],
    });
  }),
);

export const wishlistRouter = router;
export default router;
