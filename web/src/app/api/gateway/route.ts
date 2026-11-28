import { NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { keysWork, paypalKeysWork } from "@/lib/gateway";
import { lockSecret } from "@/lib/secretbox";
import { createHook, hookForUser, hookUrl } from "@/lib/linkWatch";

type Status = { connected: boolean; keyId: string | null; mode: "test" | "live" };
const none: Status = { connected: false, keyId: null, mode: "live" };

// GET: which of the creator's payment accounts are connected. Never returns a secret.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await all<{ provider: string; key_id: string }>("SELECT provider, key_id FROM creator_gateways WHERE user_id = $1", [session.userId]);
  const razorpay = rows.find((r) => r.provider === "razorpay");
  const paypal = rows.find((r) => r.provider === "paypal") ?? rows.find((r) => r.provider === "paypal_sandbox");
  const hook = await hookForUser(session.userId);
  return NextResponse.json({
    // The webhook secret is the creator's to paste into their own Razorpay, so it is shown back to them.
    hook: hook ? { connected: true, url: hookUrl(hook.hookId), secret: hook.secret } : { connected: false },
    razorpay: razorpay ? { connected: true, keyId: razorpay.key_id, mode: razorpay.key_id.startsWith("rzp_test_") ? "test" : "live" } satisfies Status : none,
    paypal: paypal ? { connected: true, keyId: paypal.key_id, mode: paypal.provider === "paypal_sandbox" ? "test" : "live" } satisfies Status : none,
  });
}

// POST {provider: "razorpay", keyId, keySecret} or {provider: "paypal", clientId, clientSecret, sandbox}:
// check the keys with the provider, then store them locked.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`gateway:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { provider?: string; keyId?: string; keySecret?: string; clientId?: string; clientSecret?: string; sandbox?: boolean };

  if (b.provider === "hook") {
    const h = await createHook(session.userId);
    return NextResponse.json({ ok: true, url: hookUrl(h.hookId), secret: h.secret });
  }

  if (b.provider === "paypal") {
    const clientId = String(b.clientId ?? "").trim();
    const secret = String(b.clientSecret ?? "").trim();
    const sandbox = b.sandbox === true;
    if (!/^[A-Za-z0-9_-]{20,120}$/.test(clientId) || !/^[A-Za-z0-9_-]{20,120}$/.test(secret)) {
      return NextResponse.json({ error: "Paste the Client ID and the Secret from your PayPal app" }, { status: 400 });
    }
    if (!(await paypalKeysWork({ clientId, secret, sandbox }))) {
      return NextResponse.json({ error: `PayPal did not accept these keys. Check they are ${sandbox ? "sandbox" : "live"} keys and that you copied both.` }, { status: 400 });
    }
    await run("DELETE FROM creator_gateways WHERE user_id = $1 AND provider IN ('paypal','paypal_sandbox')", [session.userId]);
    await run("INSERT INTO creator_gateways (user_id, provider, key_id, secret_enc, created_at) VALUES ($1,$2,$3,$4,$5)", [session.userId, sandbox ? "paypal_sandbox" : "paypal", clientId, lockSecret(secret), Date.now()]);
    return NextResponse.json({ ok: true });
  }

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
  return NextResponse.json({ ok: true });
}

// DELETE ?provider=razorpay|paypal: disconnect and forget the keys.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  const provider = new URL(req.url).searchParams.get("provider");
  if (provider === "hook") await run("DELETE FROM creator_gateways WHERE user_id = $1 AND provider = 'rzp_hook'", [session.userId]);
  else if (provider === "paypal") await run("DELETE FROM creator_gateways WHERE user_id = $1 AND provider IN ('paypal','paypal_sandbox')", [session.userId]);
  else await run("DELETE FROM creator_gateways WHERE user_id = $1 AND provider = 'razorpay'", [session.userId]);
  return NextResponse.json({ ok: true });
}
