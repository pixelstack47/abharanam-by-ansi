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
 * - Demo users/reviews: upserted by email / (productId, userId) with
 *   $setOnInsert — same rule as above, never clobbers admin or customer edits.
 * - Demo orders: seeded before reviews and skipped when the customer already
 *   has an order for the product. Review.verified is DERIVED from them via
 *   isVerifiedBuyer() and reconciled with $set on every run, so the
 *   "verified purchase" badge always reflects a real order.
 */
import mongoose from "mongoose";
import { config } from "./config.ts";
import { connectDB } from "./db.ts";
import { Category } from "./models/Category.ts";
import { Collection } from "./models/Collection.ts";
import { Material } from "./models/Material.ts";
import { Product } from "./models/Product.ts";
import { User } from "./models/User.ts";
import { Order } from "./models/Order.ts";
import { nextOrderNumber } from "./models/Counter.ts";
import {
  Review,
  isVerifiedBuyer,
  recomputeProductRating,
} from "./models/Review.ts";
import { hashPassword } from "./lib/auth.ts";
import {
  seedCategories,
  seedCollections,
  seedOrders,
  seedProducts,
  seedReviews,
  seedUsers,
} from "./seed-data.ts";
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

async function seedDemoUsers(): Promise<void> {
  const ops = await Promise.all(
    seedUsers.map(async (user) => ({
      updateOne: {
        filter: { email: user.email.toLowerCase() },
        // $setOnInsert only — an admin blocking/editing this user afterwards
        // is never clobbered by a re-run.
        update: {
          $setOnInsert: {
            name: user.name,
            email: user.email.toLowerCase(),
            phone: user.phone,
            passwordHash: await hashPassword(user.password),
            role: "customer" as const,
          },
        },
        upsert: true,
      },
    }))
  );

  const result = await User.bulkWrite(ops, { ordered: false });
  const inserted = result.upsertedCount ?? 0;
  console.log(
    `[seed] demo users: ${inserted} inserted, ${seedUsers.length - inserted} already present`
  );
}

/**
 * Demo orders — what makes the "verified purchase" badge real. Totals, GST
 * and shipping are recomputed from the catalogue with the SAME arithmetic as
 * POST /api/orders, so these are indistinguishable from checkout output.
 *
 * Idempotency: an order is skipped when the user already has one containing
 * its first item, so a re-run never duplicates (and never fights a real
 * order the customer placed for that product).
 */
async function seedDemoOrders(): Promise<void> {
  const emails = seedOrders.map((o) => o.userEmail.toLowerCase());
  const slugs = [...new Set(seedOrders.flatMap((o) => o.items.map((i) => i.slug)))];
  const [users, products] = await Promise.all([
    User.find({ email: { $in: emails } }),
    Product.find({ slug: { $in: slugs } }),
  ]);
  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  let inserted = 0;
  let skipped = 0;
  for (const seedOrder of seedOrders) {
    const user = userByEmail.get(seedOrder.userEmail.toLowerCase());
    if (!user) {
      console.warn(`[seed] skipping order: missing user ${seedOrder.userEmail}`);
      continue;
    }

    const items = [];
    for (const line of seedOrder.items) {
      const product = productBySlug.get(line.slug);
      if (!product) {
        console.warn(`[seed] skipping order line: missing product ${line.slug}`);
        continue;
      }
      items.push({
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images?.[0] ?? "",
        price: product.price,
        quantity: line.quantity,
      });
    }
    if (items.length === 0) continue;

    // Already has an order for this product — nothing to do.
    if (await Order.exists({ userId: user._id, "items.slug": items[0].slug })) {
      skipped++;
      continue;
    }

    // Same arithmetic as POST /api/orders: prices are GST-INCLUSIVE, so the
    // tax is broken OUT of the subtotal rather than added on top.
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFee = subtotal >= 1999 ? 0 : 99;
    const gstRate = config.gstRatePercent;
    const gstAmount = Math.round((subtotal * gstRate) / (100 + gstRate));

    await Order.create({
      orderNumber: await nextOrderNumber(),
      userId: user._id,
      customer: {
        name: user.name,
        phone: user.phone ?? "9000000000",
        email: user.email,
        address: seedOrder.address,
      },
      items,
      subtotal,
      gstRate,
      gstAmount,
      shippingFee,
      total: subtotal + shippingFee,
      status: seedOrder.status,
    });
    inserted++;
  }

  console.log(
    `[seed] demo orders: ${inserted} inserted, ${skipped} already present`
  );
}

async function seedDemoReviews(): Promise<void> {
  const emails = [...new Set(seedReviews.map((r) => r.userEmail))];
  const slugs = [...new Set(seedReviews.map((r) => r.productSlug))];
  const [users, products] = await Promise.all([
    User.find({ email: { $in: emails.map((e) => e.toLowerCase()) } }),
    Product.find({ slug: { $in: slugs } }),
  ]);
  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  const ops = [];
  for (const review of seedReviews) {
    const user = userByEmail.get(review.userEmail.toLowerCase());
    const product = productBySlug.get(review.productSlug);
    if (!user || !product) {
      console.warn(
        `[seed] skipping review: missing ${!user ? "user " + review.userEmail : "product " + review.productSlug}`
      );
      continue;
    }
    // DERIVED from the orders above using the same helper the API uses —
    // never hand-written, so the badge always reflects a real purchase.
    const verified = await isVerifiedBuyer(user._id, product.slug);
    ops.push({
      updateOne: {
        filter: { productId: product._id, userId: user._id },
        update: {
          // $setOnInsert for the human-authored fields — a customer or admin
          // editing this review afterwards is never clobbered by a re-run.
          $setOnInsert: {
            productId: product._id,
            userId: user._id,
            name: user.name,
            rating: review.rating,
            title: review.title,
            body: review.body,
          },
          // $set for the DERIVED flag: reconciled on every run so it can
          // never drift from the orders, exactly like recomputeProductRating.
          $set: { verified },
        },
        upsert: true,
      },
    });
  }

  const result = await Review.bulkWrite(ops, { ordered: false });
  const inserted = result.upsertedCount ?? 0;
  const verifiedCount = ops.filter((op) => op.updateOne.update.$set.verified).length;
  console.log(
    `[seed] demo reviews: ${inserted} inserted, ${ops.length - inserted} already present ` +
      `(${verifiedCount}/${ops.length} verified by a real order)`
  );

  const affectedProductIds = [
    ...new Set(ops.map((op) => String(op.updateOne.filter.productId))),
  ];
  await Promise.all(affectedProductIds.map((id) => recomputeProductRating(id)));
}

async function main(): Promise<void> {
  await connectDB();
  await seedCatalogue();
  await seedTaxonomy();
  await seedAdmin();
  await seedDemoUsers();
  // Orders BEFORE reviews — the verified badge is derived from them.
  await seedDemoOrders();
  await seedDemoReviews();
  await mongoose.disconnect();
  console.log("[seed] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
