import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { getEssentialsIndex } from "@/lib/essentials";
import { fmtDate } from "@/lib/format";
import { SITE, absoluteUrl } from "@/lib/site";
import type { ArticleSummary } from "@/lib/types";
import { StoryImage } from "@/components/site/StoryImage";
import { Sparkline } from "@/components/site/Sparkline";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SupportBand } from "@/components/site/SupportBand";
import { JsonLd } from "@/components/site/JsonLd";

// ISR: the front page is static and regenerated in the background at most every 10 minutes.
// Publishing a story also revalidates it on demand (see app/admin/actions.ts).
export const revalidate = 600;

const href = (a: ArticleSummary) => `/articles/${a.slug}`;

export default async function HomePage() {
  const [all, index] = await Promise.all([getPublishedArticles(80), getEssentialsIndex()]);

  // Allocate each story to one slot so nothing repeats on the page.
  const used = new Set<string>();
  const take = (pred: (a: ArticleSummary) => boolean, n: number) => {
    const out: ArticleSummary[] = [];
    for (const a of all) {
      if (out.length >= n) break;
      if (!used.has(a.id) && pred(a)) {
        used.add(a.id);
        out.push(a);
      }
    }
    return out;
  };
  const news = (a: ArticleSummary) => a.section !== "Opinion";
  const lead = take((a) => news(a) && a.featured, 1)[0] ?? take(news, 1)[0];
  const opinion = take((a) => a.section === "Opinion", 3);
  const colRow = take((a) => a.section === "Cost of living" || a.section === "Health", 4);
  const jobs = take((a) => a.section === "Jobs", 3);
  const rural = take((a) => a.section === "Agriculture", 3);
  const leftCol = take(news, 3);

  if (!lead) {
    return (
      <main className="py-24 text-center font-serif text-2xl text-muted">
        The first edition is on its way.
      </main>
    );
  }

  const [p1, p2] = lead.excerpt.split("\n\n");

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: absoluteUrl("/"),
          description: SITE.description,
          publisher: {
            "@type": "NewsMediaOrganization",
            name: SITE.name,
            url: absoluteUrl("/"),
            logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
          },
        }}
      />
      <h1 className="sr-only">{SITE.name}: Rwanda&apos;s economy, as it&apos;s lived</h1>

      <section className="grid grid-cols-1 gap-y-7 border-b border-ink pt-7 pb-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Lead story first in source order for mobile and crawlers; placed centrally on wide screens. */}
        <article className="flex min-w-0 flex-col gap-3.5 md:col-span-2 lg:order-2 lg:border-r lg:border-rule lg:px-6">
          <Link href={href(lead)} className="group flex flex-col gap-3.5">
            <StoryImage
              image={lead.leadImage}
              ratio="3/2"
              sizes="(min-width: 1024px) 640px, 100vw"
              priority
              placeholderLabel={`Photo · ${lead.title}`}
            />
            {lead.leadImage?.caption && (
              <div className="-mt-1.5 font-cond text-xs leading-[1.3] text-muted">
                {lead.leadImage.caption}
                {lead.leadImage.credit && ` · ${lead.leadImage.credit}`}
              </div>
            )}
            <span className="kicker text-xs text-accent">{lead.section}</span>
            <h2 className="balance m-0 text-center font-serif text-[clamp(34px,4vw,54px)] leading-[1.02] font-medium tracking-[-.02em] group-hover:text-accent">
              {lead.title}
            </h2>
            <p className="pretty m-0 text-center font-serif text-xl leading-[1.4] text-body italic">{lead.dek}</p>
          </Link>
          <div className="text-center font-cond text-xs leading-none font-semibold tracking-[.06em] text-muted uppercase">
            By {lead.author} · {fmtDate(lead.publishedAt)}
          </div>
          <div className="pretty columns-[2_220px] gap-6 font-serif text-[17px] leading-[1.55] [column-rule:1px_solid_#D6CDBC]">
            {p1 && <p className="m-0 mb-3">{p1}</p>}
            <p className="m-0">
              {p2}{" "}
              <Link
                href={href(lead)}
                className="font-cond text-[13px] leading-none font-semibold tracking-[.05em] text-accent uppercase"
              >
                Continue →
              </Link>
            </p>
          </div>
        </article>

        <div className="flex flex-col gap-[22px] md:border-r md:border-rule md:pr-6 lg:order-1">
          {leftCol.map((a) => (
            <article key={a.id} className="border-b border-rule pb-5">
              <Link href={href(a)} className="group flex flex-col gap-2">
                <span className="kicker text-accent">{a.section}</span>
                <h3 className="balance m-0 font-serif text-2xl leading-[1.12] font-medium tracking-[-.01em] group-hover:text-accent">
                  {a.title}
                </h3>
                <p className="pretty m-0 font-serif text-base leading-[1.45] text-body">{a.dek}</p>
                <span className="font-cond text-xs leading-none font-medium text-muted">{a.readingMinutes} min read</span>
              </Link>
            </article>
          ))}
        </div>

        <aside className="flex flex-col gap-5 md:pl-6 lg:order-3">
          {index && (
            <Link
              href="/essentials-index"
              className="flex flex-col gap-2.5 border border-ink bg-card px-4 py-3.5 hover:bg-[#F8F2E6]"
            >
              <div className="kicker flex justify-between">
                <span>Essentials Index</span>
                <span className="text-muted">{index.lastLabel}</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif text-[44px] leading-none font-medium tracking-[-.02em]">{index.valueF}</span>
                <span className="font-mono text-sm leading-none font-medium text-accent">{index.chg12} y/y</span>
              </div>
              <Sparkline points={index.spark} className="h-11 w-full" label="Essentials Index, last 12 months" />
              <div className="font-serif text-sm leading-[1.35] text-body">
                What {index.items.length} essentials cost a Kigali household, against a year ago.
              </div>
              <div className="font-cond text-xs leading-none font-semibold tracking-[.06em] text-accent uppercase">
                Open the index →
              </div>
            </Link>
          )}
          {opinion.length > 0 && (
            <div className="flex flex-col">
              <h2 className="m-0 border-b-2 border-ink pb-2.5 font-cond text-xs leading-none font-bold tracking-[.1em] uppercase">
                <Link href="/section/opinion">Opinion</Link>
              </h2>
              {opinion.map((a) => (
                <Link key={a.id} href={href(a)} className="group flex flex-col gap-1.5 border-b border-rule py-3.5">
                  <span className="font-serif text-[19px] leading-[1.2] font-medium italic group-hover:text-accent">
                    {a.title}
                  </span>
                  <span className="font-cond text-[11px] leading-none font-semibold tracking-[.08em] text-muted uppercase">
                    {a.author}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </section>

      {colRow.length > 0 && (
        <section className="border-b border-ink pt-[26px] pb-[30px]">
          <SectionHeading title="Cost of living" href="/section/cost-of-living" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-6">
            {colRow.map((a) => (
              <article key={a.id}>
                <Link href={href(a)} className="group flex flex-col gap-2.5">
                  <StoryImage image={a.leadImage} ratio="4/3" sizes="(min-width: 1024px) 300px, 50vw" small />
                  <h3 className="balance m-0 font-serif text-[21px] leading-[1.15] font-medium group-hover:text-accent">
                    {a.title}
                  </h3>
                  <p className="pretty m-0 font-serif text-[15px] leading-[1.45] text-body">{a.dek}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-y-8 border-b border-ink pt-[26px] pb-[30px] md:grid-cols-2">
        <TileColumn title="Jobs & youth" href="/section/jobs" items={jobs} className="md:border-r md:border-rule md:pr-7" />
        <TileColumn title="Countryside" href="/section/agriculture" items={rural} className="md:pl-7" />
      </section>

      <SupportBand />
    </main>
  );
}

function TileColumn({
  title,
  href: more,
  items,
  className,
}: {
  title: string;
  href: string;
  items: ArticleSummary[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      <SectionHeading title={title} href={more} />
      {items.map((a) => (
        <article key={a.id} className="border-b border-rule pb-3.5">
          <Link href={href(a)} className="group grid grid-cols-[1fr_110px] gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="m-0 font-serif text-xl leading-[1.18] font-medium group-hover:text-accent">{a.title}</h3>
              <p className="m-0 font-serif text-[15px] leading-[1.4] text-body">{a.dek}</p>
            </div>
            <StoryImage image={a.leadImage} ratio="1" sizes="110px" small />
          </Link>
        </article>
      ))}
    </div>
  );
}
