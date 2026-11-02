import type { BookingConfig } from "./types";

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffset(ts: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ts;
}

/** Wall-clock time in `tz` → epoch ms. */
export function zonedToEpoch(y: number, m: number, d: number, hour: number, minute: number, tz: string): number {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  return guess - tzOffset(guess - tzOffset(guess, tz), tz);
}

/** Open start times (epoch ms) for one calendar day (YYYY-MM-DD, creator's time zone), minus taken ones and the past. */
export function slotsForDay(cfg: BookingConfig, ymd: string, taken: number[], now = Date.now()): number[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return [];
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const noon = zonedToEpoch(y, mo, d, 12, 0, cfg.timeZone);
  const weekday = new Date(noon + tzOffset(noon, cfg.timeZone)).getUTCDay();
  if (!cfg.days.includes(weekday)) return [];
  const out: number[] = [];
  for (let mins = cfg.startHour * 60; mins + cfg.durationMin <= cfg.endHour * 60; mins += cfg.durationMin) {
    const start = zonedToEpoch(y, mo, d, Math.floor(mins / 60), mins % 60, cfg.timeZone);
    if (start > now + 60 * 60 * 1000 && !taken.some((t) => Math.abs(t - start) < cfg.durationMin * 60_000)) out.push(start);
  }
  return out;
}
