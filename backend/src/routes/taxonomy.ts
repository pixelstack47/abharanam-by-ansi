// Taxonomy routes — DB-managed categories, collections & materials (see
// src/index.ts).
//   GET    /api/categories               public list w/ productCount -> { categories }
//   GET    /api/collections              public list w/ productCount -> { collections }
//   GET    /api/materials                public list w/ productCount -> { materials }
//   POST   /api/admin/categories         admin create                -> 201 { category }
//   PATCH  /api/admin/categories/:id     admin partial update; a rename
//                                        propagates to products      -> { category, updatedProducts }
//   DELETE /api/admin/categories/:id     admin delete; 409 while any
//                                        product still uses it       -> { ok: true }
//   ...and the same admin trios under /api/admin/collections and
//   /api/admin/materials.
//
// Products store taxonomy NAME strings (Product.category /
// Product.collectionName / Product.material), so renames run
// Product.updateMany before responding and deletes are guarded while
// products still reference the name.
import { Router } from "express";
import mongoose from "mongoose";
import { Category } from "../models/Category.ts";
import { Collection } from "../models/Collection.ts";
import { Material } from "../models/Material.ts";
import { Product } from "../models/Product.ts";
import { requireAdmin } from "../lib/auth.ts";
import { toCategory, toCollection, toMaterial } from "../serializers.ts";
import { wrap } from "../lib/wrap.ts";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive exact-name filter for duplicate checks. */
function sameName(name: string): { $regex: string; $options: string } {
  return { $regex: `^${escapeRegex(name)}$`, $options: "i" };
}

/** One $group over products → Map of taxonomy name to product count. */
async function productCountsBy(
  field: "category" | "collectionName" | "material",
): Promise<Map<string, number>> {
  const rows = await Product.aggregate<{ _id: unknown; count: number }>([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

/**
 * Validates a category/collection create/patch body: the given string fields
 * must be non-empty (all required unless partial), sortOrder must be a
 * number when present (defaults to 0 on create). Never accepts `id`.
 */
function parseTaxonomyBody(
  raw: unknown,
  fields: readonly string[],
  partial: boolean,
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request body." };
  }
  const body = raw as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  for (const key of fields) {
    const v = body[key];
    if (v === undefined) {
      if (!partial) return { ok: false, error: `Missing required field: ${key}.` };
      continue;
    }
    if (typeof v !== "string" || v.trim() === "") {
      return { ok: false, error: `Invalid value for ${key}.` };
    }
    data[key] = v.trim();
  }

  if (body.sortOrder === undefined) {
    if (!partial) data.sortOrder = 0;
  } else {
    const n = Number(body.sortOrder);
    if (!Number.isFinite(n)) {
      return { ok: false, error: "Sort order must be a number." };
    }
    data.sortOrder = n;
  }

  return { ok: true, data };
}

const CATEGORY_FIELDS = ["name", "image", "blurb"] as const;
const COLLECTION_FIELDS = ["name", "title", "description", "image"] as const;
const MATERIAL_FIELDS = ["name"] as const;

// ---------------------------------------------------------------------------
// public routers
// ---------------------------------------------------------------------------

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  wrap(async (_req, res) => {
    const [docs, counts] = await Promise.all([
      Category.find().sort({ sortOrder: 1, name: 1 }),
      productCountsBy("category"),
    ]);
    return res.json({
      categories: docs.map((doc) => toCategory(doc, counts.get(doc.name) ?? 0)),
    });
  }),
);

export const collectionsRouter = Router();

collectionsRouter.get(
  "/",
  wrap(async (_req, res) => {
    const [docs, counts] = await Promise.all([
      Collection.find().sort({ sortOrder: 1, name: 1 }),
      productCountsBy("collectionName"),
    ]);
    return res.json({
      collections: docs.map((doc) => toCollection(doc, counts.get(doc.name) ?? 0)),
    });
  }),
);

export const materialsRouter = Router();

materialsRouter.get(
  "/",
  wrap(async (_req, res) => {
    const [docs, counts] = await Promise.all([
      Material.find().sort({ sortOrder: 1, name: 1 }),
      productCountsBy("material"),
    ]);
    return res.json({
      materials: docs.map((doc) => toMaterial(doc, counts.get(doc.name) ?? 0)),
    });
  }),
);

// ---------------------------------------------------------------------------
// admin: /api/admin/categories
// ---------------------------------------------------------------------------

export const adminCategoriesRouter = Router();

adminCategoriesRouter.use(requireAdmin);

adminCategoriesRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = parseTaxonomyBody(req.body, CATEGORY_FIELDS, false);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    if (await Category.exists({ name: sameName(String(parsed.data.name)) })) {
      return res
        .status(409)
        .json({ error: "A category with this name already exists." });
    }

    const doc = new Category(parsed.data);
    await doc.save();
    return res.status(201).json({ category: toCategory(doc, 0) });
  }),
);

adminCategoriesRouter.patch(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Category not found." });
    }
    const parsed = parseTaxonomyBody(req.body, CATEGORY_FIELDS, true);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const doc = await Category.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Category not found." });

    const oldName = doc.name;
    const newName =
      typeof parsed.data.name === "string" ? parsed.data.name : undefined;
    const renamed = newName !== undefined && newName !== oldName;
    if (
      renamed &&
      (await Category.exists({ _id: { $ne: doc._id }, name: sameName(newName) }))
    ) {
      return res
        .status(409)
        .json({ error: "A category with this name already exists." });
    }

    doc.set(parsed.data);
    await doc.save();

    // Propagate a rename to the products that store the old name string.
    let updatedProducts = 0;
    if (renamed) {
      const result = await Product.updateMany(
        { category: oldName },
        { $set: { category: newName } },
      );
      updatedProducts = result.modifiedCount ?? 0;
    }

    const productCount = await Product.countDocuments({ category: doc.name });
    return res.json({ category: toCategory(doc, productCount), updatedProducts });
  }),
);

adminCategoriesRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Category not found." });
    }
    const doc = await Category.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Category not found." });

    const inUse = await Product.countDocuments({ category: doc.name });
    if (inUse > 0) {
      return res.status(409).json({
        error: `${inUse} products still use this category. Reassign them first.`,
      });
    }

    await doc.deleteOne();
    return res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------
// admin: /api/admin/collections
// ---------------------------------------------------------------------------

export const adminCollectionsRouter = Router();

adminCollectionsRouter.use(requireAdmin);

adminCollectionsRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = parseTaxonomyBody(req.body, COLLECTION_FIELDS, false);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    if (await Collection.exists({ name: sameName(String(parsed.data.name)) })) {
      return res
        .status(409)
        .json({ error: "A collection with this name already exists." });
    }

    const doc = new Collection(parsed.data);
    await doc.save();
    return res.status(201).json({ collection: toCollection(doc, 0) });
  }),
);

adminCollectionsRouter.patch(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Collection not found." });
    }
    const parsed = parseTaxonomyBody(req.body, COLLECTION_FIELDS, true);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const doc = await Collection.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Collection not found." });

    const oldName = doc.name;
    const newName =
      typeof parsed.data.name === "string" ? parsed.data.name : undefined;
    const renamed = newName !== undefined && newName !== oldName;
    if (
      renamed &&
      (await Collection.exists({ _id: { $ne: doc._id }, name: sameName(newName) }))
    ) {
      return res
        .status(409)
        .json({ error: "A collection with this name already exists." });
    }

    doc.set(parsed.data);
    await doc.save();

    // Propagate a rename to the products that store the old name string.
    let updatedProducts = 0;
    if (renamed) {
      const result = await Product.updateMany(
        { collectionName: oldName },
        { $set: { collectionName: newName } },
      );
      updatedProducts = result.modifiedCount ?? 0;
    }

    const productCount = await Product.countDocuments({ collectionName: doc.name });
    return res.json({
      collection: toCollection(doc, productCount),
      updatedProducts,
    });
  }),
);

adminCollectionsRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Collection not found." });
    }
    const doc = await Collection.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Collection not found." });

    const inUse = await Product.countDocuments({ collectionName: doc.name });
    if (inUse > 0) {
      return res.status(409).json({
        error: `${inUse} products still use this collection. Reassign them first.`,
      });
    }

    await doc.deleteOne();
    return res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------
// admin: /api/admin/materials
// ---------------------------------------------------------------------------

export const adminMaterialsRouter = Router();

adminMaterialsRouter.use(requireAdmin);

adminMaterialsRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = parseTaxonomyBody(req.body, MATERIAL_FIELDS, false);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    if (await Material.exists({ name: sameName(String(parsed.data.name)) })) {
      return res
        .status(409)
        .json({ error: "A material with this name already exists." });
    }

    const doc = new Material(parsed.data);
    await doc.save();
    return res.status(201).json({ material: toMaterial(doc, 0) });
  }),
);

adminMaterialsRouter.patch(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Material not found." });
    }
    const parsed = parseTaxonomyBody(req.body, MATERIAL_FIELDS, true);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const doc = await Material.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Material not found." });

    const oldName = doc.name;
    const newName =
      typeof parsed.data.name === "string" ? parsed.data.name : undefined;
    const renamed = newName !== undefined && newName !== oldName;
    if (
      renamed &&
      (await Material.exists({ _id: { $ne: doc._id }, name: sameName(newName) }))
    ) {
      return res
        .status(409)
        .json({ error: "A material with this name already exists." });
    }

    doc.set(parsed.data);
    await doc.save();

    // Propagate a rename to the products that store the old name string.
    let updatedProducts = 0;
    if (renamed) {
      const result = await Product.updateMany(
        { material: oldName },
        { $set: { material: newName } },
      );
      updatedProducts = result.modifiedCount ?? 0;
    }

    const productCount = await Product.countDocuments({ material: doc.name });
    return res.json({ material: toMaterial(doc, productCount), updatedProducts });
  }),
);

adminMaterialsRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Material not found." });
    }
    const doc = await Material.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Material not found." });

    const inUse = await Product.countDocuments({ material: doc.name });
    if (inUse > 0) {
      return res.status(409).json({
        error: `${inUse} products still use this material. Reassign them first.`,
      });
    }

    await doc.deleteOne();
    return res.json({ ok: true });
  }),
);
