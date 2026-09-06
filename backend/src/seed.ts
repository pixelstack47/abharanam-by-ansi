/**
 * Idempotent database seeder: `npm run seed`.
 *
 * - Products: upserted by slug with $setOnInsert — re-running only inserts
 *   catalogue entries that are missing and NEVER overwrites admin edits.
 * - Admin user: upserted from ADMIN_EMAIL/ADMIN_PASSWORD — password and role
 *   are refreshed on every run so the .env credentials always work.
 */
import mongoose from "mongoose";
import { config } from "./config.ts";
import { connectDB } from "./db.ts";
import { Product } from "./models/Product.ts";
import { User } from "./models/User.ts";
import { hashPassword } from "./lib/auth.ts";
import { seedProducts } from "./seed-data.ts";

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
  await seedAdmin();
  await mongoose.disconnect();
  console.log("[seed] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
