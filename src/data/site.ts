import type { Testimonial } from "@/types";

export const SITE_NAME = "Abharanam";
export const SITE_SUBNAME = "by Ansi";
export const SITE_URL = "https://abharanam.example.com";
export const SITE_TAGLINE = "Jewels that celebrate you";
export const SITE_DESCRIPTION =
  "Abharanam by Ansi is a modern jewellery house rooted in Indian craft — necklaces, chokers, earrings, bridal and anti-tarnish collections, hand-finished and made to be lived in.";
export const FREE_SHIPPING_THRESHOLD = 1999;

export const NAV_LINKS = [
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Jewellery", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Bridal", href: "/shop?category=Bridal" },
  { label: "About", href: "/about" },
] as const;

// Categories, collections, and materials are DB-managed: the storefront reads
// them from GET /api/categories, /api/collections, and /api/materials (see
// src/lib/store.tsx and the server pages). Seed defaults live in
// backend/src/seed-data.ts.

export const PRICE_RANGES = [
  { label: "Under ₹1,500", min: 0, max: 1499 },
  { label: "₹1,500 – ₹3,000", min: 1500, max: 2999 },
  { label: "₹3,000 – ₹6,000", min: 3000, max: 5999 },
  { label: "₹6,000 – ₹10,000", min: 6000, max: 9999 },
  { label: "Above ₹10,000", min: 10000, max: Infinity },
] as const;

export const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617117811969-97f441511dee?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602752250015-52934bc45613?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=900&auto=format&fit=crop",
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The necklace was even more beautiful than I expected. The finish looks like solid gold — my mother thought it cost ten times the price.",
    name: "Ananya Krishnan",
    location: "Chennai",
    rating: 5,
  },
  {
    quote:
      "I wore my Muhurtham set for my wedding and it photographed like a dream. Not one stone loose after a twelve-hour day.",
    name: "Meera Pillai",
    location: "Kochi",
    rating: 5,
  },
  {
    quote:
      "Six months of daily wear, showers included, and my Noor chain still shines like day one. Completely converted to anti-tarnish.",
    name: "Sana Sheikh",
    location: "Mumbai",
    rating: 5,
  },
  {
    quote:
      "Packaging alone felt like receiving a gift from a Paris maison. The jhumkas are feather-light and gorgeous.",
    name: "Divya Raghavan",
    location: "Bengaluru",
    rating: 4,
  },
  {
    quote:
      "Ordered on Tuesday, wore it to a wedding on Saturday. Fast delivery, flawless piece, and the quick support on WhatsApp sealed it.",
    name: "Priyanka Nair",
    location: "Thiruvananthapuram",
    rating: 5,
  },
  {
    quote:
      "The Margot hoops are my new signature. I've had strangers stop me to ask where they're from.",
    name: "Aditi Sharma",
    location: "New Delhi",
    rating: 5,
  },
];

// Product reviews are real, DB-backed data now: the product page reads
// GET /api/products/:slug/reviews and customers write their own (see
// src/components/products/product-detail.tsx). The old fake PRODUCT_REVIEWS
// export is gone on purpose — do not reintroduce placeholder reviews.

export const POPULAR_SEARCHES = [
  "Anti-tarnish",
  "Bridal set",
  "Jhumka",
  "Pearl",
  "Choker",
  "Solitaire",
];
