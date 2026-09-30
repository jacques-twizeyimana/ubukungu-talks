import { fmtInt, fmtMonth, fmtPct, sparkPoints } from "./format";
import type { IndexItemDoc } from "./types";

// Pure index maths: safe to import from client components (the admin price editor previews live).

export interface BasketItem {
  id: string;
  name: string;
  unit: string;
  category: IndexItemDoc["category"];
  weight: number;
  source: string;
  note: string;
  series: number[];
  now: number;
  then: number;
  prev: number;
  ch: number; // % change over the series (12 months)
  c1: number; // % change this month
  nowF: string;
  thenF: string;
  prevF: string;
  minF: string;
  maxF: string;
  chg: string;
  chg1: string;
  weightF: string;
  spark: string;
}

export interface EssentialsIndex {
  months: string[];
  firstMonth: string;
  lastMonth: string;
  firstLabel: string;
  lastLabel: string;
  lastLabelLong: string;
  value: number;
  valueF: string;
  chg12: string;
  chg1: string;
  spark: string;
  items: BasketItem[];
}

/** Pure computation, shared by the public page and the admin price editor preview. */
export function computeIndex(docs: IndexItemDoc[]): EssentialsIndex | null {
  if (!docs.length) return null;
  // Align every item to the same trailing 13-month window.
  const months = docs[0].history.slice(-13).map((h) => h.month);
  const items: BasketItem[] = docs.map((d) => {
    const byMonth = new Map(d.history.map((h) => [h.month, h.price]));
    const series = months.map((m, i) => byMonth.get(m) ?? d.history[Math.min(i, d.history.length - 1)].price);
    const now = series[series.length - 1];
    const then = series[0];
    const prev = series[series.length - 2] ?? then;
    const ch = ((now - then) / then) * 100;
    const c1 = ((now - prev) / prev) * 100;
    return {
      id: d._id,
      name: d.name,
      unit: d.unit,
      category: d.category,
      weight: d.weight,
      source: d.source,
      note: d.note,
      series,
      now,
      then,
      prev,
      ch,
      c1,
      nowF: fmtInt(now),
      thenF: fmtInt(then),
      prevF: fmtInt(prev),
      minF: fmtInt(Math.min(...series)),
      maxF: fmtInt(Math.max(...series)),
      chg: fmtPct(ch),
      chg1: fmtPct(c1),
      weightF: Math.round(d.weight * 100) + "%",
      spark: sparkPoints(series),
    };
  });

  const wsum = items.reduce((a, b) => a + b.weight, 0) || 1;
  const idxSeries = months.map(
    (_, i) => (items.reduce((a, b) => a + (b.weight * b.series[i]) / b.series[0], 0) / wsum) * 100,
  );
  const value = idxSeries[idxSeries.length - 1];
  const prevValue = idxSeries[idxSeries.length - 2] ?? value;
  const first = months[0];
  const last = months[months.length - 1];
  return {
    months,
    firstMonth: first,
    lastMonth: last,
    firstLabel: fmtMonth(first),
    lastLabel: fmtMonth(last),
    lastLabelLong: fmtMonth(last, "long"),
    value,
    valueF: value.toFixed(1),
    chg12: fmtPct(value - 100),
    chg1: fmtPct(((value - prevValue) / prevValue) * 100),
    spark: sparkPoints(idxSeries),
    items,
  };
}
