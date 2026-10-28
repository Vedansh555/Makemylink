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
      className={`group relative flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl text-left shadow-sm transition active:scale-[0.98] ${
        active ? "ring-2 ring-[#ff5b37] ring-offset-2 ring-offset-bg" : "ring-1 ring-fg/10 hover:ring-fg/30"
      }`}
      aria-pressed={active}
      aria-label={`${def.label} theme`}
    >
      <div
        className="relative flex h-24 min-h-24 shrink-0 sm:h-32 sm:min-h-32 flex-col items-center justify-center gap-1.5 overflow-hidden px-3"
        style={{ backgroundColor: def.bg, color: def.fg }}
      >
        {gradient && (
          <>
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-t-accent blur-2xl opacity-70" />
            <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-t-accent2 blur-2xl opacity-70" />
          </>
        )}
        {def.family === "glass" && (
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-t-accent2 opacity-60 blur-2xl" />
        )}
        <div
          className={`relative h-7 w-7 rounded-full shadow-sm ${
            chrome
              ? "bg-[conic-gradient(from_180deg,var(--c2),var(--c1),var(--c3),var(--c1),var(--c2))]"
              : ""
          } ${pop ? "border-2 border-t-fg" : ""}`}
          style={!chrome ? { backgroundColor: def.accent } : undefined}
        />
        <span
          className={`relative text-[18px] sm:text-[20px] font-bold leading-none ${theme.nameFont} ${
            chrome ? "chrome-text font-extrabold" : ""
          }`}
          style={{ color: pop ? def.accent : def.fg }}
        >
          Aa
        </span>
        <span
          className={`relative h-2.5 sm:h-3 w-4/5 shadow-sm ${
            def.family === "minimal"
              ? "rounded-md"
              : def.family === "mono" || def.family === "editorial"
              ? "rounded-none"
              : "rounded-full"
          } ${
            chrome
              ? "bg-[linear-gradient(110deg,var(--c2),var(--c1),var(--c2))]"
              : ""
          } ${pop ? "border-2 border-t-fg" : ""}`}
          style={
            !chrome
              ? { backgroundColor: gradient ? def.fg : def.accent }
              : undefined
          }
        />
        <span
          className={`relative h-2.5 sm:h-3 w-4/5 border ${
            def.family === "minimal"
              ? "rounded-md"
              : def.family === "mono" || def.family === "editorial"
              ? "rounded-none"
              : "rounded-full"
          }`}
          style={{
            borderColor: `${def.fg}33`,
            backgroundColor: `${def.fg}1a`,
          }}
        />
      </div>
      <div className="border-t border-fg/8 bg-bg px-2.5 py-2">
        <p className="truncate text-[12px] font-medium text-fg">{def.label}</p>
      </div>
    </button>
  );
}
