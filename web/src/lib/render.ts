/**
 * Adds and removes customer domains on the Render service, so Render issues the HTTPS certificate by itself.
 * Needs RENDER_API_KEY (Render > Account Settings > API Keys) and RENDER_SERVICE_ID (the srv-... id in the service URL).
 * Without them the app still works; the certificate step stays manual.
 */
const API = "https://api.render.com/v1";

export const renderConfigured = () => !!(process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID);

const headers = () => ({ Authorization: `Bearer ${process.env.RENDER_API_KEY}`, "Content-Type": "application/json", Accept: "application/json" });
const base = () => `${API}/services/${process.env.RENDER_SERVICE_ID}/custom-domains`;

/** Returns true when the domain is on the service (newly added, or already there). */
export async function addRenderDomain(domain: string): Promise<boolean> {
  if (!renderConfigured()) return false;
  try {
    const res = await fetch(base(), { method: "POST", headers: headers(), body: JSON.stringify({ name: domain }), signal: AbortSignal.timeout(15_000) });
    if (res.ok || res.status === 409) return true; // 409: already added
    console.error("render add domain failed", res.status, await res.text().catch(() => ""));
    return false;
  } catch (e) {
    console.error("render add domain error", e);
    return false;
  }
}

export async function removeRenderDomain(domain: string): Promise<void> {
  if (!renderConfigured()) return;
  try {
    const list = await fetch(`${base()}?name=${encodeURIComponent(domain)}`, { headers: headers(), signal: AbortSignal.timeout(15_000) });
    if (!list.ok) return;
    const items = (await list.json()) as { customDomain?: { id: string; name: string } }[];
    for (const it of items) {
      if (it.customDomain?.name === domain) await fetch(`${base()}/${it.customDomain.id}`, { method: "DELETE", headers: headers(), signal: AbortSignal.timeout(15_000) });
    }
  } catch (e) {
    console.error("render remove domain error", e);
  }
}
