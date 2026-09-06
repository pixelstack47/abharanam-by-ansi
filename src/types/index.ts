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
  id: number;
  slug: string;
  name: string;
  category: Category;
  collection: CollectionName;
  material: Material;
  price: number;
  compareAtPrice?: number;
  images: [string, string];
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
