/**
 * Typed access to environment variables.
 *
 * Loaded via `node --env-file=.env` (see package.json scripts) — no dotenv
 * dependency needed. Missing required variables abort startup with a single
 * error listing everything that must be fixed.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Variables the server cannot run without. */
const REQUIRED = ["MONGODB_URI", "JWT_SECRET", "WHATSAPP_NUMBER"] as const;

const missing = REQUIRED.filter((name) => read(name) === undefined);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
      "Copy backend/.env.example to backend/.env and fill in the values."
  );
}

function must(name: string): string {
  const value = read(name);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  /** Port the API listens on (default 5000). */
  port: Number(read("PORT") ?? "5000"),
  /** Origin allowed for CORS with credentials (the Next.js frontend). */
  frontendOrigin: read("FRONTEND_ORIGIN") ?? "http://localhost:3000",
  /** MongoDB connection string (database name in the path). */
  mongodbUri: must("MONGODB_URI"),
  /** Secret used to sign auth JWTs (HS256). */
  jwtSecret: must("JWT_SECRET"),
  /** AWS credentials / bucket for product image uploads. Optional at boot —
   *  upload & image-proxy endpoints fail with a clear error if unset. */
  awsRegion: read("AWS_REGION") ?? "ap-south-1",
  awsAccessKeyId: read("AWS_ACCESS_KEY_ID") ?? "",
  awsSecretAccessKey: read("AWS_SECRET_ACCESS_KEY") ?? "",
  s3Bucket: read("S3_BUCKET") ?? "",
  /** Seed credentials for the initial admin account (required by `npm run seed`). */
  adminEmail: read("ADMIN_EMAIL") ?? "",
  adminPassword: read("ADMIN_PASSWORD") ?? "",
  /** WhatsApp number that receives order messages (country code + number, no "+"). */
  whatsappNumber: must("WHATSAPP_NUMBER"),
  /** GST rate (%) already included in product prices (breakout, not add-on). */
  gstRatePercent: Number(read("GST_RATE_PERCENT") ?? "3"),
  isProduction: process.env.NODE_ENV === "production",
} as const;

if (!Number.isInteger(config.port) || config.port <= 0) {
  throw new Error(`PORT must be a positive integer, got: ${process.env.PORT}`);
}

if (
  !Number.isFinite(config.gstRatePercent) ||
  config.gstRatePercent < 0 ||
  config.gstRatePercent > 28
) {
  throw new Error(
    `GST_RATE_PERCENT must be a number between 0 and 28, got: ${process.env.GST_RATE_PERCENT}`
  );
}
