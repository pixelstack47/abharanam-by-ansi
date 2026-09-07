// Review routes (see src/index.ts).
//
// productReviewsRouter — mount at /api/products/:slug/reviews (mergeParams):
//   GET    /   public list, newest first, ?limit=(20, cap 50)&page= -> { reviews, total }
//   PUT    /   auth; upsert the CALLER'S review { rating, title?, body } -> { review, product }
//   DELETE /   auth; delete the CALLER'S own review -> { ok: true, product }
//
// adminReviewsRouter — mount at /api/admin/reviews with requireAdmin:
//   GET    /     ?page&limit(cap 50)&search(product name/slug or reviewer) -> { reviews, total }
//   DELETE /:id  -> { ok: true }
//
// Product.rating / Product.reviewCount are recomputed from the Review
// aggregation after every write (recomputeProductRating).
import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.ts";
import {
  Review,
  isVerifiedBuyer,
  recomputeProductRating,
} from "../models/Review.ts";
import { requireUser } from "../lib/auth.ts";
import type { AuthedRequest } from "../lib/auth.ts";
import { toProduct, toReview } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

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

interface ParsedReviewBody {
  rating: number;
  title?: string;
  body: string;
}

function parseReviewBody(
  raw: unknown,
): { ok: true; review: ParsedReviewBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = raw as Record<string, unknown>;

  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be a whole number from 1 to 5." };
  }

  let title: string | undefined;
  if (b.title !== undefined && b.title !== null && b.title !== "") {
    if (typeof b.title !== "string") {
      return { ok: false, error: "Invalid review title." };
    }
    title = b.title.trim().slice(0, 120) || undefined;
  }

  const body = typeof b.body === "string" ? b.body.trim() : "";
  if (body.length < 10) {
    return { ok: false, error: "Review must be at least 10 characters." };
  }
  if (body.length > 2000) {
    return { ok: false, error: "Review must be at most 2000 characters." };
  }

  return { ok: true, review: { rating, ...(title ? { title } : {}), body } };
}

// ---------------------------------------------------------------------------
// product-scoped routes (/api/products/:slug/reviews — mergeParams for :slug)
// ---------------------------------------------------------------------------

export const productReviewsRouter = Router({ mergeParams: true });

productReviewsRouter.get(
  "/",
  wrap(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ error: "Product not found." });

    const limit = clampInt(qnum(req.query.limit) ?? 20, 1, 50);
    const page = Math.max(1, Math.trunc(qnum(req.query.page) ?? 1));

    const filter = { productId: product._id };
    const [total, docs] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    return res.json({ reviews: docs.map((doc) => toReview(doc)), total });
  }),
);

productReviewsRouter.put(
  "/",
  requireUser,
  wrap(async (req: AuthedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Please sign in." });

    const parsed = parseReviewBody(req.body);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ error: "Product not found." });

    const verified = await isVerifiedBuyer(user.id, product.slug);

    const update = {
      $set: {
        name: user.name,
        rating: parsed.review.rating,
        body: parsed.review.body,
        verified,
        ...(parsed.review.title ? { title: parsed.review.title } : {}),
      },
      ...(parsed.review.title ? {} : { $unset: { title: 1 } }),
    };

    // Upsert the caller's single review (unique productId+userId index). A
    // concurrent first-submit race can throw a duplicate key — retry once as
    // a plain update.
    const filter = { productId: product._id, userId: user.id };
    let doc;
    try {
      doc = await Review.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      });
    } catch (err) {
      if ((err as { code?: number } | null)?.code !== 11000) throw err;
      doc = await Review.findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
      });
    }
    if (!doc) return res.status(500).json({ error: "Could not save review." });

    await recomputeProductRating(product._id);
    const fresh = await Product.findById(product._id);
    return res.json({
      review: toReview(doc),
      product: toProduct(fresh ?? product),
    });
  }),
);

productReviewsRouter.delete(
  "/",
  requireUser,
  wrap(async (req: AuthedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Please sign in." });

    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ error: "Product not found." });

    const doc = await Review.findOneAndDelete({
      productId: product._id,
      userId: user.id,
    });
    if (!doc) {
      return res
        .status(404)
        .json({ error: "You haven't reviewed this product." });
    }

    await recomputeProductRating(product._id);
    const fresh = await Product.findById(product._id);
    return res.json({ ok: true, product: toProduct(fresh ?? product) });
  }),
);

// ---------------------------------------------------------------------------
// admin routes (/api/admin/reviews — requireAdmin applied at the mount)
// ---------------------------------------------------------------------------

export const adminReviewsRouter = Router();

adminReviewsRouter.get(
  "/",
  wrap(async (req, res) => {
    const filter: Record<string, unknown> = {};
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      // Product name/slug matches resolve to product ids first (no join).
      const matching = await Product.find({
        $or: [{ name: rx }, { slug: rx }],
      }).select("_id");
      filter.$or = [
        { name: rx },
        { productId: { $in: matching.map((p) => p._id) } },
      ];
    }

    const limit = clampInt(qnum(req.query.limit) ?? 20, 1, 50);
    const page = Math.max(1, Math.trunc(qnum(req.query.page) ?? 1));

    const [total, docs] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    // Attach product slug/name for the listing.
    const productIds = [...new Set(docs.map((d) => String(d.productId)))];
    const products = await Product.find({ _id: { $in: productIds } }).select(
      "slug name",
    );
    const byId = new Map(
      products.map((p) => [String(p._id), { slug: p.slug, name: p.name }]),
    );
    return res.json({
      reviews: docs.map((doc) => {
        const info = byId.get(String(doc.productId));
        return toReview(doc, {
          ...(info?.slug ? { productSlug: info.slug } : {}),
          ...(info?.name ? { productName: info.name } : {}),
        });
      }),
      total,
    });
  }),
);

adminReviewsRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Review not found." });
    }
    const doc = await Review.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Review not found." });

    await recomputeProductRating(doc.productId);
    return res.json({ ok: true });
  }),
);

export default productReviewsRouter;
