import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { keysWork } from "@/lib/gateway";
import { lockSecret } from "@/lib/secretbox";

// GET: is the creator's Razorpay connected? Never returns the secret.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await one<{ key_id: string }>("SELECT key_id FROM creator_gateways WHERE user_id = $1 AND provider = 'razorpay'", [session.userId]);
  return NextResponse.json({ connected: !!row, keyId: row?.key_id ?? null, mode: row?.key_id.startsWith("rzp_test_") ? "test" : "live" });
}

// POST {keyId, keySecret}: check the keys with Razorpay, then store them locked.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`gateway:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { keyId?: string; keySecret?: string };
  const keyId = String(b.keyId ?? "").trim();
  const secret = String(b.keySecret ?? "").trim();
  if (!/^rzp_(test|live)_[A-Za-z0-9]{8,30}$/.test(keyId) || secret.length < 10 || secret.length > 80) {
    return NextResponse.json({ error: "Paste the Key ID (starts with rzp_live_ or rzp_test_) and its Key Secret" }, { status: 400 });
  }
  if (!(await keysWork({ keyId, secret }))) {
    return NextResponse.json({ error: "Razorpay did not accept these keys. Check you copied both the Key ID and the Key Secret." }, { status: 400 });
  }
  await run(
    "INSERT INTO creator_gateways (user_id, provider, key_id, secret_enc, created_at) VALUES ($1,'razorpay',$2,$3,$4) ON CONFLICT (user_id, provider) DO UPDATE SET key_id = EXCLUDED.key_id, secret_enc = EXCLUDED.secret_enc, created_at = EXCLUDED.created_at",
    [session.userId, keyId, lockSecret(secret), Date.now()],
  );
  return NextResponse.json({ ok: true, connected: true, keyId, mode: keyId.startsWith("rzp_test_") ? "test" : "live" });
}

// DELETE: disconnect and forget the keys.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  await run("DELETE FROM creator_gateways WHERE user_id = $1 AND provider = 'razorpay'", [session.userId]);
  return NextResponse.json({ ok: true });
}
