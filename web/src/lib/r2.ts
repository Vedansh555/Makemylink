import { S3Client } from "@aws-sdk/client-s3";

/** Cloudflare R2 speaks the S3 protocol. Returns null until all R2_* keys are set, so uploads fall back to inline images. */
export function r2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) return null;
  return {
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL.replace(/\/$/, ""),
    client: new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    }),
  };
}
