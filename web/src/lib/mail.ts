import { SITE_URL } from "./site";

/** Sends through Resend when RESEND_API_KEY is set; otherwise logs, so local development needs no key. */
export interface Attachment {
  filename: string;
  /** File contents as plain text; sent base64-encoded. */
  text: string;
}

export async function sendMail(to: string, subject: string, html: string, attachments?: Attachment[]): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail:dev] to=${to} subject=${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? `Showz <hello@${new URL(SITE_URL).hostname}>`,
        to,
        subject,
        html,
        ...(attachments?.length ? { attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.text, "utf8").toString("base64") })) } : {}),
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("mail error", e);
    return false;
  }
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
