import type { Profile } from "./types";

const KEY = "makemylink:draft";

export function loadDraft(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveDraft(profile: Profile): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export const uid = () => Math.random().toString(36).slice(2, 9);

/** How big each kind of picture needs to be: pixels on the long side, and the file size it should fit in. */
export const IMAGE_SIZES = {
  thumb: { max: 320, kb: 40 },
  avatar: { max: 720, kb: 100 },
  product: { max: 1080, kb: 170 },
  cover: { max: 1800, kb: 300 },
} as const;
export type ImageKind = keyof typeof IMAGE_SIZES;

/**
 * Shrinks a photo in the browser before it is saved. It scales down in smooth steps (sharper than one big jump),
 * saves as WebP where the browser can (smaller at the same quality, keeps transparency), and only lowers the quality
 * as far as needed to fit the target size, never below a level where it starts to show.
 */
export async function readImage(file: File, kind: ImageKind = "product"): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const { max, kb } = IMAGE_SIZES[kind];
    const draw = (source: CanvasImageSource, w: number, h: number, background?: string) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      const ctx = c.getContext("2d")!;
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, c.width, c.height);
      return c;
    };
    const sizeOf = (dataUrl: string) => (dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75;

    let scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    for (;;) {
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      // Halve repeatedly while still more than twice the target, then do the last step.
      let source: CanvasImageSource = img;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      while (sw > w * 2 && sh > h * 2) {
        sw /= 2;
        sh /= 2;
        source = draw(source, sw, sh);
      }
      const canvas = draw(source, w, h);
      const webp = canvas.toDataURL("image/webp", 0.9).startsWith("data:image/webp");
      // JPEG has no transparency, so clear areas become white rather than black.
      const out = webp ? canvas : draw(canvas, canvas.width, canvas.height, "#ffffff");
      const type = webp ? "image/webp" : "image/jpeg";
      for (const quality of [0.9, 0.85, 0.8, 0.75, 0.72]) {
        const data = out.toDataURL(type, quality);
        if (sizeOf(data) <= kb * 1024) return data;
      }
      if (Math.max(canvas.width, canvas.height) <= max * 0.6) return out.toDataURL(type, 0.72);
      scale *= 0.88;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Saves a shrunken image to Cloudflare R2 and returns its public address, so pages stay a few KB.
 * Falls back to the inline data URL when storage is not set up or the visitor is not signed in.
 */
export async function storeImage(dataUrl: string): Promise<string> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: blob.type }) });
    if (!res.ok) return dataUrl;
    const { uploadUrl, publicUrl } = await res.json();
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
    return put.ok ? publicUrl : dataUrl;
  } catch {
    return dataUrl;
  }
}
