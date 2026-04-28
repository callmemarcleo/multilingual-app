import db from "./db";

export type ProverbCard = {
  id: string;
  languageId: string;
  proverb: string;
  frontText: string;
  translation: string;
  keywords: string[];
};

function resolveTranslation(
  t: { en?: string | null; fr?: string | null; de?: string | null; es?: string | null },
  langName: string
): string {
  switch (langName) {
    case "French":
      return (t.fr ?? t.en ?? t.de ?? t.es)!;
    case "German":
      return (t.de ?? t.en ?? t.fr ?? t.es)!;
    case "Spanish":
      return (t.es ?? t.en ?? t.fr ?? t.de)!;
    default: // "English" und alle anderen
      return (t.en ?? t.fr ?? t.de ?? t.es)!;
  }
}

export async function getProverbFlashcards(
  langName: string,
  uiLang: string
): Promise<ProverbCard[]> {
  const lang = await db.languages.findFirst({ where: { name: langName } });
  if (!lang) return [];

  const raws = await db.proverbs.findMany({
    where: {
      language_id: lang.id,
      OR: [
        { translations: { is: { en: { not: null } } } },
        { translations: { is: { fr: { not: null } } } },
        { translations: { is: { de: { not: null } } } },
        { translations: { is: { es: { not: null } } } },
      ],
    },
    select: {
      id: true,
      definition: true,
      proverb: true,
      keywords: true,
      translations: { select: { en: true, fr: true, de: true, es: true } },
    },
  });

  return raws.map((p) => ({
    id: p.id,
    languageId: lang.id,
    proverb: p.proverb,
    frontText: p.definition,
    translation: resolveTranslation(p.translations, uiLang),
    keywords: p.keywords,
  }));
}