import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/articles";
import { ALL_SECTIONS, absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/essentials-index"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...ALL_SECTIONS.map((s) => ({
      url: absoluteUrl(`/section/${s.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
  try {
    const articles = await getSitemapEntries();
    return [
      ...staticEntries,
      ...articles.map((a) => ({
        url: absoluteUrl(`/articles/${a.slug}`),
        lastModified: a.updatedAt ?? a.publishedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
