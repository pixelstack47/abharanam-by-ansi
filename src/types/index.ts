/** Category name — free-form; the canonical list lives in the DB (GET /api/categories). */
export type Category = string;

/** Material name — free-form; the canonical list lives in the DB (GET /api/materials). */
export type Material = string;

/** Collection name — free-form; the canonical list lives in the DB (GET /api/collections). */
export type CollectionName = string;

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

export interface Review {
  name: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  rating: number;
}

export type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "best-selling";

// ---------------------------------------------------------------------------
// Shapes returned by the backend API (see backend/src/types.ts)
// ---------------------------------------------------------------------------

export interface CategoryInfo {
  id: string;
  name: string;
  image: string;
  blurb: string;
  sortOrder: number;
  productCount: number;
}

export interface CollectionInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  sortOrder: number;
  productCount: number;
}

export interface MaterialInfo {
  id: string;
  name: string;
  sortOrder: number;
  productCount: number;
}

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
  /** Wishlisted product slugs synced server-side (empty/absent when unset). */
  wishlist?: string[];
  /** Cart items synced server-side (empty/absent when unset). */
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
