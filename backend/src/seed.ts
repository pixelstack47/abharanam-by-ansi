/**
 * Idempotent database seeder: `npm run seed`.
 *
 * - Products: upserted by slug with $setOnInsert — re-running only inserts
 *   catalogue entries that are missing and NEVER overwrites admin edits.
 * - Categories/collections/materials: upserted by name with $setOnInsert
 *   (sortOrder = array index) — same rule: admin edits and deletions are
 *   never clobbered.
 * - Admin user: upserted from ADMIN_EMAIL/ADMIN_PASSWORD — password and role
 *   are refreshed on every run so the .env credentials always work.
 */
import mongoose from "mongoose";
import { config } from "./config.ts";
import { connectDB } from "./db.ts";
import { Category } from "./models/Category.ts";
import { Collection } from "./models/Collection.ts";
import { Material } from "./models/Material.ts";
import { Product } from "./models/Product.ts";
import { User } from "./models/User.ts";
import { hashPassword } from "./lib/auth.ts";
import { seedCategories, seedCollections, seedProducts } from "./seed-data.ts";
import { MATERIALS } from "./types.ts";

async function seedCatalogue(): Promise<void> {
  const ops = seedProducts.map((product) => {
    const { collection, ...rest } = product;
    return {
      updateOne: {
        filter: { slug: product.slug },
        // $setOnInsert only — existing documents are left untouched.
        update: { $setOnInsert: { ...rest, collectionName: collection } },
        upsert: true,
      },
    };
  });

  const result = await Product.bulkWrite(ops, { ordered: false });
  const inserted = result.upsertedCount ?? 0;
  const total = await Product.countDocuments();
  console.log(
    `[seed] products: ${inserted} inserted, ` +
      `${seedProducts.length - inserted} already present (catalogue total: ${total})`
  );
}

async function seedTaxonomy(): Promise<void> {
  const categoryOps = seedCategories.map((category, index) => ({
    updateOne: {
      filter: { name: category.name },
      // $setOnInsert only — existing documents are left untouched.
      update: { $setOnInsert: { ...category, sortOrder: index } },
      upsert: true,
    },
  }));
  const categoryResult = await Category.bulkWrite(categoryOps, { ordered: false });
  const categoriesInserted = categoryResult.upsertedCount ?? 0;
  const categoryTotal = await Category.countDocuments();
  console.log(
    `[seed] categories: ${categoriesInserted} inserted, ` +
      `${seedCategories.length - categoriesInserted} already present (total: ${categoryTotal})`
  );

  const collectionOps = seedCollections.map((collection, index) => ({
    updateOne: {
      filter: { name: collection.name },
      // $setOnInsert only — existing documents are left untouched.
      update: { $setOnInsert: { ...collection, sortOrder: index } },
      upsert: true,
    },
  }));
  const collectionResult = await Collection.bulkWrite(collectionOps, {
    ordered: false,
  });
  const collectionsInserted = collectionResult.upsertedCount ?? 0;
  const collectionTotal = await Collection.countDocuments();
  console.log(
    `[seed] collections: ${collectionsInserted} inserted, ` +
      `${seedCollections.length - collectionsInserted} already present (total: ${collectionTotal})`
  );

  const materialOps = MATERIALS.map((name, index) => ({
    updateOne: {
      filter: { name },
      // $setOnInsert only — existing documents are left untouched.
      update: { $setOnInsert: { name, sortOrder: index } },
      upsert: true,
    },
  }));
  const materialResult = await Material.bulkWrite(materialOps, { ordered: false });
  const materialsInserted = materialResult.upsertedCount ?? 0;
  const materialTotal = await Material.countDocuments();
  console.log(
    `[seed] materials: ${materialsInserted} inserted, ` +
      `${MATERIALS.length - materialsInserted} already present (total: ${materialTotal})`
  );
}

async function seedAdmin(): Promise<void> {
  if (!config.adminEmail || !config.adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env to seed the admin user."
    );
  }

  const passwordHash = await hashPassword(config.adminPassword);
  const admin = await User.findOneAndUpdate(
    { email: config.adminEmail.toLowerCase() },
    {
      $set: { passwordHash, role: "admin", blocked: false },
      $setOnInsert: { name: "Abharanam Admin" },
    },
    { new: true, upsert: true }
  );
  console.log(`[seed] admin user ready: ${admin.email} (role: ${admin.role})`);
}

async function main(): Promise<void> {
  await connectDB();
  await seedCatalogue();
  await seedTaxonomy();
  await seedAdmin();
  await mongoose.disconnect();
  console.log("[seed] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
