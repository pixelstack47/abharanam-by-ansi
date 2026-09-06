import { Schema, model } from "mongoose";

/**
 * Product material — DB-managed from the admin dashboard.
 *
 * Products reference materials by NAME string (Product.material), so a
 * rename propagates via Product.updateMany in the taxonomy routes.
 */
const materialSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Material = model("Material", materialSchema);
