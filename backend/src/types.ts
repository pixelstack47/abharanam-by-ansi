/**
 * Serialized shapes returned by the REST API.
 *
 * This is the backend's OWN copy of the shared contract — the frontend keeps
 * an identical copy in src/types/index.ts. Never import across the boundary.
 */

export type Category =
  | "Necklaces"
  | "Chokers"
  | "Earrings"
  | "Chains"
  | "Harams"
  | "Bridal"
  | "Anti-Tarnish"
  | "Diamond Look"
  | "Accessories";

export type Material =
  | "18K Gold Plated"
  | "92.5 Silver"
  | "Anti-Tarnish Alloy"
  | "Kundan"
  | "American Diamond"
  | "Pearl";

export type CollectionName =
  | "Heritage"
  | "Modern Muse"
  | "Muhurtham Bridal"
  | "Everyday Luxe";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  collection: CollectionName;
  material: Material;
  price: number;
  compareAtPrice?: number;
  images: string[];
  shortDescription: string;
  description: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isBestseller?: boolean;
  inStock: boolean;
  tags: string[];
}

export interface CartItem {
  slug: string;
  quantity: number;
}

export type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "best-selling";

export type Role = "customer" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  address: Address;
}

export interface SerializedOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  /** GST rate (%) broken out of the GST-inclusive prices. */
  gstRate: number;
  /** Tax portion already included in `subtotal` (not added on top). */
  gstAmount: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  blocked: boolean;
  createdAt: string;
  orderCount?: number;
}

/** Self-service profile data returned alongside the session by GET /api/auth/me. */
export interface AccountProfile {
  phone?: string;
  address?: Address;
  /** Wishlisted product slugs — always present (empty array when unset). */
  wishlist: string[];
  /** Cart lines — always emitted by the API (empty array when unset). */
  cart?: CartItem[];
}

export interface SerializedReview {
  id: string;
  productId: string;
  userId: string;
  name: string;
  rating: number;
  title?: string;
  body: string;
  /** True when the reviewer has an order containing this product. */
  verified: boolean;
  createdAt: string;
  /** Present only on admin listings. */
  productSlug?: string;
  productName?: string;
}

/** Serialized DB-managed category (see models/Category.ts). */
export interface CategoryInfo {
  id: string;
  name: string;
  image: string;
  blurb: string;
  sortOrder: number;
  productCount: number;
}

/** Serialized DB-managed material (see models/Material.ts). */
export interface MaterialInfo {
  id: string;
  name: string;
  sortOrder: number;
  productCount: number;
}

/** Serialized DB-managed collection (see models/Collection.ts). */
export interface CollectionInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  sortOrder: number;
  productCount: number;
}

// ---------------------------------------------------------------------------
// Runtime constants (handy for validation and stats aggregation)
// ---------------------------------------------------------------------------

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// Seed defaults; runtime source of truth is the DB (Category model).
export const CATEGORIES: readonly Category[] = [
  "Necklaces",
  "Chokers",
  "Earrings",
  "Chains",
  "Harams",
  "Bridal",
  "Anti-Tarnish",
  "Diamond Look",
  "Accessories",
] as const;

// Seed defaults; runtime source of truth is the DB (Material model).
export const MATERIALS: readonly Material[] = [
  "18K Gold Plated",
  "92.5 Silver",
  "Anti-Tarnish Alloy",
  "Kundan",
  "American Diamond",
  "Pearl",
] as const;

// Seed defaults; runtime source of truth is the DB (Collection model).
export const COLLECTIONS: readonly CollectionName[] = [
  "Heritage",
  "Modern Muse",
  "Muhurtham Bridal",
  "Everyday Luxe",
] as const;
