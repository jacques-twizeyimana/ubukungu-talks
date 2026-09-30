import Link from "next/link";
import { getOverview, getTopArticles } from "@/lib/analytics";
import { getAllArticlesForAdmin } from "@/lib/articles";
import { getIndexItems } from "@/lib/essentials";
import { fmtInt, fmtMonth } from "@/lib/format";
import { SITE } from "@/lib/site";
import { createDraft } from "@/app/admin/actions";
import { PageTitle, Panel, StatusPill, btnPrimary } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

function delta(cur: number, prev: number, unit = "vs prior 30 days") {
  if (!prev) return cur ? `▲ new ${unit.replace("vs ", "in ")}` : "—";
  const d = ((cur - prev) / prev) * 100;
  return `${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(0)}% ${unit}`;
}

function greeting() {
  const h = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: SITE.timeZone }));
  return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
}

export default async function Dashboard() {
  const [{ current, previous }, top, stories, indexItems] = await Promise.all([
    getOverview(30),
    getTopArticles(30, 5),
    getAllArticlesForAdmin(),
    getIndexItems(),
  ]);
  const todo = stories.filter((s) => s.status !== "published").slice(0, 6);

  const currentMonth = new Date().toLocaleDateString("en-CA", { timeZone: SITE.timeZone }).slice(0, 7);
  const lastPriced = indexItems[0]?.history.at(-1)?.month;
  const pricesDue = lastPriced && lastPriced < currentMonth;

  const kpis = [
    { label: "Readers · 30 days", value: fmtInt(current.visitors), delta: delta(current.visitors, previous.visitors) },
    { label: "Article reads", value: fmtInt(current.reads), delta: `${(current.readRate * 100).toFixed(0)}% of article views` },
    { label: "Index page views", value: fmtInt(current.indexViews), delta: delta(current.indexViews, previous.indexViews) },
    { label: "Friday brief subs", value: fmtInt(current.subscribers), delta: `▲ ${fmtInt(current.newSubscribers)} this month` },
  ];

  return (
    <>
      <PageTitle
        kicker={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: SITE.timeZone })}
        title={greeting()}
      >
        <form action={createDraft}>
          <button className={btnPrimary}>+ New story</button>
        </form>
      </PageTitle>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border border-ink bg-card">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-2.5 border-r border-rule px-5 py-[18px]">
            <span className="label-cond text-muted">{k.label}</span>
            <span className="font-serif text-[38px] leading-none font-medium">{k.value}</span>
            <span className="font-mono text-xs leading-none font-medium text-green">{k.delta}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
        <Panel title="Most read this month">
          {top.length === 0 && <p className="m-0 py-3 font-serif text-muted">No article views recorded yet.</p>}
          {top.map((p, i) => (
            <Link
              key={p.id}
              href={`/admin/stories/${p.id}`}
              className="group grid grid-cols-[28px_1fr_auto] items-baseline gap-2.5 border-t border-rule py-[11px]"
            >
              <span className="font-mono text-sm leading-none font-medium text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-serif text-[17px] leading-[1.25] font-medium group-hover:text-accent">{p.title}</span>
              <span className="font-mono text-[13px] leading-none font-medium text-muted">{fmtInt(p.views)}</span>
            </Link>
          ))}
          <Link href="/admin/analytics" className="mt-2 block font-cond text-xs font-semibold tracking-[.06em] text-accent uppercase">
            Full analytics →
          </Link>
        </Panel>

        <Panel title="Needs attention" className="flex flex-col gap-2.5">
          {todo.length === 0 && <p className="m-0 py-3 font-serif text-muted">Nothing waiting. Everything is published.</p>}
          {todo.map((p) => (
            <Link
              key={p.id}
              href={`/admin/stories/${p.id}`}
              className="flex items-center justify-between gap-3 border-t border-rule py-[11px] hover:text-accent"
            >
              <span className="font-serif text-[17px] leading-[1.25] font-medium">{p.title || "Untitled story"}</span>
              <StatusPill status={p.status} />
            </Link>
          ))}
          {pricesDue && (
            <Link
              href="/admin/essentials-index"
              className="mt-1.5 bg-accent-wash px-3.5 py-3 font-cond text-sm leading-[1.35] font-medium text-accent-ink"
            >
              Essentials Index: {fmtMonth(currentMonth, "long")} prices due. {indexItems.length} items to update →
            </Link>
          )}
        </Panel>
      </div>
    </>
  );
}
