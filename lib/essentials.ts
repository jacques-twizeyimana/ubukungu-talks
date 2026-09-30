import "server-only";
import { cache } from "react";
import { collections } from "./db";
import { computeIndex, type EssentialsIndex } from "./essentials-core";
import type { IndexItemDoc } from "./types";

export { computeIndex } from "./essentials-core";
export type { BasketItem, EssentialsIndex } from "./essentials-core";

export const getIndexItems = cache(async (): Promise<IndexItemDoc[]> => {
  const { indexItems } = await collections();
  return indexItems.find({}).sort({ order: 1 }).toArray();
});

export const getEssentialsIndex = cache(async (): Promise<EssentialsIndex | null> => {
  try {
    return computeIndex(await getIndexItems());
  } catch (err) {
    console.error("[essentials] could not load index", err);
    return null;
  }
});

export const INDEX_CATEGORIES = ["All", "Food", "Energy", "Transport", "Health", "Housing"] as const;
