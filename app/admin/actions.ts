"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { collections } from "@/lib/db";
import { createSession, destroySession, requireEditor } from "@/lib/auth";
import { htmlToText, sanitizeArticleHtml } from "@/lib/sanitize";
import { countWords, readingMinutes } from "@/lib/format";
import { ALL_SECTIONS, sectionSlug, slugify } from "@/lib/site";
import type { ArticleDoc, ArticleStatus } from "@/lib/types";

// ---- Auth ------------------------------------------------------------------

export type LoginState = { error: string } | null;

let dummyHash: string | undefined;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");
  const { users } = await collections();
  const user = await users.findOne({ email });
  // Compare against a dummy hash when the user is unknown so timing doesn't reveal which emails exist.
  dummyHash ??= await bcrypt.hash("not-a-real-password", 12);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !ok) return { error: "Email or password is incorrect." };
  await createSession({ email: user.email, name: user.name, role: user.role });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---- Stories ---------------------------------------------------------------

export async function createDraft() {
  const session = await requireEditor();
  const { articles } = await collections();
  const now = new Date();
  const _id = new ObjectId();
  await articles.insertOne({
    _id,
    slug: `draft-${_id.toHexString()}`,
    title: "",
    dek: "",
    bodyHtml: "",
    bodyText: "",
    section: "Cost of living",
    author: session.name || "Ubukungu Talks",
    status: "draft",
    leadImage: null,
    embedIndex: false,
    featured: false,
    wordCount: 0,
    readingMinutes: 1,
    views: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  });
  redirect(`/admin/stories/${_id.toHexString()}`);
}

const leadImageSchema = z
  .object({
    url: z.string().regex(/^\/api\/media\/[a-f0-9]{24}$/),
    alt: z.string().max(300),
    caption: z.string().max(400).optional(),
    credit: z.string().max(120).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .nullable();

const saveSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/),
  title: z.string().max(300),
  dek: z.string().max(600),
  bodyHtml: z.string().max(500_000),
  section: z.enum(ALL_SECTIONS.map((s) => s.name) as [string, ...string[]]),
  author: z.string().min(1).max(120),
  slug: z.string().max(100),
  leadImage: leadImageSchema,
  embedIndex: z.boolean(),
  featured: z.boolean(),
  intent: z.enum(["save", "review", "publish", "unpublish"]),
});

export type SaveInput = z.infer<typeof saveSchema>;
export type SaveResult =
  | { ok: true; status: ArticleStatus; slug: string; savedAt: string; publishedAt: string | null }
  | { ok: false; error: string };

async function uniqueSlug(base: string, id: ObjectId): Promise<string> {
  const { articles } = await collections();
  let slug = base || `story-${id.toHexString().slice(-6)}`;
  for (let n = 2; await articles.findOne({ slug, _id: { $ne: id } }, { projection: { _id: 1 } }); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function saveArticle(input: SaveInput): Promise<SaveResult> {
  await requireEditor();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid story" };
  const d = parsed.data;
  const _id = new ObjectId(d.id);

  const { articles } = await collections();
  const existing = await articles.findOne({ _id });
  if (!existing) return { ok: false, error: "Story not found" };

  const bodyHtml = sanitizeArticleHtml(d.bodyHtml);
  const bodyText = htmlToText(bodyHtml);
  const wordCount = countWords(bodyText);

  let status: ArticleStatus = existing.status;
  if (d.intent === "review") status = "review";
  if (d.intent === "publish") status = "published";
  if (d.intent === "unpublish") status = "draft";

  if (status === "published") {
    if (!d.title.trim()) return { ok: false, error: "A headline is required before publishing." };
    if (wordCount < 20) return { ok: false, error: "The story body is too short to publish." };
    if (d.leadImage && !d.leadImage.alt.trim()) return { ok: false, error: "Add alt text to the lead image." };
  }

  // Slug: editor's choice, otherwise derived from the headline. Kept stable once published.
  const requested = slugify(d.slug);
  let slug = existing.slug;
  if (requested && requested !== existing.slug) slug = await uniqueSlug(requested, _id);
  else if (existing.slug.startsWith("draft-") && d.title.trim()) slug = await uniqueSlug(slugify(d.title), _id);

  const now = new Date();
  const update: Partial<ArticleDoc> = {
    title: d.title.trim(),
    dek: d.dek.trim(),
    bodyHtml,
    bodyText,
    section: d.section,
    author: d.author.trim(),
    slug,
    leadImage: d.leadImage,
    embedIndex: d.embedIndex,
    featured: d.featured,
    wordCount,
    readingMinutes: readingMinutes(wordCount),
    status,
    updatedAt: now,
    publishedAt: status === "published" ? (existing.publishedAt ?? now) : existing.publishedAt,
  };
  await articles.updateOne({ _id }, { $set: update });

  // Only one featured lead at a time.
  if (d.featured && status === "published") {
    await articles.updateMany({ _id: { $ne: _id }, featured: true }, { $set: { featured: false } });
  }

  // On-demand ISR: refresh every cached page this story appears on, if it was or is public.
  if (status === "published" || existing.status === "published") {
    revalidatePath(`/articles/${slug}`);
    if (existing.slug !== slug) revalidatePath(`/articles/${existing.slug}`);
    revalidatePath("/");
    revalidatePath(`/section/${sectionSlug(d.section)}`);
    if (existing.section !== d.section) revalidatePath(`/section/${sectionSlug(existing.section)}`);
    revalidatePath("/essentials-index");
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
  }
  revalidatePath("/admin", "layout");

  return {
    ok: true,
    status,
    slug,
    savedAt: now.toISOString(),
    publishedAt: update.publishedAt ? update.publishedAt.toISOString() : null,
  };
}

export async function deleteArticle(id: string) {
  await requireEditor();
  if (!ObjectId.isValid(id)) return;
  const { articles } = await collections();
  const doc = await articles.findOneAndDelete({ _id: new ObjectId(id) });
  if (doc?.status === "published") {
    revalidatePath(`/articles/${doc.slug}`);
    revalidatePath("/");
    revalidatePath(`/section/${sectionSlug(doc.section)}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
  }
  redirect("/admin/stories");
}

// ---- Essentials Index ------------------------------------------------------

const pricesSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  prices: z.record(z.string(), z.number().positive().max(10_000_000)),
});

export async function savePrices(input: z.infer<typeof pricesSchema>, publish: boolean) {
  await requireEditor();
  const { month, prices } = pricesSchema.parse(input);
  const { indexItems } = await collections();
  await Promise.all(
    Object.entries(prices).map(([id, price]) =>
      indexItems.updateOne({ _id: id, "history.month": month }, { $set: { "history.$.price": Math.round(price) } }),
    ),
  );
  if (publish) {
    // The index headline sits in the masthead of every page, so refresh the whole site.
    revalidatePath("/", "layout");
  }
  revalidatePath("/admin", "layout");
  return { ok: true as const, savedAt: new Date().toISOString() };
}

export async function startNewMonth() {
  await requireEditor();
  const { indexItems } = await collections();
  const items = await indexItems.find({}).toArray();
  for (const item of items) {
    const last = item.history[item.history.length - 1];
    const [y, m] = last.month.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    if (item.history.some((h) => h.month === next)) continue;
    await indexItems.updateOne({ _id: item._id }, { $push: { history: { month: next, price: last.price } } });
  }
  revalidatePath("/admin", "layout");
}
