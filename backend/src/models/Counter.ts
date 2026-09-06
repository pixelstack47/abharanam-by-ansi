import { Schema, model } from "mongoose";

/** Atomic named counters (currently only the order-number sequence). */
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = model("Counter", counterSchema);

/**
 * Atomically claim the next order number.
 * First call returns "AB-1001", then "AB-1002", ...
 */
export async function nextOrderNumber(): Promise<string> {
  const doc = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `AB-${1000 + doc.seq}`;
}
