import { createToken } from "./tokens";
import { sendMail } from "./mail";
import { SITE_URL } from "./site";

const wrap = (body: string) => `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.5">${body}<p style="color:#888;font-size:12px">Makemylink</p></div>`;
const button = (href: string, label: string) => `<p><a href="${href}" style="background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block">${label}</a></p><p style="font-size:12px;color:#666">Or paste this link: ${href}</p>`;

export async function sendVerifyEmail(userId: string, email: string) {
  const token = await createToken(userId, "verify", 3 * 86_400_000);
  const link = `${SITE_URL}/api/auth/verify?token=${token}`;
  console.log(`[verify-link] ${email} ${link}`); // visible in server logs until an email key is set
  return sendMail(email, "Confirm your email for Makemylink", wrap(`<h2>Confirm your email</h2><p>Tap the button to confirm this address. The link works for 3 days.</p>${button(link, "Confirm email")}`));
}

export async function sendResetEmail(userId: string, email: string) {
  const token = await createToken(userId, "reset", 60 * 60 * 1000);
  const link = `${SITE_URL}/reset?token=${token}`;
  console.log(`[reset-link] ${email} ${link}`);
  return sendMail(email, "Reset your Makemylink password", wrap(`<h2>Reset your password</h2><p>Tap the button to choose a new password. The link works for 1 hour. If you didn't ask for this, ignore this email.</p>${button(link, "Choose a new password")}`));
}
