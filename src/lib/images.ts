// src/lib/images.ts
import { unstable_cacheLife as cacheLife } from "next/cache";
import db from "./db";

export type ImageTranslation = {
  language_id: string;
  translation: string;
};

export type ImageCard = {
  id: string;
  first_image: string;
  second_image?: string | null;
  translations: ImageTranslation[];
  category?: string | null;
};

/**
 * Ruft alle bekannten Bildkategorien aus der DB ab (für generateStaticParams).
 */
export async function getImageCategories(): Promise<string[]> {
  const docs = await (db as any).images.findMany({
    select: { category: true },
    distinct: ["category"],
    where: { category: { not: null } },
  });
  return docs.map((d: any) => d.category as string);
}

/**
 * Ruft alle Bilderkarten einer bestimmten Kategorie ab.
 */
export async function getImageCardsByCategory(category: string): Promise<ImageCard[]> {
  "use cache";
  const docs = await (db as any).images.findMany({
    where: { category },
    select: {
      id: true,
      first_image: true,
      second_image: true,
      translations: true,
      category: true,
    },
  });

  return docs.map((d: any) => ({
    id: String(d.id),
    first_image: d.first_image,
    second_image: d.second_image ?? null,
    translations: (d.translations ?? []).map((t: any) => ({
      language_id: String(t.language_id ?? ""),
      translation: t.translation ?? "",
    })),
    category: d.category ?? null,
  }));
}
