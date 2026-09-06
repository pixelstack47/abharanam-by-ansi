import type {
  Address,
  OrderItem,
  Product,
  SerializedOrder,
  SerializedUser,
  SessionUser,
} from "./types.ts";

/**
 * Serializers accept either hydrated mongoose documents or `.lean()` plain
 * objects. Hydrated docs are unwrapped via `toObject()` first — this also
 * sidesteps the document accessors that shadow reserved-ish paths (`isNew`).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

function plain(doc: unknown): Raw {
  const d = doc as Raw;
  return typeof d?.toObject === "function" ? d.toObject() : d;
}

function toISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

export function toProduct(doc: unknown): Product {
  const d = plain(doc);
  const product: Product = {
    id: String(d._id),
    slug: d.slug,
    name: d.name,
    category: d.category,
    // Stored as `collectionName` (mongoose reserves `collection`).
    collection: d.collectionName,
    material: d.material,
    price: d.price,
    images: Array.isArray(d.images) ? d.images.map(String) : [],
    shortDescription: d.shortDescription ?? "",
    description: d.description ?? "",
    rating: d.rating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    inStock: d.inStock !== false,
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
  };
  if (d.compareAtPrice != null) product.compareAtPrice = d.compareAtPrice;
  if (d.isNew === true) product.isNew = true;
  if (d.isBestseller === true) product.isBestseller = true;
  return product;
}

function toOrderItem(raw: Raw): OrderItem {
  return {
    productId: String(raw.productId),
    slug: raw.slug,
    name: raw.name,
    image: raw.image ?? "",
    price: raw.price,
    quantity: raw.quantity,
  };
}

export function toOrder(doc: unknown): SerializedOrder {
  const d = plain(doc);
  const rawCustomer: Raw = d.customer ?? {};
  const rawAddress: Raw = rawCustomer.address ?? {};

  const address: Address = {
    line1: rawAddress.line1 ?? "",
    city: rawAddress.city ?? "",
    state: rawAddress.state ?? "",
    pincode: rawAddress.pincode ?? "",
  };
  if (rawAddress.line2) address.line2 = rawAddress.line2;

  const order: SerializedOrder = {
    id: String(d._id),
    orderNumber: d.orderNumber,
    customer: {
      name: rawCustomer.name ?? "",
      phone: rawCustomer.phone ?? "",
      address,
    },
    items: Array.isArray(d.items) ? d.items.map((i: Raw) => toOrderItem(plain(i))) : [],
    subtotal: d.subtotal,
    shippingFee: d.shippingFee,
    total: d.total,
    status: d.status ?? "pending",
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
  if (rawCustomer.email) order.customer.email = rawCustomer.email;
  if (d.userId != null) order.userId = String(d.userId);
  if (d.note) order.note = d.note;
  return order;
}

export function toUser(doc: unknown, orderCount?: number): SerializedUser {
  const d = plain(doc);
  const user: SerializedUser = {
    id: String(d._id),
    name: d.name,
    email: d.email,
    role: d.role === "admin" ? "admin" : "customer",
    blocked: d.blocked === true,
    createdAt: toISO(d.createdAt),
  };
  if (d.phone) user.phone = d.phone;
  if (typeof orderCount === "number") user.orderCount = orderCount;
  return user;
}

export function toSessionUser(doc: unknown): SessionUser {
  const d = plain(doc);
  return {
    id: String(d._id),
    name: d.name,
    email: d.email,
    role: d.role === "admin" ? "admin" : "customer",
  };
}
