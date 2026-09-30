import Link from "next/link";
import { getAllArticlesForAdmin } from "@/lib/articles";
import { fmtDate, fmtInt } from "@/lib/format";
import type { ArticleStatus } from "@/lib/types";
import { createDraft } from "@/app/admin/actions";
import { PageTitle, StatusPill, STATUS_LABEL, btnPrimary } from "@/components/admin/ui";

export const metadata = { title: "Stories" };

const FILTERS: (ArticleStatus | "all")[] = ["all", "published", "review", "draft"];

export default async function StoriesPage({ searchParams }: PageProps<"/admin/stories">) {
  const { status: raw, q: rawQ } = await searchParams;
  const status = FILTERS.includes(raw as ArticleStatus) ? (raw as ArticleStatus | "all") : "all";
  const q = typeof rawQ === "string" ? rawQ.trim().toLowerCase() : "";
  const all = await getAllArticlesForAdmin();
  const rows = all.filter(
    (p) => (status === "all" || p.status === status) && (!q || p.title.toLowerCase().includes(q) || p.section.toLowerCase().includes(q)),
  );

  return (
    <>
      <PageTitle title="Stories">
        <form action={createDraft}>
          <button className={btnPrimary}>+ New story</button>
        </form>
      </PageTitle>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const n = f === "all" ? all.length : all.filter((p) => p.status === f).length;
            const active = f === status;
            return (
              <Link
                key={f}
                href={f === "all" ? "/admin/stories" : `/admin/stories?status=${f}`}
                className={`border border-ink px-3 py-2 font-cond text-[13px] leading-none font-semibold tracking-[.04em] ${active ? "bg-ink text-paper" : "hover:bg-wash"}`}
              >
                {f === "all" ? "All" : STATUS_LABEL[f]} · {n}
              </Link>
            );
          })}
        </div>
        <form className="flex border border-ink bg-card">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search headlines"
            aria-label="Search headlines"
            className="w-56 border-0 bg-transparent px-3 py-2 font-cond text-sm outline-none"
          />
        </form>
      </div>

      <div className="overflow-x-auto border border-ink bg-card">
        <div className="min-w-[680px]">
          <div className="label-cond grid grid-cols-[3fr_1fr_1fr_.8fr_.8fr] gap-3.5 border-b border-ink px-[18px] py-3 text-muted">
            <span>Headline</span>
            <span>Section</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Views</span>
          </div>
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/admin/stories/${p.id}`}
              className="grid grid-cols-[3fr_1fr_1fr_.8fr_.8fr] items-center gap-3.5 border-b border-rule px-[18px] py-3.5 hover:bg-paper"
            >
              <span className="font-serif text-[17px] leading-[1.25] font-medium">{p.title || "Untitled story"}</span>
              <span className="font-cond text-sm leading-none font-medium">{p.section}</span>
              <span className="font-mono text-[13px] leading-none text-muted">{fmtDate(p.publishedAt)}</span>
              <span>
                <StatusPill status={p.status} />
              </span>
              <span className="text-right font-mono text-[13px] leading-none font-medium">{p.views ? fmtInt(p.views) : "—"}</span>
            </Link>
          ))}
          {rows.length === 0 && <p className="m-0 px-[18px] py-8 text-center font-serif text-muted">No stories match.</p>}
        </div>
      </div>
    </>
  );
}
