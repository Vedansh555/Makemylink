import { NextResponse } from "next/server";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/session";
import { r2 } from "@/lib/r2";
import { rateLimit, sameOriginOnly } from "@/lib/security";

// POST /api/upload {type} — returns a short-lived link the browser uploads one picture (WebP or JPEG) to, plus the public address to save in the page.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`upload:${session.userId}`, 60, 60 * 60 * 1000);
  if (blocked) return blocked;
  const store = r2();
  if (!store) return NextResponse.json({ error: "Image storage is not set up" }, { status: 501 });

  const body = (await req.json().catch(() => ({}))) as { type?: string };
  const type = body.type === "image/webp" ? "image/webp" : "image/jpeg";
  const key = `u/${session.userId}/${crypto.randomUUID()}.${type === "image/webp" ? "webp" : "jpg"}`;
  const uploadUrl = await getSignedUrl(store.client, new PutObjectCommand({ Bucket: store.bucket, Key: key, ContentType: type }), { expiresIn: 300 });
  return NextResponse.json({ uploadUrl, publicUrl: `${store.publicUrl}/${key}` });
}
