import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { SITE, absoluteUrl } from "@/lib/site";
import type { Article, ArticleSummary } from "@/lib/types";
import type { EssentialsIndex } from "@/lib/essentials";
import { StoryImage } from "./StoryImage";
import { Sparkline } from "./Sparkline";

/** The article page body. Shared by the public route and the newsroom preview. */
export function ArticleView({
  article,
  index,
  related,
}: {
  article: Article;
  index: EssentialsIndex | null;
  related: ArticleSummary[];
}) {
  const url = absoluteUrl(`/articles/${article.slug}`);
  const share = encodeURIComponent(`${article.title} ${url}`);
  const topRisers = index ? [...index.items].sort((a, b) => b.ch - a.ch).slice(0, 3) : [];

  return (
    <main className="pt-9 pb-5">
      <article>
        <header className="mx-auto flex max-w-[780px] flex-col items-center gap-[18px] text-center">
          <Link href={`/section/${article.sectionSlug}`} className="kicker text-xs text-accent hover:underline">
            {article.section}
          </Link>
          <h1 className="balance m-0 font-serif text-[clamp(38px,5.5vw,66px)] leading-[1.02] font-medium tracking-[-.025em]">
            {article.title}
          </h1>
          {article.dek && (
            <p className="pretty m-0 font-serif text-[23px] leading-[1.4] text-body italic">{article.dek}</p>
          )}
          <div className="flex flex-wrap justify-between gap-3 self-stretch border-y border-ink py-3 font-cond text-xs leading-none font-semibold tracking-[.06em] text-muted uppercase">
            <span>
              By <span className="text-ink">{article.author}</span> ·{" "}
              <time dateTime={article.publishedAt ?? undefined}>{fmtDate(article.publishedAt, "long")}</time>
            </span>
            <span className="flex gap-3">
              <span>{article.readingMinutes} min read</span>
              <span aria-hidden>·</span>
              <a href={`https://wa.me/?text=${share}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                WhatsApp
              </a>
              <a
                href={`https://x.com/intent/post?text=${share}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                Facebook
              </a>
            </span>
          </div>
        </header>

        <figure className="mx-auto mt-[30px] mb-0 max-w-[1040px]">
          <StoryImage
            image={article.leadImage}
            ratio="21/9"
            sizes="(min-width: 1100px) 1040px, 100vw"
            priority
            placeholderLabel="Lead photograph"
          />
          {article.leadImage?.caption && (
            <figcaption className="mt-2 font-cond text-xs leading-[1.3] text-muted">
              {article.leadImage.caption}
              {article.leadImage.credit && ` · ${article.leadImage.credit}`}
            </figcaption>
          )}
        </figure>

        <div className="mx-auto mt-[34px] flex max-w-[680px] flex-col gap-[22px]">
          <div id="article-body" className="article-body" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />

          {article.embedIndex && index && (
            <Link href="/essentials-index" className="flex flex-col gap-1.5 border border-ink bg-card px-5 py-[18px]">
              <div className="kicker flex justify-between">
                <span className="text-accent">From the Essentials Index</span>
                <span>Full index →</span>
              </div>
              {topRisers.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1fr_90px_auto] items-center gap-3.5 border-b border-rule py-2"
                >
                  <span className="font-serif text-lg leading-[1.2] font-medium">
                    {b.name} <span className="text-sm text-muted">/ {b.unit}</span>
                  </span>
                  <Sparkline points={b.spark} width={1.5} className="h-[22px] w-[90px]" />
                  <span className="font-mono text-sm leading-none font-medium text-accent">{b.chg}</span>
                </div>
              ))}
            </Link>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-4 border border-ink p-6">
            <span className="max-w-[420px] font-serif text-xl leading-[1.3] font-medium">
              Found this useful? Stories like this are paid for by readers.
            </span>
            <a
              href={SITE.coffeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent px-[18px] py-3.5 font-cond text-sm leading-none font-semibold tracking-[.06em] text-white uppercase hover:bg-accent-dark"
            >
              Buy us a coffee
            </a>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-[50px] border-t-[3px] border-double border-ink pt-5" aria-labelledby="keep-reading">
          <h2 id="keep-reading" className="kicker m-0 mb-1.5 text-xs text-ink">
            Keep reading
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-x-8">
            {related.map((a) => (
              <Link key={a.id} href={`/articles/${a.slug}`} className="group flex flex-col gap-2 py-3.5">
                <span className="kicker text-accent">{a.section}</span>
                <span className="font-serif text-[22px] leading-[1.2] font-medium group-hover:text-accent">{a.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
