// Admin upload routes — mount at /api/admin/uploads (see src/index.ts).
//   POST / { filename, contentType } (contentType must start "image/")
//     -> { key, uploadUrl (presigned PUT, 5 min), publicPath: "/api/images/" + key }
import { Router } from "express";
import { requireAdmin } from "../lib/auth.ts";
import { presignUpload } from "../lib/s3.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

router.post(
  "/",
  requireAdmin,
  wrap(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const filename =
      typeof body.filename === "string" ? body.filename.trim() : "";
    const contentType =
      typeof body.contentType === "string" ? body.contentType.trim() : "";

    if (!filename) {
      return res.status(400).json({ error: "filename is required." });
    }
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image uploads are allowed." });
    }

    const { key, uploadUrl } = await presignUpload(filename, contentType);
    return res.json({ key, uploadUrl, publicPath: `/api/images/${key}` });
  }),
);

export const uploadsRouter = router;
export default router;
