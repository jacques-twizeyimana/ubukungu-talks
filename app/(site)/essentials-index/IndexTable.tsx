"use client";

import { Fragment, useMemo, useState } from "react";
import type { BasketItem } from "@/lib/essentials-core";
import { Sparkline, riseColor } from "@/components/site/Sparkline";

const CATS = ["All", "Food", "Energy", "Transport", "Health", "Housing"] as const;
type Cat = (typeof CATS)[number];
type Sort = "rise" | "month" | "weight";

const SORTS: [Sort, string][] = [
  ["rise", "12-mo rise"],
  ["month", "This month"],
  ["weight", "Budget weight"],
];

const sorters: Record<Sort, (a: BasketItem, b: BasketItem) => number> = {
  rise: (a, b) => b.ch - a.ch,
  month: (a, b) => b.c1 - a.c1,
  weight: (a, b) => b.weight - a.weight,
};

const pct = (x: number) => (x > 0 ? "+" : "") + x.toFixed(1) + "%";
const COLS = "grid-cols-[48px_2.2fr_1fr_1fr_.8fr_.8fr_1.4fr]";

export function IndexTable({ items, firstLabel, lastLabel }: { items: BasketItem[]; firstLabel: string; lastLabel: string }) {
  const [cat, setCat] = useState<Cat>("All");
  const [sort, setSort] = useState<Sort>("rise");
  const [open, setOpen] = useState<string | null>(() => [...items].sort(sorters.rise)[0]?.id ?? null);

  const summary = useMemo(
    () =>
      CATS.map((c) => {
        const group = c === "All" ? items : items.filter((b) => b.category === c);
        const ws = group.reduce((a, b) => a + b.weight, 0) || 1;
        return { c, n: group.length, chg: pct(group.reduce((a, b) => a + b.weight * b.ch, 0) / ws) };
      }).filter((s) => s.n > 0),
    [items],
  );

  const rows = useMemo(
    () => items.filter((b) => cat === "All" || b.category === cat).sort(sorters[sort]),
    [items, cat, sort],
  );

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] border-b border-ink">
        {summary.map((s) => (
          <button
            key={s.c}
            aria-pressed={cat === s.c}
            onClick={() => setCat(s.c)}
            className={`flex cursor-pointer flex-col gap-1.5 border-0 border-r border-solid border-rule px-4 py-3.5 text-left hover:bg-wash ${cat === s.c ? "bg-wash" : "bg-transparent"}`}
          >
            <span className="kicker">{s.c === "All" ? "All essentials" : s.c}</span>
            <span className="font-serif text-2xl leading-none font-medium text-accent">{s.chg}</span>
            <span className="font-mono text-xs leading-none text-muted">{s.n} items</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2.5">
        <span className="font-cond text-sm leading-[1.3] font-medium text-muted">
          Showing {rows.length} items · {cat === "All" ? "All categories" : cat} · select a row for its full history
        </span>
        <div className="flex border border-ink font-cond text-xs leading-none font-semibold tracking-[.05em] uppercase">
          {SORTS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              aria-pressed={sort === k}
              className={`cursor-pointer border-0 px-3 py-[9px] uppercase ${sort === k ? "bg-ink text-paper" : "bg-transparent text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border-t-2 border-ink">
        <div className="min-w-[760px]">
          <div
           
            className={`grid ${COLS} gap-3.5 border-b border-ink px-2 py-2.5 font-cond text-[11px] leading-none font-semibold tracking-[.08em] text-muted uppercase`}
          >
            <span>Rank</span>
            <span>Item</span>
            <span>Category</span>
            <span className="text-right">Price (RWF)</span>
            <span className="text-right">1 mo</span>
            <span className="text-right">12 mo</span>
            <span>12-month trend</span>
          </div>
          {rows.map((b, i) => {
            const isOpen = open === b.id;
            return (
              <Fragment key={b.id}>
                <div className="border-b border-rule">
                  <button
                   
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : b.id)}
                    className={`grid w-full cursor-pointer ${COLS} items-center gap-3.5 border-0 bg-transparent px-2 py-3 text-left hover:bg-wash`}
                  >
                    <span className="font-serif text-[26px] leading-none font-medium text-muted">{i + 1}</span>
                    <span className="font-serif text-xl leading-[1.15] font-medium">
                      {b.name} <span className="font-cond text-sm leading-none font-normal text-muted">per {b.unit}</span>
                    </span>
                    <span className="font-cond text-[13px] leading-none font-medium tracking-[.05em] text-muted uppercase">
                      {b.category}
                    </span>
                    <span className="text-right font-mono text-base leading-none font-medium">{b.nowF}</span>
                    <span className="text-right font-mono text-sm leading-none font-medium" style={{ color: riseColor(b.c1) }}>
                      {b.chg1}
                    </span>
                    <span className="text-right font-mono text-sm leading-none font-medium" style={{ color: riseColor(b.ch) }}>
                      {b.chg}
                    </span>
                    <Sparkline points={b.spark} stroke={riseColor(b.ch)} width={1.75} className="h-[30px] w-full" />
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-7 bg-card px-2 pt-2 pb-6 md:pl-[70px]">
                      <div className="flex flex-col gap-2 pt-3">
                        <Sparkline
                          points={b.spark}
                          stroke={riseColor(b.ch)}
                          width={2.5}
                          className="h-[120px] w-full border-b border-ink"
                          label={`${b.name} price, ${firstLabel} to ${lastLabel}`}
                        />
                        <div className="flex justify-between font-mono text-xs leading-none text-muted">
                          <span>
                            {firstLabel} · {b.thenF}
                          </span>
                          <span>
                            {lastLabel} · {b.nowF}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 pt-3">
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            ["12-mo low", b.minF],
                            ["12-mo high", b.maxF],
                            ["Weight", b.weightF],
                          ].map(([k, v]) => (
                            <div key={k} className="flex flex-col gap-[5px]">
                              <span className="label-cond text-muted">{k}</span>
                              <span className="font-mono text-lg leading-none font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                        <p className="pretty m-0 font-serif text-[17px] leading-[1.45] text-body">{b.note}</p>
                        <span className="font-mono text-xs leading-[1.3] text-muted">Priced at: {b.source}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}
