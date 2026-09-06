/**
 * Abharanam API — standalone Express server (Node 24 native TypeScript).
 * Boot: `npm run dev` (watch) or `npm start`. Seed first: `npm run seed`.
 */
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.ts";
import { connectDB } from "./db.ts";
import { attachUser, requireAdmin, requireUser } from "./lib/auth.ts";

import authRouter from "./routes/auth.ts";
import configRouter from "./routes/config.ts";
import accountRouter from "./routes/account.ts";
import wishlistRouter from "./routes/wishlist.ts";
import cartRouter from "./routes/cart.ts";
import productsRouter from "./routes/products.ts";
import ordersRouter from "./routes/orders.ts";
import { adminReviewsRouter, productReviewsRouter } from "./routes/reviews.ts";
import usersRouter from "./routes/users.ts";
import uploadsRouter from "./routes/uploads.ts";
import statsRouter from "./routes/stats.ts";
import imagesRouter from "./routes/images.ts";
import {
  adminCategoriesRouter,
  adminCollectionsRouter,
  adminMaterialsRouter,
  categoriesRouter,
  collectionsRouter,
  materialsRouter,
} from "./routes/taxonomy.ts";

const app = express();

app.set("trust proxy", 1);
app.use(cors({ origin: config.frontendOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(attachUser);

// Health check (inline).
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Public + mixed routers.
app.use("/api/auth", authRouter);
app.use("/api/config", configRouter);
app.use("/api/account", requireUser, accountRouter);
app.use("/api/wishlist", requireUser, wishlistRouter);
app.use("/api/cart", requireUser, cartRouter);
// Reviews before the products router so /:slug/reviews is matched here first.
app.use("/api/products/:slug/reviews", productReviewsRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/images", imagesRouter);

// Admin routers — requireAdmin at the mount point as defence in depth
// (harmless if the routers also enforce it themselves).
app.use("/api/admin/users", requireAdmin, usersRouter);
app.use("/api/admin/reviews", requireAdmin, adminReviewsRouter);
app.use("/api/admin/uploads", requireAdmin, uploadsRouter);
app.use("/api/admin/stats", requireAdmin, statsRouter);
app.use("/api/admin/categories", requireAdmin, adminCategoriesRouter);
app.use("/api/admin/collections", requireAdmin, adminCollectionsRouter);
app.use("/api/admin/materials", requireAdmin, adminMaterialsRouter);

// 404 fallback.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler (4 args required for express to register it).
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const anyErr = err as { status?: unknown; statusCode?: unknown; message?: unknown };
  const status =
    typeof anyErr?.status === "number"
      ? anyErr.status
      : typeof anyErr?.statusCode === "number"
        ? anyErr.statusCode
        : 500;
  if (status >= 500) console.error("[api] unhandled error:", err);
  const message =
    status < 500 && typeof anyErr?.message === "string" && anyErr.message
      ? anyErr.message
      : "Internal server error";
  res.status(status).json({ error: message });
});

async function main(): Promise<void> {
  await connectDB();
  app.listen(config.port, () => {
    console.log("");
    console.log("  ✦ Abharanam API");
    console.log(`  → listening on http://localhost:${config.port}`);
    console.log(`  → health:      http://localhost:${config.port}/api/health`);
    console.log(`  → CORS origin: ${config.frontendOrigin}`);
    console.log("");
  });
}

main().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
