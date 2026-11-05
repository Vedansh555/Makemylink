import type { BioLink } from "./types";

/** Friendly address part for a card: the first booking card is "book", first WhatsApp card "chat", first video card "video". Everything else uses its id. */
export function shareSlug(link: BioLink, all: BioLink[]): string {
  const alias = link.kind === "booking" ? "book" : link.kind === "whatsapp" ? "chat" : link.kind === "youtube" ? "video" : null;
  if (alias && all.find((l) => l.kind === link.kind)?.id === link.id) return alias;
  return link.id;
}

/** Finds the card an address part points to (an alias or an id). */
export function linkForSlug(slug: string, all: BioLink[]): BioLink | undefined {
  const kind = slug === "book" ? "booking" : slug === "chat" ? "whatsapp" : slug === "video" ? "youtube" : null;
  return (kind && all.find((l) => l.kind === kind)) || all.find((l) => l.id === slug);
}
