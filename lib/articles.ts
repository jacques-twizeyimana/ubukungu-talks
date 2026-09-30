import "server-only";
import { cache } from "react";
import { ObjectId, type Filter, type WithId } from "mongodb";
import { collections } from "./db";
import { sectionSlug } from "./site";
import type { Article, ArticleDoc, ArticleSummary } from "./types";

const summaryProjection = { bodyHtml: 0 } as const;

function toArticle(doc: WithId<ArticleDoc>): Article {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    dek: doc.dek,
    bodyHtml: doc.bodyHtml,
    section: doc.section,
    sectionSlug: sectionSlug(doc.section),
    author: doc.author,
    status: doc.status,
    leadImage: doc.leadImage,
    embedIndex: doc.embedIndex,
    featured: doc.featured,
    wordCount: doc.wordCount,
    readingMinutes: doc.readingMinutes,
    views: doc.views ?? 0,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toSummary(doc: WithId<Omit<ArticleDoc, "bodyHtml">>): ArticleSummary {
  const { bodyHtml: _omit, ...rest } = toArticle({ ...doc, bodyHtml: "" } as WithId<ArticleDoc>);
  void _omit;
  const text = doc.bodyText ?? "";
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return { ...rest, excerpt: paras.slice(0, 2).join("\n\n") };
}

const published: Filter<ArticleDoc> = { status: "published" };

export const getPublishedArticles = cache(async (limit = 60): Promise<ArticleSummary[]> => {
  const { articles } = await collections();
  const docs = await articles
    .find(published, { projection: summaryProjection })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toSummary);
});

export const getSectionArticles = cache(async (section: string, limit = 30): Promise<ArticleSummary[]> => {
  const { articles } = await collections();
  const docs = await articles
    .find({ ...published, section }, { projection: summaryProjection })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toSummary);
});

export const getPublishedArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const { articles } = await collections();
  const doc = await articles.findOne({ ...published, slug });
  return doc ? toArticle(doc) : null;
});

export async function getRelatedArticles(article: Article, limit = 3): Promise<ArticleSummary[]> {
  const { articles } = await collections();
  const docs = await articles
    .find(
      { ...published, _id: { $ne: new ObjectId(article.id) }, section: { $ne: "Opinion" } },
      { projection: summaryProjection },
    )
    .sort({ section: article.section === "Opinion" ? 1 : -1, publishedAt: -1 })
    .limit(20)
    .toArray();
  // Prefer the same section, then fill with the most recent.
  const same = docs.filter((d) => d.section === article.section);
  const rest = docs.filter((d) => d.section !== article.section);
  return [...same, ...rest].slice(0, limit).map(toSummary);
}

/** Slugs to prerender at build time: the most recent stories. Older ones are rendered on first request. */
export async function getPrebuildSlugs(limit = 24): Promise<string[]> {
  const { articles } = await collections();
  const docs = await articles
    .find(published, { projection: { slug: 1 } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => d.slug);
}

export async function getSitemapEntries() {
  const { articles } = await collections();
  return articles
    .find(published, { projection: { slug: 1, updatedAt: 1, publishedAt: 1, section: 1 } })
    .sort({ publishedAt: -1 })
    .limit(5000)
    .toArray();
}

// ---- Admin -----------------------------------------------------------------

export async function getAllArticlesForAdmin(): Promise<ArticleSummary[]> {
  const { articles } = await collections();
  const docs = await articles
    .find({}, { projection: summaryProjection })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(toSummary);
}

export async function getArticleById(id: string): Promise<Article | null> {
  if (!ObjectId.isValid(id)) return null;
  const { articles } = await collections();
  const doc = await articles.findOne({ _id: new ObjectId(id) });
  return doc ? toArticle(doc) : null;
}

export const getIndexStories = cache(async (limit = 4): Promise<ArticleSummary[]> => {
  const { articles } = await collections();
  const docs = await articles
    .find({ ...published, embedIndex: true }, { projection: summaryProjection })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toSummary);
});
