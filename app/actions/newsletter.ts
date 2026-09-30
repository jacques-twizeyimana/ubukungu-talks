"use server";

import { z } from "zod";
import { collections } from "@/lib/db";

export type NewsletterState = { ok: boolean; message: string } | null;

const schema = z.object({ email: z.email().max(200), source: z.string().max(40).default("site") });

export async function subscribe(_prev: NewsletterState, form: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: form.get("email"), source: form.get("source") ?? "site" });
  if (!parsed.success) return { ok: false, message: "That email doesn't look right." };
  const { subscribers } = await collections();
  await subscribers.updateOne(
    { email: parsed.data.email.toLowerCase() },
    { $setOnInsert: { email: parsed.data.email.toLowerCase(), createdAt: new Date(), source: parsed.data.source } },
    { upsert: true },
  );
  return { ok: true, message: "You're in. The Friday brief lands this week." };
}
