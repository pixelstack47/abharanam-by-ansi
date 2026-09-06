import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { FeaturedCategories } from "@/components/home/categories";
import { EditorialCollection } from "@/components/home/editorial";
import { BridalSection } from "@/components/home/bridal";
import { Stats } from "@/components/home/stats";
import { SocialGallery } from "@/components/home/gallery";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/home/newsletter";
import { ProductCarousel } from "@/components/products/product-carousel";
import { bestsellers, newArrivals } from "@/data/products";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/data/site";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kochi",
        addressRegion: "Kerala",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Hero />
      <Marquee />
      <FeaturedCategories />
      <ProductCarousel
        eyebrow="Just Landed"
        title={
          <>
            New <em className="italic">arrivals</em>
          </>
        }
        products={newArrivals}
        href="/shop?sort=newest"
        hrefLabel="View All New"
      />
      <EditorialCollection />
      <ProductCarousel
        eyebrow="Most Coveted"
        title={
          <>
            Trending <em className="italic">now</em>
          </>
        }
        products={bestsellers}
        href="/shop?sort=best-selling"
        hrefLabel="Shop Bestsellers"
        showRating
      />
      <BridalSection />
      <Stats />
      <SocialGallery />
      <Testimonials />
      <Newsletter />
    </>
  );
}
