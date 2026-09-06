import { Schema, Types, model } from "mongoose";
import { Product } from "./Product.ts";

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
