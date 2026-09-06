/**
 * GET /api/config — public, non-sensitive storefront configuration.
 *
 * Lets the frontend mirror env-driven values (like the GST rate used for the
 * included-tax breakout at checkout) without hardcoding them client-side.
 */
import { Router } from "express";
import { config } from "../config.ts";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ gstRatePercent: config.gstRatePercent });
});

export const configRouter = router;
export default router;
