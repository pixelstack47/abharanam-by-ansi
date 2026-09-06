import { Schema, model } from "mongoose";

/**
 * Product catalogue.
 *
 * NOTE: the serialized `collection` field is stored as `collectionName`
 * (mongoose reserves `collection` on documents) — serializers.ts maps it
 * back to `collection` in API responses. `isNew` is stored under its real
 * name; it is only a *warned* reserved key, silenced via
 * `suppressReservedKeysWarning` so queries/filters can use `isNew` directly.
 */
const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    /** Serialized as `collection`. */
    collectionName: { type: String, required: true },
    material: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    images: { type: [String], default: [] },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isNew: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const Product = model("Product", productSchema);
