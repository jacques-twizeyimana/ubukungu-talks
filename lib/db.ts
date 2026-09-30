import "server-only";
import { GridFSBucket, MongoClient, type Db } from "mongodb";
import type {
  ArticleDoc,
  IndexItemDoc,
  PageviewDoc,
  SubscriberDoc,
  UserDoc,
} from "./types";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "ubukungu";

// Reuse one client across hot reloads in dev and across requests in prod.
const globalForMongo = globalThis as unknown as {
  _mongo?: Promise<MongoClient>;
  _indexesReady?: Promise<void>;
};

function client(): Promise<MongoClient> {
  if (!globalForMongo._mongo) {
    globalForMongo._mongo = new MongoClient(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    })
      .connect()
      .catch((err) => {
        globalForMongo._mongo = undefined;
        throw err;
      });
  }
  return globalForMongo._mongo;
}

export async function getDb(): Promise<Db> {
  const db = (await client()).db(dbName);
  globalForMongo._indexesReady ??= ensureIndexes(db).catch((err) => {
    globalForMongo._indexesReady = undefined;
    throw err;
  });
  await globalForMongo._indexesReady;
  return db;
}

export async function collections() {
  const db = await getDb();
  return {
    articles: db.collection<ArticleDoc>("articles"),
    indexItems: db.collection<IndexItemDoc>("indexItems"),
    pageviews: db.collection<PageviewDoc>("pageviews"),
    subscribers: db.collection<SubscriberDoc>("subscribers"),
    users: db.collection<UserDoc>("users"),
    media: new GridFSBucket(db, { bucketName: "media" }),
  };
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("articles").createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { status: 1, publishedAt: -1 } },
      { key: { section: 1, status: 1, publishedAt: -1 } },
    ]),
    db.collection("pageviews").createIndexes([
      { key: { t: -1 } },
      { key: { articleId: 1, t: -1 } },
      { key: { vid: 1, t: 1 } },
      // Raw analytics are kept for 13 months, then expire automatically.
      { key: { t: 1 }, name: "ttl_t", expireAfterSeconds: 60 * 60 * 24 * 400 },
    ]),
    db.collection("subscribers").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("indexItems").createIndex({ order: 1 }),
  ]);
}
