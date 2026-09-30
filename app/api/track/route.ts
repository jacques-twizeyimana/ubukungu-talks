import { z } from "zod";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";

const pageview = z.object({
  kind: z.literal("pv"),
  id: z.string().min(8).max(64),
  path: z.string().startsWith("/").max(300),
  articleId: z.string().regex(/^[a-f0-9]{24}$/).nullable(),
  vid: z.string().min(8).max(64),
  sid: z.string().min(8).max(64),
  nv: z.boolean(),
  ref: z.string().max(200).nullable(),
  w: z.number().int().min(0).max(10000),
});

const engagement = z.object({
  kind: z.literal("eng"),
  id: z.string().min(8).max(64),
  depth: z.number().min(0).max(1),
  activeSec: z.number().int().min(0).max(60 * 60 * 4),
  read: z.boolean(),
});

const payload = z.discriminatedUnion("kind", [pageview, engagement]);

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly/i;

export async function POST(req: Request) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });

  let data: z.infer<typeof payload>;
  try {
    data = payload.parse(JSON.parse(await req.text()));
  } catch {
    return new Response(null, { status: 400 });
  }

  const { pageviews, articles } = await collections();

  if (data.kind === "pv") {
    const device = data.w < 640 ? "mobile" : data.w < 1024 ? "tablet" : "desktop";
    const res = await pageviews.updateOne(
      { _id: data.id },
      {
        $setOnInsert: {
          t: new Date(),
          path: data.path,
          articleId: data.articleId,
          vid: data.vid,
          sid: data.sid,
          newVisitor: data.nv,
          ref: data.ref,
          device,
          depth: 0,
          activeSec: 0,
          read: false,
        },
      },
      { upsert: true },
    );
    if (res.upsertedCount && data.articleId) {
      await articles.updateOne({ _id: new ObjectId(data.articleId) }, { $inc: { views: 1 } });
    }
  } else {
    // Only ever grows: late or out-of-order beacons can't lower the recorded values.
    await pageviews.updateOne(
      { _id: data.id },
      {
        $max: { depth: data.depth, activeSec: data.activeSec },
        ...(data.read ? { $set: { read: true } } : {}),
      },
    );
  }

  return new Response(null, { status: 204 });
}
