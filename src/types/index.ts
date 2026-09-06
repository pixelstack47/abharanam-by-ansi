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
