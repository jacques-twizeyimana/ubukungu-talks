import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrebuildSlugs, getPublishedArticleBySlug, getRelatedArticles } from "@/lib/articles";
import { getEssentialsIndex } from "@/lib/essentials";
import { SITE, absoluteUrl } from "@/lib/site";
import { ArticleView } from "@/components/site/ArticleView";
import { ArticleReadTracker } from "@/components/analytics/ArticleReadTracker";
import { JsonLd } from "@/components/site/JsonLd";

/*
 * Incremental Static Regeneration
 * - The most recent stories are prerendered at build time (generateStaticParams).
 * - Any other slug is rendered on its first request, then cached like a prebuilt page (dynamicParams).
 * - Cached pages are refreshed in the background at most once an hour, and immediately
 *   when an editor publishes or updates the story (revalidatePath in app/admin/actions.ts).
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getPrebuildSlugs(24)).map((slug) => ({ slug }));
  } catch (err) {
    // No database at build time: every article is generated on demand instead.
    console.warn("[articles] generateStaticParams skipped:", (err as Error).message);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Story not found", robots: { index: false } };
  const path = `/articles/${article.slug}`;
  return {
    title: article.title,
    description: article.dek || undefined,
    authors: [{ name: article.author }],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: article.title,
      description: article.dek || undefined,
      siteName: SITE.name,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      section: article.section,
      authors: [article.author],
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.dek || undefined },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const [index, related] = await Promise.all([getEssentialsIndex(), getRelatedArticles(article)]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": article.section === "Opinion" ? "OpinionNewsArticle" : "NewsArticle",
          headline: article.title,
          description: article.dek,
          articleSection: article.section,
          wordCount: article.wordCount,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
          image: article.leadImage ? [new URL(article.leadImage.url, SITE.url).toString()] : [absoluteUrl(`/articles/${article.slug}/opengraph-image`)],
          author: [{ "@type": article.author === SITE.name ? "Organization" : "Person", name: article.author }],
          publisher: {
            "@type": "NewsMediaOrganization",
            name: SITE.name,
            url: absoluteUrl("/"),
            logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
          },
          isAccessibleForFree: true,
        }}
      />
      <ArticleView article={article} index={index} related={related} />
      <ArticleReadTracker articleId={article.id} readingMinutes={article.readingMinutes} />
    </>
  );
}
