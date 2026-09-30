import { SITE } from "./site";

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

export const fmtPct = (x: number) => (x > 0 ? "+" : "") + x.toFixed(1) + "%";

export function fmtDate(iso: string | Date | null, style: "short" | "long" = "short") {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", {
    timeZone: SITE.timeZone,
    month: style === "long" ? "long" : "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function fmtMonth(month: string, style: "short" | "long" = "short") {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-US", {
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function mastheadDate(now = new Date()) {
  const date = now.toLocaleDateString("en-GB", {
    timeZone: SITE.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const issue = Math.max(1, Math.floor((now.getTime() - SITE.firstIssue.getTime()) / (7 * 864e5)) + 1);
  return { date: date.replace(/^(\w+) /, "$1, "), issue };
}

/** Points for a 100×30 SVG viewBox sparkline, matching the design. */
export function sparkPoints(series: number[]): string {
  if (series.length < 2) return "0,15 100,15";
  const min = Math.min(...series);
  const max = Math.max(...series);
  const r = max - min || 1;
  return series
    .map((v, i) => `${((i / (series.length - 1)) * 100).toFixed(1)},${(28 - ((v - min) / r) * 26).toFixed(1)}`)
    .join(" ");
}

export function countWords(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function readingMinutes(words: number) {
  return Math.max(1, Math.round(words / 220));
}
