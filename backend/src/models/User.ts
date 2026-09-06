import { Schema, model } from "mongoose";

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
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
