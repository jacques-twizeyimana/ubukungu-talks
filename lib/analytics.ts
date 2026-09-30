import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "./db";
import { SITE } from "./site";

const TZ = SITE.timeZone;
const DAY = 864e5;

export interface Overview {
  visitors: number;
  pageviews: number;
  articleViews: number;
  reads: number;
  readRate: number; // reads / article views
  avgEngagedSec: number; // mean active seconds on article pages
  returningRate: number; // share of visitors seen on 2+ distinct days in the window
  indexViews: number;
  subscribers: number;
  newSubscribers: number;
}

async function overviewFor(from: Date, to: Date) {
  const { pageviews } = await collections();
  const [row] = await pageviews
    .aggregate<{
      pageviews: number;
      articleViews: number;
      reads: number;
      engaged: number;
      indexViews: number;
      visitors: number;
      returning: number;
    }>([
      { $match: { t: { $gte: from, $lt: to } } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                pageviews: { $sum: 1 },
                articleViews: { $sum: { $cond: [{ $ne: ["$articleId", null] }, 1, 0] } },
                reads: { $sum: { $cond: ["$read", 1, 0] } },
                engaged: { $sum: { $cond: [{ $ne: ["$articleId", null] }, "$activeSec", 0] } },
                indexViews: { $sum: { $cond: [{ $eq: ["$path", "/essentials-index"] }, 1, 0] } },
              },
            },
          ],
          visitors: [
            { $group: { _id: "$vid", days: { $addToSet: { $dateTrunc: { date: "$t", unit: "day", timezone: TZ } } } } },
            { $group: { _id: null, visitors: { $sum: 1 }, returning: { $sum: { $cond: [{ $gt: [{ $size: "$days" }, 1] }, 1, 0] } } } },
          ],
        },
      },
      {
        $project: {
          pageviews: { $ifNull: [{ $first: "$totals.pageviews" }, 0] },
          articleViews: { $ifNull: [{ $first: "$totals.articleViews" }, 0] },
          reads: { $ifNull: [{ $first: "$totals.reads" }, 0] },
          engaged: { $ifNull: [{ $first: "$totals.engaged" }, 0] },
          indexViews: { $ifNull: [{ $first: "$totals.indexViews" }, 0] },
          visitors: { $ifNull: [{ $first: "$visitors.visitors" }, 0] },
          returning: { $ifNull: [{ $first: "$visitors.returning" }, 0] },
        },
      },
    ])
    .toArray();
  return row ?? { pageviews: 0, articleViews: 0, reads: 0, engaged: 0, indexViews: 0, visitors: 0, returning: 0 };
}

export async function getOverview(days: number): Promise<{ current: Overview; previous: Overview }> {
  const now = new Date();
  const from = new Date(now.getTime() - days * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);
  const { subscribers } = await collections();
  const [cur, prev, subsTotal, subsNew, subsPrevNew] = await Promise.all([
    overviewFor(from, now),
    overviewFor(prevFrom, from),
    subscribers.countDocuments(),
    subscribers.countDocuments({ createdAt: { $gte: from } }),
    subscribers.countDocuments({ createdAt: { $gte: prevFrom, $lt: from } }),
  ]);
  const shape = (r: typeof cur, subs: number, newSubs: number): Overview => ({
    visitors: r.visitors,
    pageviews: r.pageviews,
    articleViews: r.articleViews,
    reads: r.reads,
    readRate: r.articleViews ? r.reads / r.articleViews : 0,
    avgEngagedSec: r.articleViews ? r.engaged / r.articleViews : 0,
    returningRate: r.visitors ? r.returning / r.visitors : 0,
    indexViews: r.indexViews,
    subscribers: subs,
    newSubscribers: newSubs,
  });
  return {
    current: shape(cur, subsTotal, subsNew),
    previous: shape(prev, subsTotal - subsNew, subsPrevNew),
  };
}

export interface DailyPoint {
  day: string; // YYYY-MM-DD in Kigali time
  pageviews: number;
  visitors: number;
  reads: number;
}

export async function getDaily(days: number): Promise<DailyPoint[]> {
  const { pageviews } = await collections();
  const from = new Date(Date.now() - days * DAY);
  const rows = await pageviews
    .aggregate<{ _id: string; pageviews: number; visitors: string[]; reads: number }>([
      { $match: { t: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { date: "$t", format: "%Y-%m-%d", timezone: TZ } },
          pageviews: { $sum: 1 },
          visitors: { $addToSet: "$vid" },
          reads: { $sum: { $cond: ["$read", 1, 0] } },
        },
      },
    ])
    .toArray();
  const byDay = new Map(rows.map((r) => [r._id, r]));
  // Fill empty days so the chart has a continuous axis.
  const out: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY).toLocaleDateString("en-CA", { timeZone: TZ });
    const r = byDay.get(day);
    out.push({ day, pageviews: r?.pageviews ?? 0, visitors: r?.visitors.length ?? 0, reads: r?.reads ?? 0 });
  }
  return out;
}

export interface ArticleStats {
  id: string;
  title: string;
  slug: string;
  section: string;
  views: number;
  visitors: number;
  reads: number;
  readRate: number;
  avgDepth: number;
  avgEngagedSec: number;
}

export async function getTopArticles(days: number, limit = 10): Promise<ArticleStats[]> {
  const { pageviews } = await collections();
  const from = new Date(Date.now() - days * DAY);
  const rows = await pageviews
    .aggregate<{
      _id: string;
      views: number;
      visitors: string[];
      reads: number;
      avgDepth: number;
      avgActive: number;
      article: { title: string; slug: string; section: string }[];
    }>([
      { $match: { t: { $gte: from }, articleId: { $ne: null } } },
      {
        $group: {
          _id: "$articleId",
          views: { $sum: 1 },
          visitors: { $addToSet: "$vid" },
          reads: { $sum: { $cond: ["$read", 1, 0] } },
          avgDepth: { $avg: "$depth" },
          avgActive: { $avg: "$activeSec" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "articles",
          let: { aid: { $toObjectId: "$_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$aid"] } } }, { $project: { title: 1, slug: 1, section: 1 } }],
          as: "article",
        },
      },
    ])
    .toArray();
  return rows.map((r) => ({
    id: r._id,
    title: r.article[0]?.title || "(deleted story)",
    slug: r.article[0]?.slug ?? "",
    section: r.article[0]?.section ?? "",
    views: r.views,
    visitors: r.visitors.length,
    reads: r.reads,
    readRate: r.views ? r.reads / r.views : 0,
    avgDepth: r.avgDepth ?? 0,
    avgEngagedSec: r.avgActive ?? 0,
  }));
}

/** Share of article readers still on the page at each 10% of the body: the classic "reader drop-off" curve. */
export async function getScrollRetention(days: number, articleId?: string): Promise<{ depth: number; share: number }[]> {
  const { pageviews } = await collections();
  const from = new Date(Date.now() - days * DAY);
  const match: Record<string, unknown> = { t: { $gte: from }, articleId: articleId && ObjectId.isValid(articleId) ? articleId : { $ne: null } };
  const buckets = Array.from({ length: 11 }, (_, i) => i / 10);
  const [row] = await pageviews
    .aggregate<Record<string, number>>([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ...Object.fromEntries(
            buckets.map((b, i) => [`b${i}`, { $sum: { $cond: [{ $gte: ["$depth", b - 0.001] }, 1, 0] } }]),
          ),
        },
      },
    ])
    .toArray();
  if (!row?.total) return buckets.map((b) => ({ depth: b, share: 0 }));
  return buckets.map((b, i) => ({ depth: b, share: row[`b${i}`] / row.total }));
}

export interface Cohort {
  week: string; // Monday of the cohort week, YYYY-MM-DD
  size: number;
  retention: (number | null)[]; // share of the cohort active in week +0, +1, …; null = in the future
}

/** Weekly visitor cohorts: of people first seen in week N, how many came back in each following week. */
export async function getCohorts(weeks = 8): Promise<Cohort[]> {
  const { pageviews } = await collections();
  const from = new Date(Date.now() - weeks * 7 * DAY);
  const rows = await pageviews
    .aggregate<{ _id: Date; size: number; offsets: number[][] }>([
      { $match: { t: { $gte: from } } },
      {
        $group: {
          _id: "$vid",
          first: { $min: "$t" },
          weeks: { $addToSet: { $dateTrunc: { date: "$t", unit: "week", startOfWeek: "monday", timezone: TZ } } },
        },
      },
      { $addFields: { cohort: { $dateTrunc: { date: "$first", unit: "week", startOfWeek: "monday", timezone: TZ } } } },
      {
        $project: {
          cohort: 1,
          offsets: {
            $map: {
              input: "$weeks",
              as: "w",
              in: { $dateDiff: { startDate: "$cohort", endDate: "$$w", unit: "week", startOfWeek: "monday", timezone: TZ } },
            },
          },
        },
      },
      { $group: { _id: "$cohort", size: { $sum: 1 }, offsets: { $push: "$offsets" } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const thisWeek = rows.length ? Math.max(...rows.map((r) => r._id.getTime())) : Date.now();
  return rows.map((r) => {
    const counts = new Array(weeks).fill(0);
    for (const o of r.offsets) for (const w of o) if (w >= 0 && w < weeks) counts[w]++;
    const elapsed = Math.round((thisWeek - r._id.getTime()) / (7 * DAY));
    return {
      week: r._id.toLocaleDateString("en-CA", { timeZone: TZ }),
      size: r.size,
      retention: counts.map((c, w) => (w > elapsed ? null : c / r.size)),
    };
  });
}

export async function getBreakdowns(days: number) {
  const { pageviews } = await collections();
  const from = new Date(Date.now() - days * DAY);
  const [row] = await pageviews
    .aggregate<{ referrers: { _id: string | null; n: number }[]; devices: { _id: string; n: number }[] }>([
      { $match: { t: { $gte: from } } },
      {
        $facet: {
          referrers: [
            { $match: { ref: { $ne: null } } },
            { $group: { _id: "$ref", n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 8 },
          ],
          devices: [{ $group: { _id: "$device", n: { $sum: 1 } } }, { $sort: { n: -1 } }],
        },
      },
    ])
    .toArray();
  return {
    referrers: (row?.referrers ?? []).map((r) => ({ label: r._id ?? "direct", n: r.n })),
    devices: (row?.devices ?? []).map((d) => ({ label: d._id, n: d.n })),
  };
}
