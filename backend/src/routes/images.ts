// Public image proxy — mount at /api/images (see src/index.ts).
//   GET /* — streams the S3 object whose key is the path after /api/images/.
//   Keys MUST start with "products/" (anything else is a 404), responses carry
//   the object's Content-Type and an immutable one-year Cache-Control.
import { Router } from "express";
import type { Readable } from "node:stream";
import { getObject } from "../lib/s3.ts";
import { wrap } from "../lib/wrap.ts";

const router = Router();

function isMissingKeyError(err: unknown): boolean {
  const e = err as
    | { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } }
    | null;
  return (
    e?.name === "NoSuchKey" ||
    e?.name === "NotFound" ||
    e?.Code === "NoSuchKey" ||
    e?.$metadata?.httpStatusCode === 404
  );
}

router.get(
  "/*",
  wrap(async (req, res) => {
    const params = req.params as Record<string, string | undefined>;
    const key = (params["0"] ?? "").replace(/^\/+/, "");

    // Only product images are exposed; never proxy arbitrary bucket keys.
    if (!key.startsWith("products/") || key.includes("..")) {
      return res.status(404).json({ error: "Not found" });
    }

    let object;
    try {
      object = await getObject(key);
    } catch (err) {
      if (isMissingKeyError(err)) {
        return res.status(404).json({ error: "Not found" });
      }
      throw err;
    }

    const body = object.Body;
    if (!body) return res.status(404).json({ error: "Not found" });

    res.setHeader(
      "Content-Type",
      object.ContentType ?? "application/octet-stream",
    );
    if (object.ContentLength !== undefined) {
      res.setHeader("Content-Length", String(object.ContentLength));
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const stream = body as unknown as Readable;
    stream.on("error", () => {
      // Headers may already be flushed mid-stream; just drop the connection.
      res.destroy();
    });
    stream.pipe(res);
  }),
);

export const imagesRouter = router;
export default router;
