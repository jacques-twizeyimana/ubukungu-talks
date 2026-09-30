import type { ArticleStatus } from "@/lib/types";

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  published: "Published",
  draft: "Draft",
  review: "In review",
};

const PILL: Record<ArticleStatus, string> = {
  published: "bg-green-wash text-green-ink",
  draft: "bg-draft text-body",
  review: "bg-accent-wash text-accent-ink",
};

export function StatusPill({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={`inline-block flex-none px-2 py-[5px] font-cond text-[11px] leading-none font-semibold tracking-[.06em] uppercase ${PILL[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const btnPrimary =
  "cursor-pointer border-0 bg-accent px-4 py-3 font-cond text-[13px] leading-none font-semibold tracking-[.06em] text-white uppercase hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "cursor-pointer border border-ink bg-card px-3.5 py-[11px] font-cond text-[13px] leading-none font-semibold tracking-[.06em] uppercase hover:bg-wash disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "cursor-pointer border border-ink bg-transparent px-3.5 py-[11px] font-cond text-[13px] leading-none font-semibold tracking-[.06em] uppercase hover:bg-wash disabled:cursor-not-allowed disabled:opacity-50";

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-ink bg-card px-5 py-[18px] ${className}`}>
      {title && <h2 className="m-0 mb-2.5 font-cond text-xs leading-none font-bold tracking-[.08em] uppercase">{title}</h2>}
      {children}
    </section>
  );
}

export function PageTitle({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <div className="mb-2 font-mono text-xs leading-none font-medium text-muted uppercase">{kicker}</div>}
        <h1 className="m-0 font-serif text-[40px] leading-none font-medium tracking-[-.01em]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
