// lib/images.ts
import db from "./db";

export type ImageTranslation = {
  language_id: string;
  translation: string;
};

export type RawImageCard = {
  id: string;
  image: string;
  category?: string | null;
  translations: ImageTranslation[];
};

export async function getImageFlashcards(): Promise<RawImageCard[]> {
  const docs = await db.images.findMany({
    select: {
      id: true,
      first_image: true,
      category: true,
      translations: true,
    },
  });

  return docs.map((d) => ({
    id: d.id,
    image: d.first_image,
    category: d.category ?? null,
    translations: (d.translations ?? []) as ImageTranslation[],
  }));
}
