import { useId } from "react";
import type { ArtKind } from "@/lib/types";

/** Silhouettes drawn on a 100×100 grid. */
const shapes: Record<ArtKind, React.ReactNode> = {
  dress: (
    <>
      <path d="M41 10 L44 24 M59 10 L56 24" strokeWidth="2.4" strokeLinecap="round" stroke="currentColor" fill="none" />
      <path d="M42 24 Q50 29 58 24 L60 40 Q70 58 76 88 Q50 94 24 88 Q30 58 40 40 Z" />
    </>
  ),
  bag: (
    <>
      <path d="M36 42 Q36 18 50 18 Q64 18 64 42" strokeWidth="4" fill="none" stroke="currentColor" strokeLinecap="round" />
      <path d="M22 42 Q22 38 26 38 L74 38 Q78 38 78 42 L82 80 Q82 86 76 86 L24 86 Q18 86 18 80 Z" />
      <rect x="45" y="52" width="10" height="7" rx="2" fill="#fff" opacity=".55" />
    </>
  ),
  heel: (
    <path d="M14 70 Q34 70 52 54 Q62 44 74 44 Q84 44 86 54 L86 62 L80 62 L78 86 L73 86 L72 64 Q54 76 18 80 Q12 80 12 75 Z" />
  ),
  shades: (
    <>
      <rect x="10" y="38" width="34" height="26" rx="12" />
      <rect x="56" y="38" width="34" height="26" rx="12" />
      <path d="M44 46 Q50 41 56 46" strokeWidth="3.5" fill="none" stroke="currentColor" />
      <path d="M10 44 L4 40 M90 44 L96 40" strokeWidth="3" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  jacket: (
    <path d="M32 14 L44 10 L50 26 L56 10 L68 14 L88 42 L78 50 L70 38 L70 88 L30 88 L30 38 L22 50 L12 42 Z" />
  ),
  lipstick: (
    <>
      <path d="M42 40 L42 22 Q42 14 58 10 L58 40 Z" />
      <rect x="39" y="40" width="22" height="14" rx="2" opacity=".8" />
      <rect x="36" y="54" width="28" height="34" rx="4" />
    </>
  ),
  ring: (
    <>
      <circle cx="50" cy="60" r="22" strokeWidth="7" fill="none" stroke="currentColor" />
      <path d="M50 14 L62 28 L50 42 L38 28 Z" />
    </>
  ),
  vinyl: (
    <>
      <circle cx="50" cy="52" r="36" />
      <circle cx="50" cy="52" r="26" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5" />
      <circle cx="50" cy="52" r="12" fill="#fff" opacity=".6" />
      <circle cx="50" cy="52" r="2.5" />
    </>
  ),
  cup: (
    <>
      <path d="M22 34 L74 34 L70 80 Q69 88 60 88 L36 88 Q27 88 26 80 Z" />
      <path d="M74 44 Q88 44 88 56 Q88 68 72 68" strokeWidth="6" fill="none" stroke="currentColor" />
      <path d="M38 12 Q34 20 40 26 M52 10 Q48 18 54 26" strokeWidth="3" fill="none" stroke="currentColor" strokeLinecap="round" opacity=".6" />
    </>
  ),
  camera: (
    <>
      <path d="M36 26 L42 18 L58 18 L64 26 Z" />
      <rect x="10" y="26" width="80" height="56" rx="10" />
      <circle cx="50" cy="54" r="18" fill="#fff" opacity=".55" />
      <circle cx="50" cy="54" r="10" />
    </>
  ),
  book: (
    <>
      <path d="M22 14 L72 14 Q78 14 78 20 L78 88 L28 88 Q22 88 22 82 Z" />
      <rect x="32" y="28" width="36" height="5" rx="2" fill="#fff" opacity=".55" />
      <rect x="32" y="38" width="24" height="4" rx="2" fill="#fff" opacity=".4" />
    </>
  ),
  cat: (
    <>
      <path d="M28 38 L22 16 L40 30 Q50 26 60 30 L78 16 L72 38 Q80 50 80 62 Q80 86 50 86 Q20 86 20 62 Q20 50 28 38 Z" />
      <circle cx="38" cy="54" r="4" fill="#fff" />
      <circle cx="62" cy="54" r="4" fill="#fff" />
      <path d="M44 64 Q50 70 56 64" strokeWidth="3" fill="none" stroke="#fff" strokeLinecap="round" />
      <path d="M30 66 L16 62 M30 70 L14 72 M70 66 L84 62 M70 70 L86 72" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  dog: (
    <>
      <ellipse cx="50" cy="60" rx="30" ry="26" />
      <path d="M22 46 Q10 30 18 18 Q32 24 34 40 Z" />
      <path d="M78 46 Q90 30 82 18 Q68 24 66 40 Z" />
      <circle cx="40" cy="56" r="4" fill="#fff" />
      <circle cx="60" cy="56" r="4" fill="#fff" />
      <ellipse cx="50" cy="68" rx="7" ry="5" fill="#fff" opacity=".85" />
      <path d="M50 73 Q50 80 58 82" strokeWidth="3" fill="none" stroke="#fff" strokeLinecap="round" />
    </>
  ),
  plane: (
    <path d="M50 10 L58 40 L86 54 L86 62 L58 56 L54 80 L66 90 L66 96 L50 92 L34 96 L34 90 L46 80 L42 56 L14 62 L14 54 L42 40 Z" />
  ),
  building: (
    <>
      <rect x="20" y="30" width="24" height="60" rx="2" />
      <rect x="52" y="14" width="28" height="76" rx="2" opacity=".9" />
      {[22, 34].flatMap((y) =>
        [26, 36].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" fill="#fff" opacity=".6" />),
      )}
      {[22, 34, 46, 58, 70].flatMap((y) =>
        [58, 70].map((x) => <rect key={`b${x}-${y}`} x={x} y={y} width="6" height="6" fill="#fff" opacity=".6" />),
      )}
    </>
  ),
  sneaker: (
    <>
      <path d="M10 66 Q10 46 24 46 L38 48 Q50 32 62 36 Q72 50 88 56 Q94 60 92 70 L10 70 Z" />
      <rect x="8" y="70" width="86" height="9" rx="4" opacity=".75" />
    </>
  ),
};

export function LookArt({ kind, hue, mono = false }: { kind: ArtKind; hue: number; mono?: boolean }) {
  const id = useId().replace(/:/g, "");
  const sat = mono ? 0 : 1;
  const bgA = `hsl(${hue} ${70 * sat}% ${mono ? 92 : 88}%)`;
  const bgB = `hsl(${hue + 28} ${60 * sat}% ${mono ? 70 : 70}%)`;
  const fgA = `hsl(${hue} ${55 * sat}% ${mono ? 12 : 30}%)`;
  const fgB = `hsl(${hue + 10} ${65 * sat}% ${mono ? 38 : 52}%)`;

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bgA} />
          <stop offset="1" stopColor={bgB} />
        </linearGradient>
        <linearGradient id={`fg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fgB} />
          <stop offset="1" stopColor={fgA} />
        </linearGradient>
        <radialGradient id={`hl${id}`} cx=".3" cy=".25" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bg${id})`} />
      <circle cx="78" cy="20" r="26" fill="#fff" opacity=".18" />
      <ellipse cx="50" cy="92" rx="34" ry="4" fill="#000" opacity=".12" />
      <g transform="translate(14 12) scale(.72)" fill={`url(#fg${id})`} style={{ color: fgA }}>
        {shapes[kind]}
      </g>
      <rect width="100" height="100" fill={`url(#hl${id})`} />
    </svg>
  );
}
