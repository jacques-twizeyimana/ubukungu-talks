import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSectionArticles } from "@/lib/articles";
import { ALL_SECTIONS, SITE, sectionBySlug } from "@/lib/site";
import { fmtDate } from "@/lib/format";
import { StoryImage } from "@/components/site/StoryImage";
import { SectionHeading } from "@/components/site/SectionHeading";

export const revalidate = 1800;
// Unknown section slugs 404 via notFound(). (dynamicParams=false breaks on-demand revalidation of these paths.)
export const dynamicParams = true;

export function generateStaticParams() {
  return ALL_SECTIONS.map((s) => ({ slug: s.slug }));
}

const blurbs: Record<string, string> = {
  "cost-of-living": "What things cost, month by month — and who ends up paying.",
  jobs: "First jobs, day contracts, and the long wait between a degree and a salary.",
  agriculture: "Harvests, hills and the prices farmers get against the prices we pay.",
  health: "Clinic fees, prescriptions and the gaps insurance doesn't cover.",
  transport: "Moto fares, bus routes and the commute as a share of a wage.",
  policy: "Plain-language reads of budgets, plans and the numbers behind them.",
  opinion: "Arguments from our editors, guest writers and readers.",
};

export async function generateMetadata({ params }: PageProps<"/section/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const section = sectionBySlug(slug);
  if (!section) return {};
  return {
    title: section.name,
    description: `${blurbs[slug] ?? ""} ${SITE.name} on Rwanda's economy.`.trim(),
    alternates: { canonical: `/section/${slug}` },
  };
}

export default async function SectionPage({ params }: PageProps<"/section/[slug]">) {
  const { slug } = await params;
  const section = sectionBySlug(slug);
  if (!section) notFound();
  const stories = await getSectionArticles(section.name, 40);
  const [top, ...rest] = stories;

  return (
    <main className="pt-7 pb-5">
      <SectionHeading title={section.name} as="h1" />
      <p className="m-0 -mt-2 mb-7 max-w-[640px] font-serif text-[19px] leading-[1.45] text-body italic">{blurbs[slug]}</p>

      {!top && <p className="py-16 text-center font-serif text-xl text-muted">No stories here yet.</p>}

      {top && (
        <article className="border-b border-ink pb-8">
          <Link href={`/articles/${top.slug}`} className="group grid grid-cols-1 items-center gap-7 md:grid-cols-[3fr_2fr]">
            <StoryImage image={top.leadImage} ratio="3/2" sizes="(min-width: 768px) 60vw, 100vw" priority />
            <div className="flex flex-col gap-3">
              <h2 className="balance m-0 font-serif text-[clamp(30px,3.4vw,46px)] leading-[1.04] font-medium tracking-[-.02em] group-hover:text-accent">
                {top.title}
              </h2>
              <p className="pretty m-0 font-serif text-xl leading-[1.4] text-body italic">{top.dek}</p>
              <span className="font-cond text-xs leading-none font-semibold tracking-[.06em] text-muted uppercase">
                By {top.author} · {fmtDate(top.publishedAt)} · {top.readingMinutes} min read
              </span>
            </div>
          </Link>
        </article>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-x-8 gap-y-2 pt-6">
          {rest.map((a) => (
            <article key={a.id} className="border-b border-rule pb-5">
              <Link href={`/articles/${a.slug}`} className="group flex flex-col gap-2.5">
                <StoryImage image={a.leadImage} ratio="4/3" sizes="(min-width: 1024px) 400px, 100vw" small />
                <h3 className="balance m-0 font-serif text-[21px] leading-[1.15] font-medium group-hover:text-accent">
                  {a.title}
                </h3>
                <p className="pretty m-0 font-serif text-[15px] leading-[1.45] text-body">{a.dek}</p>
                <span className="font-cond text-xs leading-none font-medium text-muted">
                  {fmtDate(a.publishedAt)} · {a.readingMinutes} min read
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
