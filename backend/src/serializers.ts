import type {
  AccountProfile,
  Address,
  CategoryInfo,
  CollectionInfo,
  MaterialInfo,
  OrderItem,
  Product,
  SerializedOrder,
  SerializedReview,
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
    // Legacy orders predate the GST breakout — fall back to 0.
    gstRate: typeof d.gstRate === "number" ? d.gstRate : 0,
    gstAmount: typeof d.gstAmount === "number" ? d.gstAmount : 0,
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

export function toCategory(doc: unknown, productCount?: number): CategoryInfo {
  const d = plain(doc);
  return {
    id: String(d._id),
    name: d.name,
    image: d.image ?? "",
    blurb: d.blurb ?? "",
    sortOrder: d.sortOrder ?? 0,
    productCount: productCount ?? 0,
  };
}

export function toCollection(doc: unknown, productCount?: number): CollectionInfo {
  const d = plain(doc);
  return {
    id: String(d._id),
    name: d.name,
    title: d.title ?? "",
    description: d.description ?? "",
    image: d.image ?? "",
    sortOrder: d.sortOrder ?? 0,
    productCount: productCount ?? 0,
  };
}

export function toMaterial(doc: unknown, productCount?: number): MaterialInfo {
  const d = plain(doc);
  return {
    id: String(d._id),
    name: d.name,
    sortOrder: d.sortOrder ?? 0,
    productCount: productCount ?? 0,
  };
}

/** Self-service profile shape (phone + address + wishlist + cart) from a User doc. */
export function toAccountProfile(doc: unknown): AccountProfile {
  const d = plain(doc);
  const profile: AccountProfile = {
    wishlist: Array.isArray(d.wishlist) ? d.wishlist.map(String) : [],
    cart: Array.isArray(d.cart)
      ? d.cart.map((item: Raw) => {
          const raw = plain(item);
          return { slug: String(raw.slug), quantity: Number(raw.quantity) };
        })
      : [],
  };
  if (d.phone) profile.phone = String(d.phone);
  const rawAddress: Raw | null =
    d.address && typeof d.address === "object" ? plain(d.address) : null;
  if (rawAddress?.line1) {
    const address: Address = {
      line1: rawAddress.line1,
      city: rawAddress.city ?? "",
      state: rawAddress.state ?? "",
      pincode: rawAddress.pincode ?? "",
    };
    if (rawAddress.line2) address.line2 = rawAddress.line2;
    profile.address = address;
  }
  return profile;
}

export function toReview(
  doc: unknown,
  extra?: { productSlug?: string; productName?: string },
): SerializedReview {
  const d = plain(doc);
  const review: SerializedReview = {
    id: String(d._id),
    productId: String(d.productId),
    userId: String(d.userId),
    name: d.name ?? "",
    rating: d.rating ?? 0,
    body: d.body ?? "",
    verified: d.verified === true,
    createdAt: toISO(d.createdAt),
  };
  if (d.title) review.title = d.title;
  if (extra?.productSlug) review.productSlug = extra.productSlug;
  if (extra?.productName) review.productName = extra.productName;
  return review;
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
