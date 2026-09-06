import type { Category, CollectionName, Material, Review, Testimonial } from "@/types";

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

export const CATEGORIES: {
  name: Category;
  image: string;
  blurb: string;
}[] = [
  {
    name: "Necklaces",
    image:
      "https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?q=80&w=1200&auto=format&fit=crop",
    blurb: "From whisper-fine pendants to temple classics",
  },
  {
    name: "Earrings",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1200&auto=format&fit=crop",
    blurb: "Studs, hoops, jhumkas and chandeliers",
  },
  {
    name: "Bridal",
    image:
      "https://images.unsplash.com/photo-1583937443566-6fe1a1c6e400?q=80&w=1200&auto=format&fit=crop",
    blurb: "Parures composed for your most beautiful beginning",
  },
  {
    name: "Anti-Tarnish",
    image:
      "https://images.unsplash.com/photo-1599459183200-59c7687a0275?q=80&w=1200&auto=format&fit=crop",
    blurb: "Waterproof shine you never take off",
  },
  {
    name: "Chokers",
    image:
      "https://images.unsplash.com/photo-1618403088890-3d9ff6f4c8b1?q=80&w=1200&auto=format&fit=crop",
    blurb: "Sculptural pieces that sit close and speak loudly",
  },
  {
    name: "Chains",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=1200&auto=format&fit=crop",
    blurb: "The essentials every stack is built on",
  },
  {
    name: "Harams",
    image:
      "https://images.unsplash.com/photo-1571908599407-cdb918ed83bf?q=80&w=1200&auto=format&fit=crop",
    blurb: "Opera-length grandeur, hand-finished",
  },
  {
    name: "Diamond Look",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
    blurb: "The fire of solitaires, the freedom of everyday wear",
  },
  {
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=1200&auto=format&fit=crop",
    blurb: "Rings, anklets and finishing touches",
  },
];

export const COLLECTIONS: {
  name: CollectionName;
  title: string;
  description: string;
  image: string;
}[] = [
  {
    name: "Heritage",
    title: "The Heritage Collection",
    description:
      "Temple motifs, kundan work and antique finishes — centuries of Indian craft, composed for the way you dress today.",
    image:
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Modern Muse",
    title: "Modern Muse",
    description:
      "Sculptural, fluid, quietly confident. Pieces that read like modern art and wear like second skin.",
    image:
      "https://images.unsplash.com/photo-1600721391689-2564bb8055de?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Muhurtham Bridal",
    title: "Muhurtham Bridal",
    description:
      "Composed under veil lighting, engineered to move as one — parures for the day every eye is on you.",
    image:
      "https://images.unsplash.com/photo-1583937443566-6fe1a1c6e400?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Everyday Luxe",
    title: "Everyday Luxe",
    description:
      "Waterproof, tarnish-free, barely-there luxury. The pieces you put on once and simply live in.",
    image:
      "https://images.unsplash.com/photo-1599459183200-59c7687a0275?q=80&w=1600&auto=format&fit=crop",
  },
];

export const MATERIALS: Material[] = [
  "18K Gold Plated",
  "92.5 Silver",
  "Anti-Tarnish Alloy",
  "Kundan",
  "American Diamond",
  "Pearl",
];

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

export const PRODUCT_REVIEWS: Review[] = [
  {
    name: "Kavya R.",
    location: "Hyderabad",
    rating: 5,
    title: "Exceeded every expectation",
    body: "The craftsmanship is exceptional for this price point. It arrived in the most beautiful box and looks far more expensive than it is.",
    date: "2026-08-14",
  },
  {
    name: "Nandini M.",
    location: "Pune",
    rating: 5,
    title: "My most complimented piece",
    body: "I've worn it nearly every day for two months. The finish hasn't dulled at all and I get compliments constantly.",
    date: "2026-07-30",
  },
  {
    name: "Ritika S.",
    location: "Jaipur",
    rating: 4,
    title: "Beautiful, runs slightly delicate",
    body: "Gorgeous in person — more delicate than the photos suggest, which I personally love. Handle the clasp gently.",
    date: "2026-07-02",
  },
  {
    name: "Lakshmi V.",
    location: "Coimbatore",
    rating: 5,
    title: "Heirloom feeling",
    body: "Bought this for my daughter's engagement. The antique finish is stunning and the weight feels substantial and premium.",
    date: "2026-06-18",
  },
];

export const POPULAR_SEARCHES = [
  "Anti-tarnish",
  "Bridal set",
  "Jhumka",
  "Pearl",
  "Choker",
  "Solitaire",
];
