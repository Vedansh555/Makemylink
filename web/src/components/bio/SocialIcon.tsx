import type { Socials } from "@/lib/types";

export type SocialKey = keyof Socials;

const paths: Record<SocialKey, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </>
  ),
  tiktok: (
    <path
      d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.6 2.3 4.3 5 4.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" />
    </>
  ),
  pinterest: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M11 20l1.6-7M10 12.5c-.6-2.6 1-4.6 3.2-4.6 2 0 3.1 1.4 3.1 3.1 0 2.3-1.3 4-3 4-.9 0-1.6-.6-1.4-1.5"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
};

export const socialUrl: Record<SocialKey, (v: string) => string> = {
  instagram: (v) => `https://instagram.com/${v}`,
  tiktok: (v) => `https://tiktok.com/@${v}`,
  youtube: (v) => `https://youtube.com/@${v}`,
  pinterest: (v) => `https://pinterest.com/${v}`,
  email: (v) => `mailto:${v}`,
};

export function SocialIcon({ name, className = "h-5 w-5" }: { name: SocialKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}
