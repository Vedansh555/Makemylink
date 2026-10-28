import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "makemylink_session";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is missing");
    }
    // Fallback development secret if not provided
    return "dev_makemylink_session_secret_default_key_32_bytes_min";
  }
  if (secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return secret;
}

export interface SessionPayload {
  userId: string;
  /** Expiry, ms since epoch. */
  exp?: number;
}

const MAX_AGE_S = 60 * 60 * 24 * 365; // sliding: renewed on every visit to the editor

export function sign(payload: SessionPayload): string {
  const json = JSON.stringify({ ...payload, exp: Date.now() + MAX_AGE_S * 1000 });
  const base64 = Buffer.from(json, "utf-8").toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecret()).update(base64).digest("base64url");
  return `${base64}.${hmac}`;
}

export function verify(cookieValue: string): SessionPayload | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [base64, signature] = parts;
  const expectedHmac = crypto.createHmac("sha256", getSecret()).update(base64).digest("base64url");

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedHmac.length) return null;
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedHmac);
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    const data = JSON.parse(json) as SessionPayload;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
