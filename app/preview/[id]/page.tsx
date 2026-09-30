import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { getArticleById, getRelatedArticles } from "@/lib/articles";
import { getEssentialsIndex } from "@/lib/essentials";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ArticleView } from "@/components/site/ArticleView";
import { STATUS_LABEL } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

// Always rendered fresh from the database, including unpublished drafts. Not cached, not tracked.
export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  await requireEditor();
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();
  const [index, related] = await Promise.all([getEssentialsIndex(), getRelatedArticles(article)]);

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-center gap-3 bg-accent px-4 py-2 font-cond text-xs font-semibold tracking-[.06em] text-white uppercase">
        Preview · {STATUS_LABEL[article.status]} · not visible to readers unless published
      </div>
      <div className="mx-auto max-w-[1320px] px-[clamp(16px,4vw,48px)]">
        <Header index={index} />
        <ArticleView article={{ ...article, title: article.title || "Untitled story" }} index={index} related={related} />
        <Footer />
      </div>
    </>
  );
}
