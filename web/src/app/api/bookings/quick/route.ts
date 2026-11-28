import { NextResponse } from "next/server";
import { actionOk, bookingRow, emailClaim, setBookingStatus, type Act } from "@/lib/bookingActions";
import { esc } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/security";

// Email buttons land here. GET only shows a page with one button (mail scanners open links, so nothing changes on GET);
// pressing the button POSTs and does the action.

const page = (title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Showz</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f6f4;font-family:system-ui,sans-serif;color:#141414;padding:16px}main{max-width:420px;width:100%;background:#fff;border:1px solid #e7e7e4;border-radius:24px;padding:28px}h1{font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:34px;line-height:1;margin:0 0 12px}p{color:#555;line-height:1.55;font-size:15px}button{width:100%;min-height:50px;border:0;border-radius:12px;background:#141414;color:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px}button.light{background:#fff;color:#141414;border:1px solid #ccc}.brand{font-family:Georgia,serif;font-style:italic;font-size:20px;margin-bottom:20px}</style></head><body><main><div class="brand">Showz</div>${body}</main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );

const words: Record<Exclude<Act, "review">, { title: string; button: string; done: string }> = {
  confirm: { title: "Confirm this booking?", button: "Yes, the money arrived", done: "Confirmed. The buyer has been emailed the meeting link and calendar file." },
  cancel: { title: "Cancel this booking?", button: "Yes, it wasn't paid", done: "Cancelled. The time is free again, and the buyer has been told." },
  claim: { title: "Tell the host you paid?", button: "Yes, I paid", done: "Done. The host has been asked to check and will confirm by email." },
};

async function read(req: Request) {
  const u = new URL(req.url);
  let { id, a, k } = Object.fromEntries(u.searchParams) as Record<string, string>;
  if (req.method === "POST") {
    const f = await req.formData().catch(() => null);
    id = String(f?.get("id") ?? id ?? "");
    a = String(f?.get("a") ?? a ?? "");
    k = String(f?.get("k") ?? k ?? "");
  }
  const act = (["confirm", "cancel", "claim"] as const).find((x) => x === a);
  if (!id || !act || !actionOk(id, act, k ?? "")) return null;
  const row = await bookingRow(id);
  return row ? { row, act, id, k: k! } : null;
}

export async function GET(req: Request) {
  const r = await read(req);
  if (!r) return page("Link not valid", "<h1>This link isn't valid</h1><p>It may be incomplete. Open your Showz dashboard to manage bookings.</p>");
  const { row, act } = r;
  if (act !== "claim" && row.status !== "awaiting_payment") return page("Already done", `<h1>Already ${row.status === "confirmed" ? "confirmed" : "cancelled"}</h1><p>Nothing more to do for ${esc(row.buyer_name)}.</p>`);
  const w = words[act];
  return page(w.title, `<h1>${w.title}</h1><p>${esc(row.buyer_name)} · ${esc(row.buyer_email)}</p><form method="post"><input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="a" value="${act}"><input type="hidden" name="k" value="${esc(r.k)}"><button${act === "cancel" ? ' class="light"' : ""}>${w.button}</button></form>`);
}

export async function POST(req: Request) {
  const limited = rateLimit(`quick:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (limited) return limited;
  const r = await read(req);
  if (!r) return page("Link not valid", "<h1>This link isn't valid</h1><p>Open your Showz dashboard to manage bookings.</p>");
  const { row, act } = r;
  const json = (req.headers.get("accept") ?? "").includes("application/json");
  if (act === "claim") {
    if (row.status === "awaiting_payment") await emailClaim(row);
    return json ? NextResponse.json({ ok: true }) : page("Sent", `<h1>Sent</h1><p>${words.claim.done}</p>`);
  }
  if (row.status !== "awaiting_payment") return page("Already done", `<h1>Already ${row.status === "confirmed" ? "confirmed" : "cancelled"}</h1><p>Nothing more to do.</p>`);
  await setBookingStatus(row, act === "confirm" ? "confirmed" : "cancelled");
  return page("Done", `<h1>Done</h1><p>${words[act].done}</p>`);
}
