import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products, relatedProducts } from "@/data/products";
import { SITE_NAME } from "@/data/site";
import { ProductDetail } from "@/components/products/product-detail";
import { ProductCarousel } from "@/components/products/product-carousel";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product Not Found" };
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
  const product = getProduct(slug);
  if (!product) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: SITE_NAME },
    material: product.material,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetail product={product} />
      <ProductCarousel
        eyebrow="Complete the Look"
        title={
          <>
            You may also <em className="italic">love</em>
          </>
        }
        products={relatedProducts(product, 8)}
        href={`/shop?category=${encodeURIComponent(product.category)}`}
        hrefLabel={`All ${product.category}`}
      />
    </>
  );
}
