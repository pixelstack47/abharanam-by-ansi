# Abharanam by Ansi — Jewels That Celebrate You

A premium jewellery e-commerce platform: a Next.js storefront + admin dashboard
backed by a standalone Express/MongoDB API. The design system is drawn from the
Abharanam badge logo — oxblood maroon, antique gold and warm cream — in
editorial layouts with cinematic imagery and Apple-level simplicity.

There is **no online payment gateway by design**: checkout creates the order in
MongoDB and hands the customer to WhatsApp with the full order summary, where
the order is confirmed person-to-person.

## Architecture

```
├── src/            Next.js 16 frontend (storefront + /admin dashboard)
│                   — pure REST client, holds no credentials or DB code
└── backend/        Standalone Express + Mongoose API server (port 5000)
                    — MongoDB, JWT auth, S3 uploads, WhatsApp order handoff
```

The browser only ever calls same-origin `/api/...` URLs; `next.config.ts`
rewrites them to the backend, so the httpOnly auth cookie flows automatically
and no CORS setup is needed. Server components fetch the backend directly via
`src/lib/api.ts`.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript,
  Tailwind CSS v4, Framer Motion, Lucide, `next/font` (Cormorant Garamond + Inter)
- **Backend**: Express 4 + Mongoose 8 on MongoDB Atlas, JWT (jose) auth with
  bcrypt password hashing, AWS S3 presigned uploads + an image proxy,
  TypeScript executed natively by Node ≥ 22.18 (type stripping — no build step)

## Run

Two terminals (backend first):

```bash
# 1. Backend API — http://localhost:5000
cd backend
cp .env.example .env    # fill in MongoDB, AWS, JWT secret, admin credentials
npm install
npm run seed            # 36 products + the admin account (idempotent)
npm run dev

# 2. Frontend — http://localhost:3000
cp .env.example .env.local
npm install
npm run dev
```

`npm run build && npm start` serves the production frontend. The backend's
`npm start` runs it without the file watcher.

## Features

### Storefront
- Cinematic homepage (parallax hero, category tiles, carousels, bridal feature,
  gallery, testimonials) — all product data served live from MongoDB
- `/shop` — URL-driven filters (category, price, material, collection,
  availability, rating) + sorting
- `/product/[slug]` — gallery, accordions, related products, Product JSON-LD
- Slide-out cart with free-shipping progress (free ≥ ₹1,999, else ₹99),
  wishlist, live search overlay — cart/wishlist persist in `localStorage`
- **Checkout → WhatsApp**: address form → order saved to MongoDB → WhatsApp
  opens pre-filled with the order summary → order-confirmation page
- Customer accounts: register/login, order history, profile

### Admin dashboard (`/admin`, admin accounts only)
- Overview: revenue, order/product/user counts, orders by status, recent orders
- **Products**: full CRUD with multi-image upload to S3 (presigned PUTs served
  back through the API's image proxy), stock/new/bestseller flags
- **Orders**: status workflow (pending → confirmed → shipped → delivered /
  cancelled), order detail with a direct WhatsApp link to the customer
- **Users**: search, promote/demote admins, block/unblock, delete

### API
REST endpoints under `/api` — auth, products, orders, users, uploads, stats,
images. See `backend/README.md` for the route table. Prices and totals are
always recomputed server-side; client-supplied prices are never trusted.

## SEO & Accessibility

Dynamic `sitemap.xml` from the live catalogue, `robots.ts`, per-page canonicals,
branded Open Graph image, JSON-LD (Organization/WebSite/Product). Skip links,
focus-trapped overlays, `prefers-reduced-motion`, WCAG AA contrast.

## Structure

```
src/
  app/           storefront routes + /admin, /checkout, /login, /account …
  components/    home/ shop/ products/ cart/ search/ wishlist/ layout/ admin/ ui/
  data/          site.ts (categories, collections, copy)
  lib/           store.tsx (cart/wishlist/auth context), api.ts, utils.ts
  types/         shared TypeScript models
backend/
  src/           index.ts, config, db, models/, routes/, lib/, seed
```

Product photography via Unsplash (demo content).
