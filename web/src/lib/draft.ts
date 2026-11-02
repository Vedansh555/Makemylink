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

/** Reads an image file and shrinks it so drafts stay small. */
export function readImage(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * s);
        canvas.height = Math.round(img.height * s);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a shrunken image to Cloudflare R2 and returns its public address, so pages stay a few KB.
 * Falls back to the inline data URL when storage is not set up or the visitor is not signed in.
 */
export async function storeImage(dataUrl: string): Promise<string> {
  try {
    const res = await fetch("/api/upload", { method: "POST" });
    if (!res.ok) return dataUrl;
    const { uploadUrl, publicUrl } = await res.json();
    const blob = await (await fetch(dataUrl)).blob();
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
    return put.ok ? publicUrl : dataUrl;
  } catch {
    return dataUrl;
  }
}
