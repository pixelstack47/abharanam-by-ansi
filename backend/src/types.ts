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

export const MATERIALS: readonly Material[] = [
  "18K Gold Plated",
  "92.5 Silver",
  "Anti-Tarnish Alloy",
  "Kundan",
  "American Diamond",
  "Pearl",
] as const;

export const COLLECTIONS: readonly CollectionName[] = [
  "Heritage",
  "Modern Muse",
  "Muhurtham Bridal",
  "Everyday Luxe",
] as const;
