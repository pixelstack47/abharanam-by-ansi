// Product routes — mount at /api/products (see src/index.ts).
//   GET    /            public list w/ filters, sort, pagination -> { products, total }
//   POST   /            admin create (slug generated if absent)  -> 201 { product }
//   GET    /:slug       public detail + related                  -> { product, related }
//   PATCH  /:slug       admin partial update                     -> { product }
//   DELETE /:slug       admin delete                             -> { ok: true }
import { Router } from "express";
import { Category } from "../models/Category.ts";
import { Collection } from "../models/Collection.ts";
import { Material } from "../models/Material.ts";
import { Product } from "../models/Product.ts";
import { requireAdmin } from "../lib/auth.ts";
import { toProduct } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function qstr(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function qnum(v: unknown): number | undefined {
  const s = qstr(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function qbool(v: unknown): boolean | undefined {
  if (typeof v !== "string") return undefined;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "product";
  let candidate = root;
  for (let i = 2; await Product.exists({ slug: candidate }); i += 1) {
    candidate = `${root}-${i}`;
  }
  return candidate;
}

const SORTS: Record<string, Record<string, 1 | -1>> = {
  featured: { isBestseller: -1, rating: -1 },
  newest: { isNew: -1, createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "best-selling": { reviewCount: -1 },
};

/**
 * Validates a product create/patch body. Client `collection` maps to the
 * `collectionName` model field. Never accepts `id`. Returns `$set` data plus
 * fields to `$unset` (compareAtPrice cleared with null/"").
 */
function parseProductBody(
  raw: unknown,
  partial: boolean,
):
  | { ok: true; data: Record<string, unknown>; unset: string[] }
  | { ok: false; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request body." };
  }
  const body = raw as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const unset: string[] = [];

  const strings: Array<[key: string, target: string, minLen: number]> = [
    ["name", "name", 2],
    // category/collection/material existence is checked against the DB by
    // the POST and PATCH handlers (see unknownTaxonomy).
    ["category", "category", 1],
    ["collection", "collectionName", 1],
    ["material", "material", 1],
  ];
  for (const [key, target, minLen] of strings) {
    const v = body[key];
    if (v === undefined) {
      if (!partial) return { ok: false, error: `Missing required field: ${key}.` };
      continue;
    }
    if (typeof v !== "string" || v.trim().length < minLen) {
      return { ok: false, error: `Invalid value for ${key}.` };
    }
    data[target] = v.trim();
  }

  if (body.price === undefined) {
    if (!partial) return { ok: false, error: "Missing required field: price." };
  } else {
    const n = Number(body.price);
    if (!Number.isFinite(n) || n <= 0) {
      return { ok: false, error: "Price must be a positive number." };
    }
    data.price = n;
  }

  if (body.compareAtPrice !== undefined) {
    if (body.compareAtPrice === null || body.compareAtPrice === "") {
      if (partial) unset.push("compareAtPrice");
    } else {
      const n = Number(body.compareAtPrice);
      if (!Number.isFinite(n) || n <= 0) {
        return { ok: false, error: "Compare-at price must be a positive number." };
      }
      data.compareAtPrice = n;
    }
  }

  if (body.images === undefined) {
    if (!partial) data.images = [];
  } else {
    if (
      !Array.isArray(body.images) ||
      body.images.some((img) => typeof img !== "string" || img.trim() === "")
    ) {
      return { ok: false, error: "Images must be an array of URL strings." };
    }
    data.images = (body.images as string[]).map((img) => img.trim());
  }

  for (const key of ["shortDescription", "description"] as const) {
    if (body[key] === undefined) {
      if (!partial) data[key] = "";
    } else if (typeof body[key] !== "string") {
      return { ok: false, error: `Invalid value for ${key}.` };
    } else {
      data[key] = (body[key] as string).trim();
    }
  }

  if (body.rating === undefined) {
    if (!partial) data.rating = 0;
  } else {
    const n = Number(body.rating);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      return { ok: false, error: "Rating must be a number between 0 and 5." };
    }
    data.rating = n;
  }

  if (body.reviewCount === undefined) {
    if (!partial) data.reviewCount = 0;
  } else {
    const n = Number(body.reviewCount);
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: "Review count must be a non-negative integer." };
    }
    data.reviewCount = n;
  }

  const booleans: Array<[key: string, fallback: boolean]> = [
    ["isNew", false],
    ["isBestseller", false],
    ["inStock", true],
  ];
  for (const [key, fallback] of booleans) {
    if (body[key] === undefined) {
      if (!partial) data[key] = fallback;
    } else if (typeof body[key] !== "boolean") {
      return { ok: false, error: `Invalid value for ${key}.` };
    } else {
      data[key] = body[key];
    }
  }

  if (body.tags === undefined) {
    if (!partial) data.tags = [];
  } else {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return { ok: false, error: "Tags must be an array of strings." };
    }
    data.tags = (body.tags as string[]).map((t) => t.trim()).filter(Boolean);
  }

  return { ok: true, data, unset };
}

/**
 * Category/collection/material values must exist in the DB (they are managed
 * from the admin dashboard). Returns the 400 error message, or null when valid.
 */
async function unknownTaxonomy(
  data: Record<string, unknown>,
): Promise<string | null> {
  if (
    data.category !== undefined &&
    !(await Category.exists({ name: String(data.category) }))
  ) {
    return "Unknown category. Manage categories in the admin dashboard.";
  }
  if (
    data.collectionName !== undefined &&
    !(await Collection.exists({ name: String(data.collectionName) }))
  ) {
    return "Unknown collection. Manage collections in the admin dashboard.";
  }
  if (
    data.material !== undefined &&
    !(await Material.exists({ name: String(data.material) }))
  ) {
    return "Unknown material. Manage materials in the admin dashboard.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------

router.get(
  "/",
  wrap(async (req, res) => {
    const q = req.query;
    const filter: Record<string, unknown> = {};

    const category = qstr(q.category);
    if (category) filter.category = category;
    const collection = qstr(q.collection);
    if (collection) filter.collectionName = collection;
    const material = qstr(q.material);
    if (material) filter.material = material;

    const minPrice = qnum(q.minPrice);
    const maxPrice = qnum(q.maxPrice);
    if (minPrice !== undefined || maxPrice !== undefined) {
      const price: Record<string, number> = {};
      if (minPrice !== undefined) price.$gte = minPrice;
      if (maxPrice !== undefined) price.$lte = maxPrice;
      filter.price = price;
    }

    const isNew = qbool(q.isNew);
    if (isNew !== undefined) filter.isNew = isNew ? true : { $ne: true };
    const isBestseller = qbool(q.isBestseller);
    if (isBestseller !== undefined) {
      filter.isBestseller = isBestseller ? true : { $ne: true };
    }

    const search = qstr(q.search);
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: rx }, { tags: rx }, { category: rx }, { material: rx }];
    }

    const sortKey = qstr(q.sort) ?? "featured";
    const sort = Object.hasOwn(SORTS, sortKey) ? SORTS[sortKey] : SORTS.featured;
    const limit = clampInt(qnum(q.limit) ?? 500, 1, 500);
    const page = Math.max(1, Math.trunc(qnum(q.page) ?? 1));

    const [total, docs] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    return res.json({ products: docs.map(toProduct), total });
  }),
);

router.post(
  "/",
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = parseProductBody(req.body, false);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const data = parsed.data;

    const taxonomyError = await unknownTaxonomy(data);
    if (taxonomyError) return res.status(400).json({ error: taxonomyError });

    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !slugify(body.slug)) {
        return res.status(400).json({ error: "Invalid slug." });
      }
      const slug = slugify(body.slug);
      if (await Product.exists({ slug })) {
        return res
          .status(409)
          .json({ error: "A product with this slug already exists." });
      }
      data.slug = slug;
    } else {
      data.slug = await uniqueSlug(slugify(String(data.name)));
    }

    const doc = new Product(data);
    await doc.save();
    return res.status(201).json({ product: toProduct(doc) });
  }),
);

router.get(
  "/:slug",
  wrap(async (req, res) => {
    const doc = await Product.findOne({ slug: req.params.slug });
    if (!doc) return res.status(404).json({ error: "Product not found." });
    const product = toProduct(doc);

    // Related: same category scores 2, same collection scores 1; top 8.
    const candidates = await Product.find({
      slug: { $ne: product.slug },
      $or: [{ category: product.category }, { collectionName: product.collection }],
    });
    const related = candidates
      .map(toProduct)
      .map((p) => ({
        p,
        score:
          (p.category === product.category ? 2 : 0) +
          (p.collection === product.collection ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
      .slice(0, 8)
      .map((entry) => entry.p);

    return res.json({ product, related });
  }),
);

router.patch(
  "/:slug",
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = parseProductBody(req.body, true);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const { data, unset } = parsed;

    const taxonomyError = await unknownTaxonomy(data);
    if (taxonomyError) return res.status(400).json({ error: taxonomyError });

    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !slugify(body.slug)) {
        return res.status(400).json({ error: "Invalid slug." });
      }
      const nextSlug = slugify(body.slug);
      if (
        nextSlug !== req.params.slug &&
        (await Product.exists({ slug: nextSlug }))
      ) {
        return res
          .status(409)
          .json({ error: "A product with this slug already exists." });
      }
      data.slug = nextSlug;
    }

    if (Object.keys(data).length === 0 && unset.length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(data).length > 0) update.$set = data;
    if (unset.length > 0) {
      update.$unset = Object.fromEntries(unset.map((key) => [key, 1]));
    }

    const doc = await Product.findOneAndUpdate({ slug: req.params.slug }, update, {
      new: true,
    });
    if (!doc) return res.status(404).json({ error: "Product not found." });
    return res.json({ product: toProduct(doc) });
  }),
);

router.delete(
  "/:slug",
  requireAdmin,
  wrap(async (req, res) => {
    const result = await Product.deleteOne({ slug: req.params.slug });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    return res.json({ ok: true });
  }),
);

export const productsRouter = router;
export default router;
