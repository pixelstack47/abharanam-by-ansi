import { Schema, Types, model } from "mongoose";
import { Product } from "./Product.ts";
import { Order } from "./Order.ts";

/**
 * Customer product reviews — one per (product, user), enforced by the unique
 * compound index below. `name` snapshots the reviewer's display name at write
 * time; `verified` marks reviewers with an order containing the product.
 *
 * Product.rating / Product.reviewCount are DERIVED from this collection:
 * call `recomputeProductRating()` after every create/update/delete.
 */
const reviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Snapshot of the reviewer's name at write time. */
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true },
    /** True when the reviewer has an order containing this product. */
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product.
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review = model("Review", reviewSchema);

/**
 * Verified purchase: does this user have an order containing this product?
 *
 * THE single source of truth for the badge — the review write path, the
 * order write path (backfill) and the seeder all call this, so the rule can
 * never drift between them. `verified` is stored as a snapshot on each
 * review rather than joined at read time, so every path that could change
 * the answer has to write it back.
 *
 * Note: any order counts, whatever its status — a pending or even cancelled
 * order marks the reviewer verified. Tighten the filter here (e.g. add
 * `status: { $ne: "cancelled" }`) to change that rule everywhere at once.
 */
export async function isVerifiedBuyer(
  userId: Types.ObjectId | string,
  slug: string
): Promise<boolean> {
  return Boolean(await Order.exists({ userId, "items.slug": slug }));
}

/**
 * Turn the badge on for reviews this user already wrote for `slugs`.
 *
 * Customers review before buying at least as often as after, and `verified`
 * is only computed when a review is written — so without this backfill on
 * the order path, a review written before the purchase keeps a stale
 * `false` forever. Resolves the number of reviews promoted.
 */
export async function markReviewsVerifiedForOrder(
  userId: Types.ObjectId | string,
  slugs: string[]
): Promise<number> {
  if (slugs.length === 0) return 0;
  const products = await Product.find({ slug: { $in: slugs } }).select("_id");
  if (products.length === 0) return 0;
  const result = await Review.updateMany(
    {
      userId,
      productId: { $in: products.map((p) => p._id) },
      verified: { $ne: true },
    },
    { $set: { verified: true } }
  );
  return result.modifiedCount ?? 0;
}

/**
 * Recompute a product's derived rating/reviewCount from the Review
 * aggregation (average rounded to 1 decimal; 0/0 when no reviews remain)
 * and persist them on the product document.
 */
export async function recomputeProductRating(
  productId: Types.ObjectId | string
): Promise<void> {
  const id = new Types.ObjectId(String(productId));
  const [agg] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { productId: id } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const rating = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const reviewCount = agg ? agg.count : 0;
  await Product.updateOne({ _id: id }, { $set: { rating, reviewCount } });
}
