// src/lib/images.ts
import { cacheLife } from "next/cache";
import db from "./db";

export type ImageTranslation = {
  language_id: string;
  translation: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type ImageQuiz = {
  /** One of these two will be present depending on category */
  vegetableType?: QuizQuestion;
  fruitType?: QuizQuestion;
  origin: QuizQuestion;
  season: QuizQuestion;
  vitamins: QuizQuestion;
  /** Resolved at parse time — always the vegetableType or fruitType question */
  typeQuestion: QuizQuestion;
};

export type ImageCard = {
  id: string;
  first_image: string;
  second_image?: string | null;
  translations: ImageTranslation[];
  category?: string | null;
  /** Quiz-Daten sind optional – alte Karten ohne quiz-Feld funktionieren weiterhin. */
  quiz?: ImageQuiz;
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
 * Quiz-Daten werden mitgeladen, falls vorhanden.
 */
export async function getImageCardsByCategory(category: string): Promise<ImageCard[]> {
  "use cache";
  cacheLife("minutes");

  const docs = await (db as any).images.findMany({
    where: { category },
    select: {
      id: true,
      first_image: true,
      second_image: true,
      translations: true,
      category: true,
      quiz: true,
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
    quiz: parseQuiz(d.quiz),
  }));
}

/** Wandelt den rohen DB-Wert in einen typisierten ImageQuiz um (oder undefined). */
function parseQuiz(raw: any): ImageQuiz | undefined {
  if (!raw) return undefined;

  const parseQ = (q: any): QuizQuestion | undefined => {
    if (!q || typeof q.question !== "string" || !Array.isArray(q.options)) {
      return undefined;
    }
    return {
      question: q.question,
      options: q.options as string[],
      correctIndex: Number(q.correctIndex ?? 0),
    };
  };

  const vegetableType = parseQ(raw.vegetableType);
  const fruitType = parseQ(raw.fruitType);
  const origin = parseQ(raw.origin);
  const season = parseQ(raw.season);
  const vitamins = parseQ(raw.vitamins);

  const typeQuestion = vegetableType ?? fruitType;
  if (!typeQuestion || !origin || !season || !vitamins) return undefined;

  return {
    ...(vegetableType ? { vegetableType } : { fruitType }),
    origin,
    season,
    vitamins,
    typeQuestion,
  };
}