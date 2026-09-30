import type { ObjectId } from "mongodb";

export type ArticleStatus = "draft" | "review" | "published";

export interface LeadImage {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
}

export interface ArticleDoc {
  _id: ObjectId;
  slug: string;
  title: string;
  dek: string;
  bodyHtml: string;
  bodyText: string;
  section: string;
  author: string;
  status: ArticleStatus;
  leadImage: LeadImage | null;
  embedIndex: boolean;
  featured: boolean;
  wordCount: number;
  readingMinutes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

/** Serializable article shape passed to components. */
export interface Article {
  id: string;
  slug: string;
  title: string;
  dek: string;
  bodyHtml: string;
  section: string;
  sectionSlug: string;
  author: string;
  status: ArticleStatus;
  leadImage: LeadImage | null;
  embedIndex: boolean;
  featured: boolean;
  wordCount: number;
  readingMinutes: number;
  views: number;
  publishedAt: string | null;
  updatedAt: string;
}

export type ArticleSummary = Omit<Article, "bodyHtml"> & { excerpt: string };

export interface IndexItemDoc {
  _id: string;
  name: string;
  unit: string;
  category: "Food" | "Energy" | "Transport" | "Health" | "Housing";
  weight: number;
  source: string;
  note: string;
  order: number;
  /** Monthly median prices, oldest first. `month` is YYYY-MM. */
  history: { month: string; price: number }[];
}

export interface PageviewDoc {
  _id: string; // client-generated pageview id
  t: Date;
  path: string;
  articleId: string | null;
  vid: string; // anonymous visitor id (first-party localStorage)
  sid: string; // session id (sessionStorage)
  newVisitor: boolean;
  ref: string | null;
  device: "mobile" | "tablet" | "desktop";
  depth: number; // max scroll depth through the article body, 0–1
  activeSec: number; // foreground, visible seconds on the page
  read: boolean;
}

export interface SubscriberDoc {
  _id?: ObjectId;
  email: string;
  createdAt: Date;
  source: string;
}

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: "editor" | "admin";
}
