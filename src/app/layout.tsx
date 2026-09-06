import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchOverlay } from "@/components/search/search-overlay";
import { QuickView } from "@/components/products/quick-view";
import { LuxeCursor } from "@/components/ui/cursor";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/data/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "jewellery",
    "luxury jewellery",
    "anti-tarnish jewellery",
    "bridal jewellery",
    "gold plated necklace",
    "kundan",
    "temple jewellery",
    "India",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#6b1220",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <StoreProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-5 focus:py-3 focus:text-xs focus:uppercase focus:tracking-luxe-sm focus:text-ivory"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="min-h-screen">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <CartDrawer />
          <SearchOverlay />
          <QuickView />
          <LuxeCursor />
        </StoreProvider>
      </body>
    </html>
  );
}
