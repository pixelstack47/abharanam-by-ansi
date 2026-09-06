// Admin stats route — mount at /api/admin/stats (see src/index.ts).
//   GET / -> { productCount, orderCount, userCount, pendingOrders,
//              revenue (sum of total, non-cancelled), ordersByStatus }
import { Router } from "express";
import { Product } from "../models/Product.ts";
import { Order } from "../models/Order.ts";
import { User } from "../models/User.ts";
import { requireAdmin } from "../lib/auth.ts";
import { wrap } from "../lib/wrap.ts";
import type { OrderStatus } from "../types.ts";

const router = Router();

router.get(
  "/",
  requireAdmin,
  wrap(async (_req, res) => {
    const [productCount, orderCount, userCount, pendingOrders, revenueRows, statusRows] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Order.countDocuments({ status: "pending" }),
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, revenue: { $sum: "$total" } } },
        ]),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ]);

    const ordersByStatus: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const row of statusRows as Array<{ _id: string; count: number }>) {
      if (row._id in ordersByStatus) {
        ordersByStatus[row._id as OrderStatus] = row.count;
      }
    }

    const revenue =
      (revenueRows as Array<{ revenue?: number }>)[0]?.revenue ?? 0;

    return res.json({
      productCount,
      orderCount,
      userCount,
      pendingOrders,
      revenue,
      ordersByStatus,
    });
  }),
);

export const statsRouter = router;
export default router;
