"use client";

import { useMemo, useState, useTransition } from "react";
import { computeIndex } from "@/lib/essentials-core";
import { fmtInt, fmtMonth } from "@/lib/format";
import type { IndexItemDoc } from "@/lib/types";
import { savePrices, startNewMonth } from "@/app/admin/actions";
import { Sparkline, riseColor } from "@/components/site/Sparkline";
import { PageTitle, btnPrimary, btnSecondary } from "@/components/admin/ui";

export function PricesEditor({ items }: { items: IndexItemDoc[] }) {
  const month = items[0]?.history.at(-1)?.month ?? "";
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i._id, i.history.at(-1)?.price ?? 0])),
  );
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  // Recompute the whole index from the edited prices, exactly as the public page will.
  const preview = useMemo(
    () =>
      computeIndex(
        items.map((i) => ({
          ...i,
          history: i.history.map((h, k) => (k === i.history.length - 1 ? { ...h, price: prices[i._id] || h.price } : h)),
        })),
      ),
    [items, prices],
  );
  const byId = new Map(preview?.items.map((b) => [b.id, b]));

  const submit = (publish: boolean) =>
    start(async () => {
      const res = await savePrices({ month, prices }, publish);
      const t = new Date(res.savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setMsg(publish ? `Published to the site · ${t}` : `Saved · ${t}`);
    });

  if (!items.length || !preview) {
    return <p className="font-serif text-muted">No index items yet. Run the seed script to create the basket.</p>;
  }

  return (
    <>
      <PageTitle title={`Essentials Index · ${fmtMonth(month, "long")}`}>
        <div className="flex items-baseline gap-2.5">
          <span className="label-cond text-muted">Index</span>
          <span className="font-serif text-[34px] leading-none font-medium">{preview.valueF}</span>
          <span className="font-mono text-sm leading-none font-medium text-accent">{preview.chg12}</span>
        </div>
      </PageTitle>
      <p className="m-0 mb-5 -mt-3 max-w-[640px] font-serif text-[17px] leading-[1.45] text-body">
        Enter this month&apos;s median price for each item. Rankings, the index headline and every embedded box update
        when you publish.
      </p>

      <div className="overflow-x-auto border border-ink bg-card">
        <div className="min-w-[760px]">
          <div className="label-cond grid grid-cols-[2fr_1fr_.8fr_1fr_1fr_.8fr_1fr] gap-3.5 border-b border-ink px-[18px] py-3 text-muted">
            <span>Item</span>
            <span>Category</span>
            <span>Weight</span>
            <span className="text-right">{preview.months.at(-2) ? fmtMonth(preview.months.at(-2)!) : "Prev"}</span>
            <span className="text-right">{fmtMonth(month)}</span>
            <span className="text-right">12 mo</span>
            <span>Trend</span>
          </div>
          {items.map((i) => {
            const b = byId.get(i._id)!;
            return (
              <div
                key={i._id}
                className="grid grid-cols-[2fr_1fr_.8fr_1fr_1fr_.8fr_1fr] items-center gap-3.5 border-b border-rule px-[18px] py-[9px]"
              >
                <span className="font-serif text-[17px] leading-[1.2] font-medium">
                  {i.name} <span className="text-[13px] text-muted">/ {i.unit}</span>
                </span>
                <span className="font-cond text-[13px] leading-none font-medium text-muted">{i.category}</span>
                <span className="font-mono text-[13px] leading-none text-muted">{b.weightF}</span>
                <span className="text-right font-mono text-sm leading-none text-muted">{fmtInt(b.prev)}</span>
                <input
                  type="number"
                  min={1}
                  step={10}
                  aria-label={`${i.name} price for ${fmtMonth(month)}`}
                  value={prices[i._id] || ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [i._id]: Number(e.target.value) }))}
                  className="w-full border border-ink bg-paper p-2 text-right font-mono text-sm leading-none font-medium outline-none focus:border-accent"
                />
                <span className="text-right font-mono text-sm leading-none font-medium" style={{ color: riseColor(b.ch) }}>
                  {b.chg}
                </span>
                <Sparkline points={b.spark} stroke={riseColor(b.ch)} width={1.5} className="h-6 w-full" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button className={btnPrimary} disabled={pending} onClick={() => submit(true)}>
          Publish &amp; update site
        </button>
        <button className={btnSecondary} disabled={pending} onClick={() => submit(false)}>
          Save without publishing
        </button>
        <button
          className={btnSecondary}
          disabled={pending}
          onClick={() =>
            confirm("Start a new month? Last month's prices are copied forward for you to update.") &&
            start(async () => {
              await startNewMonth();
              setMsg("New month started — reload to edit it.");
              location.reload();
            })
          }
        >
          Start next month
        </button>
        <span className="font-mono text-[13px] leading-none text-green" aria-live="polite">
          {pending ? "Working…" : msg}
        </span>
      </div>
      <p className="mt-3 font-mono text-[13px] text-muted">Median of 3 quotes · Kimironko, Nyabugogo, Kicukiro</p>
    </>
  );
}
