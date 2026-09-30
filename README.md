# Ubukungu Talks

Independent, reader-funded reporting on Rwanda's economy **as it is lived**: inflation, the cost of living, rent, fares and the price of beans, not GDP growth alone.

Next.js 16 (App Router) · Tailwind CSS 4 · MongoDB · Tiptap editor. Built from the Claude Design handoff in `ubukungu-talks-website-design/` (`Ubukungu Talks v2.dc.html`).

## Quick start

```bash
pnpm install
cp .env.example .env.local        # then set SESSION_SECRET and SEED_EDITOR_PASSWORD
pnpm db:up                        # MongoDB 7 in Docker on localhost:27017
pnpm seed:demo                    # stories + Essentials Index + editor account + demo analytics
pnpm dev                          # http://localhost:3000, newsroom at /admin
```

`pnpm seed` does the same without the synthetic analytics. Pass `--reset` to wipe articles, the index and pageviews first. For a production check, run `pnpm build && pnpm start`.

## Routes

| Route | Rendering |
|---|---|
| `/` front page | ISR, revalidates every 10 min, plus on publish |
| `/articles/[slug]` | **ISR**: the 24 newest stories are prebuilt; any other slug is rendered on its first request and then cached (`dynamicParams`); refreshed hourly and on publish/update |
| `/section/[slug]` | ISR, 30 min |
| `/essentials-index` | ISR, 1 h, plus on price publish |
| `/sitemap.xml`, `/robots.txt`, `/feed.xml` | static, revalidated |
| `/articles/[slug]/opengraph-image` | generated social card |
| `/admin/*` | dynamic, behind login (`proxy.ts` plus a session check in every page and action) |
| `/preview/[id]` | uncached draft preview for editors |
| `/api/track` | analytics beacon |
| `/api/upload`, `/api/media/[id]` | image upload to GridFS; served with `immutable` caching |

### Caching model

Pages read MongoDB directly and are cached as full HTML by Next's ISR cache. Readers never wait on the database once a page is cached. When an editor publishes, updates or unpublishes a story, `app/admin/actions.ts` calls `revalidatePath` for the story, the front page, its section, the sitemap and the RSS feed. Publishing new index prices revalidates the whole site, because the index headline sits in every masthead.

## Newsroom (`/admin`)

- **Dashboard**: readers, reads, index views and newsletter subscribers; most-read stories; drafts and stories in review; a reminder when the month's prices are due.
- **Stories**: filter by status, search headlines.
- **Editor** (Tiptap): headings and kicker, bold/italic/underline/strike, superscript/subscript, brand text colours and highlights, links, alignment, lists, quote, **pull quote**, **fact box**, code, divider, inline image upload (alt text required), tables with row/column tools. Also a lead image with caption and credit, section, byline, editable URL, a "lead story" flag, an embedded Essentials Index box, word count and read time, and a search-result preview. **⌘S** saves, drafts autosave, and you're warned before leaving with unsaved changes. The workflow is draft → review → published → update/unpublish. All HTML is sanitised on the server.
- **Essentials Index**: enter the month's prices, see the index recalculate live, publish to the site, then start the next month.
- **Analytics** (7/30/90 days): see below.

## Analytics

First-party and cookie-less. The visitor id is a random UUID in `localStorage`; no IPs are stored, and Do-Not-Track / GPC and bots are respected. Each pageview is **one MongoDB document** (`pageviews`), created by a beacon and then updated with `$max` as the reader scrolls:

- **Page visits**: views, unique visitors, referrer host, device class.
- **Article reads**: a view counts as a *read* when the reader reaches 80% of the body with enough active (visible, focused, non-idle) time to have read it: at least 20 s, or 35% of the estimated reading time.
- **Retention**:
  - *reader retention*: the share of readers still on the page at each 10% of a story;
  - *visitor retention*: weekly cohorts showing how many first-time readers return in the weeks after;
  - the returning-visitor rate.

Raw pageviews expire after about 13 months (TTL index).

## SEO and performance

Self-hosted fonts via `next/font`, `next/image` (AVIF/WebP), and static HTML for every public page. Also: canonical URLs, Open Graph/Twitter cards, `NewsArticle`/`OpinionNewsArticle`, `WebSite` and `Dataset` JSON-LD, sitemap, robots and RSS. Admin and preview are marked noindex. Client JavaScript on public pages is limited to the analytics beacon, the newsletter form and the index table.

## Environment

See `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the public origin in production; canonical URLs, the sitemap and social cards use it.
