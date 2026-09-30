/**
 * Seeds a local database with the stories and Essentials Index basket from the design,
 * plus a newsroom editor account.
 *
 *   pnpm seed                    # articles, index, editor (idempotent: existing articles are left alone)
 *   pnpm seed --demo-analytics   # also generate ~60 days of synthetic pageviews for the dashboards
 *   pnpm seed --reset            # drop articles/index/pageviews first
 */
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "ubukungu";
const args = new Set(process.argv.slice(2));

const slugify = (s: string) => {
  const slug = s
    .toLowerCase()
    .replace(/[’'"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= 80) return slug;
  const cut = slug.slice(0, 81);
  return cut.slice(0, cut.lastIndexOf("-"));
};

const html = (paras: string[], quote?: string) => {
  const ps = paras.map((p) => `<p>${p}</p>`);
  if (quote) ps.splice(Math.min(3, ps.length), 0, `<blockquote class="pullquote"><p>${quote}</p></blockquote>`);
  return ps.join("");
};
const text = (paras: string[]) => paras.join("\n\n");

type Seed = {
  section: string;
  status: "published" | "draft" | "review";
  date: string | null;
  author: string;
  title: string;
  dek: string;
  body: string[];
  quote?: string;
  embedIndex?: boolean;
  featured?: boolean;
};

const STORIES: Seed[] = [
  {
    section: "Agriculture",
    status: "published",
    date: "2026-09-28",
    author: "Ubukungu Talks",
    featured: true,
    embedIndex: true,
    title: "Rwanda's wetlands: the parks are beautiful, but what is the price of the food we lose?",
    dek: "Clearing farms from Kigali's marshes gave the city green space. It also moved vegetables further from the people who eat them.",
    quote: "A growth figure is an average. A market price is something you pay alone.",
    body: [
      "Walk through one of Kigali's restored wetlands on a Sunday and it is hard to argue with the result. Boardwalks, birdsong, young couples taking photographs where, a few years ago, there were rows of sweet potato, amaranth and cabbage.",
      "Those rows fed people. Marshland plots close to the city were among the cheapest sources of fresh vegetables for nearby households, and a steady income for the farmers — many of them women — who worked them.",
      "When farming moved out, the produce did not stop being eaten. It started travelling further, through more hands. Each extra kilometre and each extra trader is a small addition to the price at the market stall.",
      "None of this means the wetlands should have stayed farms. Flood control and biodiversity are real public goods. But a policy is only honest if it counts all its costs, and one of the costs here lands on the plate.",
      "The question we put to readers is simple: when a city gets more beautiful, who pays, and are they the same people who get to enjoy it?",
    ],
  },
  {
    section: "Cost of living",
    status: "published",
    date: "2026-09-21",
    author: "Ubukungu Talks",
    embedIndex: true,
    title: "A litre of milk, then and now",
    dek: "Why the most ordinary item in a Kigali kitchen became a monthly calculation.",
    body: [
      "Ask a kiosk owner in Remera what has changed this year and the answer usually starts with milk. Not because it is the most expensive thing on the shelf, but because it is the thing everyone buys, every day.",
      "Milk is a useful measure precisely because it is ordinary. When the price of something bought daily moves, households notice long before any official figure is published.",
      "Behind the counter, the story is about feed, dry seasons and the cost of getting milk from farm to city. In front of it, the story is simpler: a family that once bought two litres now buys one, and stretches it.",
      "Our Essentials Index tracks milk alongside twelve other items every month, so that change is recorded as it is lived, not only as it is averaged.",
    ],
  },
  {
    section: "Jobs",
    status: "published",
    date: "2026-09-14",
    author: "Ubukungu Talks",
    title: "Graduates, waiting: the long queue between a degree and a first salary",
    dek: "Youth unemployment is a statistic until it is your cousin, three years on, still applying.",
    body: [
      "Every graduation season adds a new cohort to a queue that is already long. The degree certificate is framed; the job applications begin.",
      "The waiting years are rarely idle. Graduates tutor, trade, help in family businesses and take short contracts. Much of this work is invisible in the headline figures, and most of it pays little.",
      "What the queue costs is not only income. It is time — the years in which a first salary would have become savings, a rented room, a start.",
      "We want to hear from readers in the queue. What has the wait cost you, and what would shorten it?",
    ],
  },
  {
    section: "Transport",
    status: "published",
    date: "2026-09-07",
    author: "Ubukungu Talks",
    embedIndex: true,
    title: "The moto maths: what a commute really costs a young worker",
    dek: "Add up a month of fares against an entry-level wage and the numbers stop working.",
    body: [
      "Two moto rides a day does not sound like much. Multiply it by the working days in a month and set it against an entry-level wage, and it becomes one of the largest items in a young worker's budget.",
      "Many commuters mix modes to manage it: a bus for the long stretch, a moto for the last kilometre when late, walking when the month is nearly over.",
      "Fuel prices and fare changes feed straight into these calculations. A small change per trip becomes a meaningful change per month.",
      "The question is not whether transport should cost money. It is whether the cost of getting to work leaves enough of the wage to make the work worth it.",
    ],
  },
  {
    section: "Health",
    status: "published",
    date: "2026-08-31",
    author: "Ubukungu Talks",
    title: "Mutuelle covers the visit. Who covers the prescription?",
    dek: "Community health insurance opened the clinic door. The pharmacy counter is another matter.",
    body: [
      "Community-based health insurance has made a first visit to a health centre affordable for millions of households. That is a real achievement.",
      "The gap many readers describe comes afterwards: a prescription for a medicine the facility does not stock, filled at a private pharmacy at full price.",
      "For a household already careful with every franc, that second bill can decide whether a course of treatment is finished.",
      "We are collecting readers' receipts — anonymised — to understand where the gaps are largest.",
    ],
  },
  {
    section: "Policy",
    status: "published",
    date: "2026-08-24",
    author: "Ubukungu Talks",
    title: "Growth on paper: reading the GDP figures against the market basket",
    dek: "A plain-language guide to why a fast-growing economy can still feel like it's shrinking.",
    body: [
      "Gross domestic product measures the value of everything an economy produces. It is an essential number. It is also an average, and averages hide a great deal.",
      "An economy can grow quickly while the prices of the things poorer households buy most rise faster than their incomes. Both statements can be true at once.",
      "That is why we publish the Essentials Index: not to argue with the growth figures, but to sit beside them, and to ask what growth looks like from the market stall.",
    ],
  },
  { section: "Opinion", status: "published", date: "2026-08-20", author: "Guest writer", title: "Stop telling young people to “just start a business”", dek: "Entrepreneurship is not a substitute for jobs, and it is unfair to pretend otherwise.", body: ["Every panel on youth unemployment ends with the same advice: create your own job. It sounds empowering. For most young people without capital, collateral or connections, it is a way of moving responsibility onto the people with the least room to carry it.", "Some businesses will succeed, and they deserve support. But an economy that needs its graduates to become employers before they have ever been employees has a jobs problem, not a mindset problem."] },
  { section: "Opinion", status: "published", date: "2026-08-16", author: "Editorial board", title: "A price index for people, not for planners", dek: "Why we started measuring the cost of living ourselves.", body: ["Official inflation statistics are careful and necessary. They are also built to describe the whole economy, which means they describe no household in particular.", "Our Essentials Index is deliberately narrower: thirteen things a young Kigali household buys, priced every month at the places they buy them. It is not a replacement for official data. It is a second lens."] },
  { section: "Opinion", status: "published", date: "2026-08-11", author: "Reader letter", title: "I earn more than my parents did. I can afford less.", dek: "A reader on the arithmetic of a first salary.", body: ["On paper, my salary is higher than anything my parents earned at my age. In practice, rent, transport and food take most of it before the month is half over.", "I am not asking for sympathy. I am asking that when we talk about progress, we also talk about what that progress buys."] },
  { section: "Cost of living", status: "published", date: "2026-08-09", author: "Ubukungu Talks", embedIndex: true, title: "Rent in Kimironko: a room, a shared tap, and a third of your pay", dek: "What a first home costs a graduate in Kigali.", body: ["For many young workers, the first home in Kigali is a single room in a shared compound. The rent is the largest fixed cost of the month.", "Listings suggest that room rents have risen faster than entry-level wages in several neighbourhoods. Tenants respond by sharing, moving further out, or staying with family longer.", "Each of those choices has a cost that never appears in the rent itself: longer commutes, less privacy, delayed independence."] },
  { section: "Cost of living", status: "published", date: "2026-08-02", author: "Ubukungu Talks", embedIndex: true, title: "Charcoal or gas? The kitchen maths behind a policy push", dek: "Cleaner cooking is cheaper over a year — if you can afford the cylinder.", body: ["Over a year, cooking with gas can cost a household less than charcoal. The difficulty is the up-front cost of the cylinder, burner and first refill.", "Households that live week to week buy fuel week to week. A cheaper option that requires a large payment today is not cheaper for them yet.", "Policies that close that gap — through financing, smaller refills or cylinder deposits — may matter as much as the price of gas itself."] },
  { section: "Jobs", status: "published", date: "2026-07-27", author: "Ubukungu Talks", title: "Casual work, permanent worry: life on day contracts", dek: "Construction sites keep Kigali growing and their workers guessing.", body: ["Each morning, workers gather at the gates of construction sites hoping to be picked for the day. Some weeks bring five days of work; others bring one.", "Irregular income makes every other cost harder to manage. Rent is monthly; wages are daily and uncertain."] },
  { section: "Jobs", status: "published", date: "2026-07-20", author: "Ubukungu Talks", title: "The internship that never becomes a job", dek: "Unpaid placements have become a rite of passage. Few lead anywhere.", body: ["Internships are meant to be a bridge to employment. For many graduates they have become a waiting room instead — unpaid or barely paid, and renewed rather than converted.", "The cost is carried by families who support interns through months without income."] },
  { section: "Agriculture", status: "published", date: "2026-07-13", author: "Ubukungu Talks", title: "In the hills, the harvest pays less than it did", dek: "Rural incomes and the widening gap with Kigali.", body: ["Farm-gate prices and city market prices are two ends of the same chain. Farmers in the hills often see the first; city households pay the second.", "When input costs rise and farm-gate prices do not, the farmer's margin is squeezed even as the city price climbs."] },
  { section: "Agriculture", status: "published", date: "2026-07-06", author: "Ubukungu Talks", title: "Why a farmer in Musanze sells low and buys high", dek: "Harvest-time gluts and lean-season shortages, explained.", body: ["At harvest, everyone sells at once and prices fall. Months later, the same household may buy back staples at a much higher price.", "Storage and credit are what separate those who can wait for better prices from those who cannot."] },
  { section: "Agriculture", status: "published", date: "2026-06-29", author: "Ubukungu Talks", title: "Land consolidation, ten years on", dek: "Higher yields on paper. Mixed fortunes on the ground.", body: ["Land use consolidation promised higher yields through coordinated planting. Many areas did see productivity gains.", "Farmers' experiences vary: some welcome the inputs and extension support, others miss the flexibility of growing what their household eats."] },
  { section: "Cost of living", status: "draft", date: null, author: "Ubukungu Talks", title: "Back-to-school: the uniform, the fees, the bus", dek: "", body: ["Draft notes: price out a full back-to-school list for one child in Kigali."] },
  { section: "Cost of living", status: "review", date: null, author: "Ubukungu Talks", embedIndex: true, title: "Essentials Index, September: beans lead the climb", dek: "Our monthly price survey.", body: ["Beans were again the fastest-rising item in our basket this month, driven by two weak seasons and higher transport costs.", "Tomatoes and milk followed. Sugar was broadly stable."] },
];

// Same deterministic history generator as the design prototype.
function mk(id: string, name: string, unit: string, category: string, w: number, then: number, now: number, source: string, note: string, order: number) {
  const months: string[] = [];
  for (let i = 0; i < 13; i++) {
    const d = new Date(Date.UTC(2025, 8 + i, 15));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const hist: number[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const wob = Math.sin(i * 1.7 + id.length) * 0.035 * then;
    hist.push(Math.round((then + (now - then) * Math.pow(t, 1.3) + (i ? wob : 0)) / 10) * 10);
  }
  hist.push(now);
  return { _id: id, name, unit, category, weight: w, source, note, order, history: months.map((month, i) => ({ month, price: hist[i] })) };
}

const BASKET = [
  mk("beans", "Beans", "kg", "Food", 0.12, 900, 1300, "Kimironko, Nyabugogo", "The protein of most Rwandan kitchens. Two weak seasons and higher transport costs pushed beans to the top of the ranking.", 1),
  mk("tom", "Tomatoes", "kg", "Food", 0.05, 600, 850, "Kimironko, Kicukiro", "Among the vegetables most affected by farming moving out of city wetlands; now trucked in from further away.", 2),
  mk("milk", "Milk", "litre", "Food", 0.07, 500, 700, "Kiosks, Kicukiro & Remera", "Fresh milk from kiosks. Feed prices and dry-season supply drove most of the increase.", 3),
  mk("pot", "Irish potatoes", "kg", "Food", 0.07, 450, 600, "Nyabugogo", "Staple from the north. Transport fares feed directly into the city price.", 4),
  mk("flour", "Maize flour", "kg", "Food", 0.08, 800, 1050, "Kimironko", "Kawunga for ugali. Tracks regional maize prices closely.", 5),
  mk("rice", "Rice", "kg", "Food", 0.08, 1400, 1750, "Nyabugogo", "Local and imported mixed. Exchange rate weakness adds to imported grades.", 6),
  mk("oil", "Cooking oil", "litre", "Food", 0.05, 3200, 3900, "Supermarkets & kiosks", "Mostly imported, so moves with the franc and global vegetable-oil prices.", 7),
  mk("sugar", "Sugar", "kg", "Food", 0.04, 1500, 1700, "Kiosks", "Relatively stable this year after sharp rises in 2023.", 8),
  mk("char", "Charcoal", "sack", "Energy", 0.08, 18000, 22000, "Nyabugogo depots", "Still the main cooking fuel for many city households despite the gas push.", 9),
  mk("moto", "Moto fare", "5 km", "Transport", 0.1, 800, 1000, "Remera – Town route", "The young worker’s commute. Fuel costs and metered pricing both played a part.", 10),
  mk("bus", "Bus fare", "city trip", "Transport", 0.06, 307, 350, "RURA published fares", "Regulated fare, adjusted once this year after the fuel subsidy ended.", 11),
  mk("clinic", "Clinic visit", "private", "Health", 0.08, 10000, 12000, "Three Kigali clinics", "Consultation fee without insurance, the price many young people pay out of pocket.", 12),
  mk("rent", "Room rent", "month", "Housing", 0.12, 60000, 70000, "Kimironko, Gikondo listings", "A single room in a shared compound — the first home for many graduates.", 13),
];

async function main() {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const articles = db.collection("articles");

  if (args.has("--reset")) {
    await Promise.all(["articles", "indexItems", "pageviews"].map((c) => db.collection(c).deleteMany({})));
    console.log("Reset articles, indexItems, pageviews");
  }

  let inserted = 0;
  for (const s of STORIES) {
    const slug = slugify(s.title);
    const words = text(s.body).split(/\s+/).length;
    const published = s.date ? new Date(`${s.date}T08:00:00+02:00`) : null;
    const res = await articles.updateOne(
      { slug },
      {
        $setOnInsert: {
          _id: new ObjectId(),
          slug,
          title: s.title,
          dek: s.dek,
          bodyHtml: html(s.body, s.quote),
          bodyText: text(s.body),
          section: s.section,
          author: s.author,
          status: s.status,
          leadImage: null,
          embedIndex: !!s.embedIndex,
          featured: !!s.featured,
          wordCount: words,
          readingMinutes: Math.max(1, Math.round(words / 220)),
          views: 0,
          createdAt: published ?? new Date(),
          updatedAt: published ?? new Date(),
          publishedAt: published,
        },
      },
      { upsert: true },
    );
    inserted += res.upsertedCount;
  }
  console.log(`Articles: ${inserted} inserted, ${STORIES.length - inserted} already present`);

  for (const item of BASKET) {
    await db.collection<{ _id: string }>("indexItems").replaceOne({ _id: item._id }, item, { upsert: true });
  }
  console.log(`Essentials Index: ${BASKET.length} items`);

  const email = (process.env.SEED_EDITOR_EMAIL ?? "editor@ubukungu.test").toLowerCase();
  const password = process.env.SEED_EDITOR_PASSWORD;
  if (!password || password === "change-me") {
    console.warn("SEED_EDITOR_PASSWORD is not set in .env.local — skipping editor account.");
  } else {
    await db.collection("users").updateOne(
      { email },
      { $set: { email, name: "Editor", role: "admin", passwordHash: await bcrypt.hash(password, 12) } },
      { upsert: true },
    );
    console.log(`Editor account: ${email} (password from .env.local)`);
  }

  if (args.has("--demo-analytics")) await demoAnalytics(db);

  await client.close();
}

/** Synthetic traffic so the dashboards have something to show locally. Clearly not real data. */
async function demoAnalytics(db: import("mongodb").Db) {
  const pv = db.collection("pageviews");
  await pv.deleteMany({ demo: true });
  const pub = await db.collection("articles").find({ status: "published" }).project({ _id: 1, slug: 1, readingMinutes: 1 }).toArray();
  if (!pub.length) return;

  let seed = 42;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pick = <T,>(xs: T[], weights: number[]) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < xs.length; i++) if ((r -= weights[i]) <= 0) return xs[i];
    return xs[xs.length - 1];
  };
  const weights = pub.map((_, i) => 1 / (i + 1.5));
  const refs = [null, null, null, "www.google.com", "t.co", "l.facebook.com", "wa.me", "www.linkedin.com"];
  const devices = ["mobile", "mobile", "mobile", "desktop", "tablet"];

  const docs: Record<string, unknown>[] = [];
  const DAYS = 60;
  const visitors = Array.from({ length: 2600 }, () => ({
    vid: randomUUID(),
    first: Math.floor(rand() * DAYS),
    loyalty: rand() ** 2.2, // most people visit once; a few come back often
    device: devices[Math.floor(rand() * devices.length)],
  }));
  for (const v of visitors) {
    let seen = false;
    for (let d = v.first; d >= 0; d--) {
      if (d !== v.first && rand() > v.loyalty * 0.45) continue;
      const sid = randomUUID();
      const t0 = Date.now() - d * 864e5 - rand() * 864e5;
      const pages = 1 + Math.floor(rand() * 3);
      for (let p = 0; p < pages; p++) {
        const isArticle = rand() < 0.72;
        const art = isArticle ? pick(pub, weights) : null;
        const depth = isArticle ? Math.min(1, Math.max(0.05, rand() ** 0.7 * 1.1)) : 0;
        const activeSec = isArticle ? Math.round(depth * (art!.readingMinutes as number) * 60 * (0.5 + rand())) : Math.round(rand() * 40);
        const path = art ? `/articles/${art.slug}` : pick(["/", "/essentials-index", "/section/cost-of-living", "/section/jobs"], [6, 3, 1, 1]);
        docs.push({
          _id: randomUUID(),
          t: new Date(t0 + p * 90_000),
          path,
          articleId: art ? art._id.toHexString() : null,
          vid: v.vid,
          sid,
          newVisitor: !seen && p === 0,
          ref: p === 0 ? refs[Math.floor(rand() * refs.length)] : null,
          device: v.device,
          depth: Math.round(depth * 100) / 100,
          activeSec,
          read: depth >= 0.8 && activeSec >= Math.max(20, (art?.readingMinutes as number) * 60 * 0.35),
          demo: true,
        });
      }
      seen = true;
    }
  }
  for (let i = 0; i < docs.length; i += 2000) await pv.insertMany(docs.slice(i, i + 2000) as never[]);

  // Keep the per-article counters in step with the synthetic views.
  const counts = await pv.aggregate<{ _id: string; n: number }>([{ $match: { articleId: { $ne: null } } }, { $group: { _id: "$articleId", n: { $sum: 1 } } }]).toArray();
  for (const c of counts) await db.collection("articles").updateOne({ _id: new ObjectId(c._id) }, { $set: { views: c.n } });

  const subs = db.collection("subscribers");
  for (let i = 0; i < 120; i++) {
    await subs.updateOne(
      { email: `reader${i}@example.test` },
      { $setOnInsert: { email: `reader${i}@example.test`, createdAt: new Date(Date.now() - rand() * DAYS * 864e5), source: "demo" } },
      { upsert: true },
    );
  }
  console.log(`Demo analytics: ${docs.length} pageviews from ${visitors.length} synthetic visitors, 120 demo subscribers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
