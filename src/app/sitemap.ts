import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import { SITE_URL } from "@/data/site";
import type { Product } from "@/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Product slugs come from the backend; if it is unreachable (e.g. during
  // `next build` with no API running) fall back to the static routes only
  // rather than failing the build.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { products } = await apiGet<{ products: Product[]; total: number }>(
      "/api/products?limit=500",
    );
    productRoutes = products.map((product) => ({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Backend down — ship the static routes.
  }

  return [...staticRoutes, ...productRoutes];
}
