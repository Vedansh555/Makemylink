import crypto from "crypto";

/**
 * Locks a secret (like a creator's Razorpay key) before it goes into the database, using AES-256-GCM.
 * The lock key comes from PAYOUT_KEY_SECRET, or SESSION_SECRET if that is not set.
 * Changing that value later makes stored secrets unreadable: creators would have to reconnect.
 */
function key(): Buffer {
  const base = process.env.PAYOUT_KEY_SECRET || process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev_makemylink_session_secret_default_key_32_bytes_min");
  if (!base) throw new Error("PAYOUT_KEY_SECRET or SESSION_SECRET is missing");
  return crypto.createHash("sha256").update(`showz-payout:${base}`).digest();
}

export function lockSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function unlockSecret(box: string): string | null {
  try {
    const [iv, tag, enc] = box.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = crypto.createDecipheriv("aes-256-gcm", key(), iv!);
    d.setAuthTag(tag!);
    return Buffer.concat([d.update(enc!), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
