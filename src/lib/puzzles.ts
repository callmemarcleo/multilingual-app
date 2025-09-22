// lib/puzzles.ts
import db from "./db";
import { CardStatus, getProgressMap } from "./wordProgress";


type RawPuzzleTranslation = {
  language_id: string;
  words: string[];
  puzzle: string;
  solution: string;
};

export type RawPuzzleCard = {
  id: string;
  languageId: string;
  words: string[]; // Stichwörter
  puzzle: string;
  solution: string;
  category?: string | null;
  translations: RawPuzzleTranslation[]; // alle Übersetzungen
  status: CardStatus;
};

export async function getPuzzleFlashcardsPrisma(
  targetLanguageId: string,
  userLocaleId: string, // wird ggf. gebraucht falls du nur bestimmte Übersetzungen brauchst
  userId: string
): Promise<RawPuzzleCard[]> {
  const progress = await getProgressMap(userId, targetLanguageId);

  const docs = await db.puzzles.findMany({
    where: {
      language_id: targetLanguageId,
    },
    select: {
      id: true,
      language_id: true,
      words: true,
      puzzle: true,
      solution: true,
      category: true,
      translations: true,
    },
  });

  const cards: RawPuzzleCard[] = [];

  for (const d of docs) {
    // defensive normalization: translations kann undefined sein
    const translationsRaw = (d.translations ?? []) as any[];

    const translations: RawPuzzleTranslation[] = translationsRaw.map((t) => ({
      language_id: String(t.language_id ?? t.languageId ?? t.lang ?? ""),
      words: Array.isArray(t.words) ? t.words : [],
      puzzle: t.puzzle ?? t.puzzle_text ?? "",
      solution: t.solution ?? t.solucion ?? "",
    }));

    cards.push({
      id: d.id,
      languageId: d.language_id,
      words: Array.isArray(d.words) ? d.words : [],
      puzzle: d.puzzle ?? "",
      solution: d.solution ?? (d as any).solucion ?? "",
      category: d.category ?? null,
      translations,
      status: progress[d.id] ?? 0,
    });
  }

  return cards;
}
