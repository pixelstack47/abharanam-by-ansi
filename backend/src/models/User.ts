import { Schema, model } from "mongoose";

/** Saved delivery address (fields validated only when the subdoc is present). */
const addressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/** Cart line: product slug + quantity (synced from the storefront). */
const cartItemSchema = new Schema(
  {
    slug: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /** bcrypt hash — never store or return the plain password. */
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    /** Remembered delivery address (checkout prefill; editable in account). */
    address: { type: addressSchema },
    /** Wishlisted product slugs (synced from the storefront; capped at 200). */
    wishlist: { type: [String], default: [] },
    /** Cart lines (synced from the storefront; capped at 100). */
    cart: { type: [cartItemSchema], default: [] },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
