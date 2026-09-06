import { Schema, model } from "mongoose";

/**
 * Curated collection — DB-managed from the admin dashboard.
 *
 * Products reference collections by NAME string (stored as
 * Product.collectionName — mongoose only reserves the *document path*
 * `collection`, so the model name itself is safe), and a rename propagates
 * via Product.updateMany in the taxonomy routes.
 */
const collectionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    /** Full URL or "/api/images/..." path. */
    image: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Collection = model("Collection", collectionSchema);
