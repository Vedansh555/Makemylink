import { getTheme } from "@/lib/themes";
import type { ThemeId } from "@/lib/types";

/** A tiny, accurate preview of a theme: its colours, name font and button styles. */
export function ThemeCard({ id, active = false, onClick }: { id: ThemeId; active?: boolean; onClick?: () => void }) {
  const theme = getTheme(id);
  const { def } = theme;
  const chrome = def.family === "chrome";
  const pop = def.family === "pop";
  const gradient = def.family === "gradient";

  return (
    <button
      type="button"
      onClick={onClick}
      style={theme.style}
      className={`group relative overflow-hidden rounded-2xl text-left transition ${active ? "ring-2 ring-[#ff5b37] ring-offset-2 ring-offset-bg" : "ring-1 ring-fg/10 hover:ring-fg/30"}`}
      aria-pressed={active}
      aria-label={`${def.label} theme`}
    >
      <div
        className="relative flex h-28 sm:h-32 flex-col items-center justify-center gap-1.5 overflow-hidden px-3 text-t-fg"
        style={{ backgroundColor: def.bg, color: def.fg }}
      >
        {gradient && (
          <>
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-t-accent blur-2xl" />
            <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-t-accent2 blur-2xl" />
          </>
        )}
        {def.family === "glass" && <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-t-accent2 opacity-60 blur-2xl" />}
        <div
          className={`relative h-7 w-7 rounded-full ${
            chrome ? "bg-[conic-gradient(from_180deg,var(--c2),var(--c1),var(--c3),var(--c1),var(--c2))]" : "bg-t-accent"
          } ${pop ? "border-2 border-t-fg" : ""}`}
        />
        <span className={`relative text-[20px] leading-none ${theme.nameFont} ${chrome ? "chrome-text font-extrabold" : ""} ${pop ? "font-black text-t-accent" : ""}`}>
          Aa
        </span>
        <span
          className={`relative h-3 w-4/5 ${def.family === "minimal" ? "rounded-md" : def.family === "mono" || def.family === "editorial" ? "" : "rounded-full"} ${
            chrome ? "bg-[linear-gradient(110deg,var(--c2),var(--c1),var(--c2))]" : gradient ? "bg-t-fg" : "bg-t-accent"
          } ${pop ? "border-2 border-t-fg" : ""} ${def.family === "neon" ? "shadow-[0_0_12px_var(--t-accent)]" : ""}`}
        />
        <span className={`relative h-3 w-4/5 border border-t-fg/20 bg-t-fg/10 ${def.family === "minimal" ? "rounded-md" : def.family === "mono" || def.family === "editorial" ? "" : "rounded-full"}`} />
      </div>
      <div className="bg-bg px-3 py-2">
        <p className="truncate text-[12px] font-medium text-fg">{def.label}</p>
      </div>
    </button>
  );
}
