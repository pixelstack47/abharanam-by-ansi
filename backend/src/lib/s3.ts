import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";
import { config } from "../config.ts";

let client: S3Client | null = null;

/** Lazily-created S3 client singleton. */
export function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: config.awsRegion,
      // Only pass explicit credentials when configured; otherwise let the
      // SDK fall back to its default provider chain.
      ...(config.awsAccessKeyId && config.awsSecretAccessKey
        ? {
            credentials: {
              accessKeyId: config.awsAccessKeyId,
              secretAccessKey: config.awsSecretAccessKey,
            },
          }
        : {}),
    });
  }
  return client;
}

function requireBucket(): string {
  if (!config.s3Bucket) {
    throw new Error("S3_BUCKET is not configured — set it in backend/.env");
  }
  return config.s3Bucket;
}

/** Sanitize a client-supplied filename into a safe S3 key segment. */
function safeName(filename: string): string {
  const base = filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base.replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "image";
}

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
}

/**
 * Create a presigned PUT URL (5 minutes) for a product image upload.
 * Keys always live under "products/" — the public image proxy only serves
 * that prefix.
 */
export async function presignUpload(
  filename: string,
  contentType: string
): Promise<PresignedUpload> {
  const bucket = requireBucket();
  const key = `products/${Date.now()}-${randomBytes(4).toString("hex")}-${safeName(filename)}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: 300 });
  return { key, uploadUrl };
}

/**
 * Fetch an object for the streaming image proxy. Throws the SDK's
 * `NoSuchKey` error when the key does not exist (callers map it to 404).
 */
export async function getObject(key: string): Promise<GetObjectCommandOutput> {
  return s3().send(
    new GetObjectCommand({ Bucket: requireBucket(), Key: key })
  );
}
