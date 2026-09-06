import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGetOrNull } from "@/lib/api";
import { SITE_NAME } from "@/data/site";
import type { Product, SerializedReview } from "@/types";
import { ProductDetail } from "@/components/products/product-detail";
import { ProductCarousel } from "@/components/products/product-carousel";

// Catalogue-backed page: always render with live data from the backend.
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

type ProductResponse = { product: Product; related: Product[] };
type ReviewsResponse = { reviews: SerializedReview[]; total: number };

function fetchProduct(slug: string) {
  return apiGetOrNull<ProductResponse>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
}

/** Newest-first reviews for the PDP; a missing/404 route degrades to empty. */
function fetchReviews(slug: string) {
  return apiGetOrNull<ReviewsResponse>(
    `/api/products/${encodeURIComponent(slug)}/reviews?limit=50`,
  );
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchProduct(slug);
  if (!data) return { title: "Product Not Found" };
  const { product } = data;
  return {
    title: product.name,
    description: `${product.shortDescription} ${product.material}, from the ${product.collection} collection. ₹${product.price.toLocaleString("en-IN")}.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description: product.shortDescription,
      images: [{ url: product.images[0], width: 1200, height: 1500, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [data, reviewsData] = await Promise.all([
    fetchProduct(slug),
    fetchReviews(slug),
  ]);
  if (!data) notFound();
  const { product, related } = data;
  const reviews = reviewsData?.reviews ?? [];
  const reviewsTotal = reviewsData?.total ?? 0;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: SITE_NAME },
    material: product.material,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  // Only claim an aggregate rating once real reviews exist.
  if (product.reviewCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetail
        product={product}
        initialReviews={reviews}
        reviewsTotal={reviewsTotal}
      />
      <ProductCarousel
        eyebrow="Complete the Look"
        title={
          <>
            You may also <em className="italic">love</em>
          </>
        }
        products={related}
        href={`/shop?category=${encodeURIComponent(product.category)}`}
        hrefLabel={`All ${product.category}`}
      />
    </>
  );
}
