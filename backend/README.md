# Abharanam API

Standalone Express + MongoDB REST backend for the Abharanam by Ansi storefront.
Runs directly on Node 24's native TypeScript type stripping — no build step.
The Next.js frontend is a pure client: it proxies `/api/*` to this server via a
rewrite and never contains backend code.

## Setup

```bash
cd backend
cp .env.example .env    # then fill in the values
npm install
npm run seed            # idempotent: seeds the 36-product catalogue + admin user
npm run dev             # http://localhost:5000 (watch mode)
```

| Script          | What it does                                        |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Start with `--watch` and `--env-file=.env`          |
| `npm start`     | Start once (production)                             |
| `npm run seed`  | Upsert catalogue + admin user (safe to re-run — it never overwrites admin edits) |
| `npm run typecheck` | `tsc --noEmit`                                  |

Environment variables (see `.env.example`): `PORT`, `FRONTEND_ORIGIN`,
`MONGODB_URI`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
`S3_BUCKET`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WHATSAPP_NUMBER`.
`MONGODB_URI`, `JWT_SECRET` and `WHATSAPP_NUMBER` are required at boot; the AWS
variables are only needed for image upload/proxy endpoints.

Auth is a 30-day `ab_session` httpOnly cookie (JWT HS256). Errors are always
JSON: `{ "error": "..." }`.

## API

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| POST   | `/api/auth/register` | public | Create account, sets session cookie |
| POST   | `/api/auth/login` | public | Sign in, sets session cookie |
| POST   | `/api/auth/logout` | public | Clear session cookie |
| GET    | `/api/auth/me` | public | Current session user (or null) |
| GET    | `/api/products` | public | List/filter/sort/search catalogue |
| POST   | `/api/products` | admin | Create product |
| GET    | `/api/products/:slug` | public | Product + related products |
| PATCH  | `/api/products/:slug` | admin | Update product |
| DELETE | `/api/products/:slug` | admin | Delete product |
| POST   | `/api/orders` | public (guest OK) | Place order → order + WhatsApp URL |
| GET    | `/api/orders` | auth | Own orders (admin: all), `?status=&page=&limit=` |
| GET    | `/api/orders/:id` | public by id | Order + WhatsApp URL (confirmation page) |
| PATCH  | `/api/orders/:id` | admin | Update order status |
| GET    | `/api/admin/users` | admin | List users (`?search=&page=&limit=`) |
| PATCH  | `/api/admin/users/:id` | admin | Change role / block |
| DELETE | `/api/admin/users/:id` | admin | Delete user |
| POST   | `/api/admin/uploads` | admin | Presigned S3 PUT URL for an image |
| GET    | `/api/images/*` | public | S3 streaming proxy (`products/` keys only) |
| GET    | `/api/admin/stats` | admin | Dashboard counts + revenue |
| GET    | `/api/health` | public | `{ ok: true }` |

## Layout

```
src/
  index.ts        express bootstrap (cors, cookies, attachUser, routers)
  config.ts       typed env access (fails fast on missing vars)
  db.ts           mongoose connection
  types.ts        serialized API types (backend's own copy of the contract)
  serializers.ts  doc → API shape (toProduct/toOrder/toUser/toSessionUser)
  seed.ts         idempotent seeder        seed-data.ts  the 36-product catalogue
  models/         User, Product, Order, Counter (order-number sequence)
  lib/            auth.ts (bcrypt+jose+middlewares), s3.ts, whatsapp.ts
  routes/         auth, products, orders, users, uploads, stats, images
```

Note: mongoose reserves `collection`, so products store that field as
`collectionName` internally; serializers expose it as `collection`.
