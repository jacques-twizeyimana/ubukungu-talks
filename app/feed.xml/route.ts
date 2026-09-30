import { getPublishedArticles } from "@/lib/articles";
import { SITE, absoluteUrl } from "@/lib/site";

export const revalidate = 1800;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const articles = await getPublishedArticles(40).catch(() => []);
  const items = articles
    .map((a) => {
      const url = absoluteUrl(`/articles/${a.slug}`);
      return `<item><title>${esc(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><category>${esc(a.section)}</category><dc:creator>${esc(a.author)}</dc:creator>${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ""}<description>${esc(a.dek)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(SITE.name)}</title><link>${absoluteUrl("/")}</link><atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/><description>${esc(SITE.description)}</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
