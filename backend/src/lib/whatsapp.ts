import { config } from "../config.ts";
import type { SerializedOrder } from "../types.ts";

/** The fields of an order the WhatsApp message needs. */
export type OrderForWhatsApp = Pick<
  SerializedOrder,
  | "orderNumber"
  | "items"
  | "subtotal"
  | "gstRate"
  | "gstAmount"
  | "shippingFee"
  | "total"
  | "customer"
  | "note"
>;

/**
 * Build the wa.me deep link carrying the order summary to the store's
 * WhatsApp number. Message format is part of the API contract.
 */
export function buildOrderWhatsAppUrl(order: OrderForWhatsApp): string {
  const { customer } = order;
  const { address } = customer;

  let msg = `🪷 *New Order — ${order.orderNumber}*\n\n`;

  for (const item of order.items) {
    msg += `• ${item.name} ×${item.quantity} — ₹${item.price * item.quantity}\n`;
  }

  // GST is a breakout of the GST-inclusive subtotal, not an add-on.
  // Skipped when 0 (legacy orders, or a 0% rate).
  const gstLine =
    order.gstAmount > 0
      ? `\nIncludes GST (${order.gstRate}%): ₹${order.gstAmount}`
      : "";

  msg +=
    `\nSubtotal: ₹${order.subtotal}` +
    gstLine +
    `\nShipping: ${order.shippingFee === 0 ? "Free" : `₹${order.shippingFee}`}` +
    `\n*Total: ₹${order.total}*` +
    `\n\n*Customer*` +
    `\n${customer.name} — ${customer.phone}` +
    `\n${address.line1}${address.line2 ? `, ${address.line2}` : ""}` +
    `\n${address.city}, ${address.state} — ${address.pincode}`;

  if (order.note) {
    msg += `\nNote: ${order.note}`;
  }

  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
