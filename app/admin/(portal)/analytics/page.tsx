import Link from "next/link";
import { getBreakdowns, getCohorts, getDaily, getOverview, getScrollRetention, getTopArticles } from "@/lib/analytics";
import { fmtInt } from "@/lib/format";
import { PageTitle, Panel } from "@/components/admin/ui";
import { BarList, CohortTable, LineChart } from "@/components/admin/charts";

export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90] as const;

const fmtDuration = (s: number) => (s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`);
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.days) as (typeof RANGES)[number]) ? Number(sp.days) : 30;
  const articleId = typeof sp.article === "string" ? sp.article : undefined;

  const [{ current, previous }, daily, top, scroll, cohorts, breakdowns] = await Promise.all([
    getOverview(days),
    getDaily(days),
    getTopArticles(days, 15),
    getScrollRetention(days, articleId),
    getCohorts(8),
    getBreakdowns(days),
  ]);
  const selected = top.find((t) => t.id === articleId);

  const change = (a: number, b: number) => {
    if (!b) return "";
    const d = ((a - b) / b) * 100;
    return `${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(0)}%`;
  };

  const kpis = [
    { label: "Visitors", value: fmtInt(current.visitors), d: change(current.visitors, previous.visitors) },
    { label: "Page views", value: fmtInt(current.pageviews), d: change(current.pageviews, previous.pageviews) },
    { label: "Article reads", value: fmtInt(current.reads), d: change(current.reads, previous.reads) },
    { label: "Read rate", value: pct(current.readRate), d: "of article views" },
    { label: "Avg. engaged time", value: fmtDuration(current.avgEngagedSec), d: "per article view" },
    { label: "Returning visitors", value: pct(current.returningRate), d: "seen on 2+ days" },
  ];
  const deviceTotal = breakdowns.devices.reduce((a, b) => a + b.n, 0);
  const refTotal = breakdowns.referrers.reduce((a, b) => a + b.n, 0);

  return (
    <>
      <PageTitle kicker={`Last ${days} days`} title="Analytics">
        <div className="flex border border-ink font-cond text-xs leading-none font-semibold tracking-[.05em] uppercase">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?days=${r}${articleId ? `&article=${articleId}` : ""}`}
              className={`px-3 py-[9px] ${r === days ? "bg-ink text-paper" : "hover:bg-wash"}`}
            >
              {r} days
            </Link>
          ))}
        </div>
      </PageTitle>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border border-ink bg-card">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-2 border-r border-rule px-4 py-4">
            <span className="label-cond text-muted">{k.label}</span>
            <span className="font-serif text-[32px] leading-none font-medium">{k.value}</span>
            <span className="font-mono text-[11px] leading-none text-muted">
              {k.d.startsWith("▲") ? <span className="text-green">{k.d} vs prior</span> : k.d.startsWith("▼") ? <span className="text-accent">{k.d} vs prior</span> : k.d}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
        <Panel title="Visitors per day">
          <LineChart points={daily.map((d) => ({ x: shortDay(d.day), y: d.visitors }))} label="Unique visitors per day" />
        </Panel>
        <Panel title="Article reads per day">
          <LineChart points={daily.map((d) => ({ x: shortDay(d.day), y: d.reads }))} label="Completed article reads per day" />
        </Panel>
      </div>

      <Panel title="Stories" className="mt-6">
        <p className="m-0 mb-3 font-serif text-[15px] text-body">
          A <em>read</em> is a view that reached 80% of the story with enough active time to have read it. Select a story to see where its readers drop off.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="label-cond border-b border-ink text-muted">
                <th className="py-2.5 text-left font-semibold">Story</th>
                <th className="py-2.5 text-right font-semibold">Views</th>
                <th className="py-2.5 text-right font-semibold">Visitors</th>
                <th className="py-2.5 text-right font-semibold">Reads</th>
                <th className="py-2.5 text-right font-semibold">Read rate</th>
                <th className="py-2.5 text-right font-semibold">Avg. depth</th>
                <th className="py-2.5 text-right font-semibold">Engaged</th>
              </tr>
            </thead>
            <tbody>
              {top.map((a) => (
                <tr key={a.id} className={`border-b border-rule ${a.id === articleId ? "bg-wash" : ""}`}>
                  <td className="py-2.5 pr-3">
                    <Link href={`/admin/analytics?days=${days}&article=${a.id}#retention`} className="font-serif text-base font-medium hover:text-accent">
                      {a.title}
                    </Link>
                    <span className="ml-2 font-cond text-xs text-muted">{a.section}</span>
                  </td>
                  <td className="text-right font-mono text-sm">{fmtInt(a.views)}</td>
                  <td className="text-right font-mono text-sm">{fmtInt(a.visitors)}</td>
                  <td className="text-right font-mono text-sm">{fmtInt(a.reads)}</td>
                  <td className="text-right font-mono text-sm">{pct(a.readRate)}</td>
                  <td className="text-right font-mono text-sm">{pct(a.avgDepth)}</td>
                  <td className="text-right font-mono text-sm">{fmtDuration(a.avgEngagedSec)}</td>
                </tr>
              ))}
              {top.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center font-serif text-muted">
                    No article views in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div id="retention" className="mt-6 grid scroll-mt-6 grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
        <Panel title={selected ? `Reader retention · ${selected.title}` : "Reader retention · all stories"}>
          <p className="m-0 mb-2 font-serif text-[15px] text-body">Share of readers still on the page at each point of the story.</p>
          <LineChart
            points={scroll.map((s) => ({ x: `${Math.round(s.depth * 100)}%`, y: s.share }))}
            yFormat="pct"
            yMax={1}
            label="Share of readers reaching each depth of the story"
          />
          {selected && (
            <Link href={`/admin/analytics?days=${days}#retention`} className="font-cond text-xs text-accent underline">
              Show all stories
            </Link>
          )}
        </Panel>
        <Panel title="Visitor retention by first week">
          <p className="m-0 mb-2 font-serif text-[15px] text-body">Of the readers who first arrived in a week, the share who came back in each week after.</p>
          <CohortTable cohorts={cohorts} />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
        <Panel title="Where readers come from">
          <BarList rows={breakdowns.referrers} total={refTotal} />
        </Panel>
        <Panel title="Devices">
          <BarList rows={breakdowns.devices} total={deviceTotal} />
        </Panel>
      </div>
    </>
  );
}
