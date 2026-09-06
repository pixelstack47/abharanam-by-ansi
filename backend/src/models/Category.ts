import { Schema, model } from "mongoose";

/**
 * Storefront category — DB-managed from the admin dashboard.
 *
 * Products reference categories by NAME string (Product.category), so a
 * rename propagates via Product.updateMany in the taxonomy routes.
 */
const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    /** Full URL or "/api/images/..." path. */
    image: { type: String, required: true },
    blurb: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = model("Category", categorySchema);
