# Abharanam by Ansi — Jewels That Celebrate You

A premium jewellery e-commerce frontend built with Next.js. The design system is drawn
from the Abharanam badge logo — oxblood maroon, antique gold and warm cream — in
editorial layouts with cinematic imagery and Apple-level simplicity.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first tokens in `globals.css`)
- **Framer Motion** — page reveals, parallax, drawers, counters, magnetic buttons, custom cursor
- **Lucide** icons, `next/image`, `next/font` (Cormorant Garamond + Inter)

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (all routes prerendered)
npm start       # serve the production build
```

## Features

- Cinematic full-screen hero with parallax, text reveal and floating light accents
- Transparent → glass sticky navbar; full-screen animated mobile menu; mobile bottom nav
- Editorial homepage: category tiles, new-arrivals & trending carousels, Heritage
  editorial spread, dark bridal feature, animated stats, masonry social gallery,
  testimonials, newsletter
- `/shop` — URL-driven filters (category, price, material, collection, availability,
  rating) + sorting, desktop sidebar and mobile filter drawer
- `/product/[slug]` — gallery, quantity, accordions, reviews, related products,
  Product JSON-LD, per-product Open Graph metadata
- Slide-out cart drawer with free-shipping progress; wishlist page with empty state;
  full-screen search overlay (recent + popular searches, live results)
- Cart, wishlist and recent searches persist in `localStorage` via a single
  React context store (`src/lib/store.tsx`) — ready to be swapped for a real backend

## SEO

`sitemap.ts` (40 URLs), `robots.ts`, per-page canonicals, a branded
`opengraph-image` generated at build time with the real brand fonts, SVG +
Apple touch icons, and JSON-LD (`Organization` + `WebSite` on the home page,
`Product` with `AggregateRating`/`Offer` on every product page).

## Accessibility

Verified in a real browser: skip-to-content link, `main` landmark, focus trapped
inside every overlay with focus restored to the trigger on close, Escape closes
the topmost overlay, `aria-modal` dialogs, alt text on every image, an
accessible name on every button, `prefers-reduced-motion` respected, and all
text meeting WCAG AA contrast — including text set over photography, which was
measured from rendered pixels rather than CSS values.

## Structure

```
src/
  app/           routes (home, shop, product/[slug], collections, wishlist, about, account)
  components/    home/ shop/ products/ cart/ search/ wishlist/ layout/ ui/
  data/          products.ts (36 products), site.ts (categories, collections, copy)
  lib/           store.tsx (cart/wishlist context), utils.ts (cn, INR formatting)
  types/         shared TypeScript models
```

Product photography via Unsplash (demo content).
