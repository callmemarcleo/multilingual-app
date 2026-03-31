import db from "./db";

export interface Joke {
  id: string;
  language_id: string;
  text: string;
  source?: string;
  keywords: string[];
}

export async function getJokesForLanguage(langName: string): Promise<Joke[]> {
  "use cache";
  const lang = await db.languages.findFirst({
    where: { name: langName },
  });
  if (!lang) {
    return [];
  }

  const rows = await db.jokes.findMany({
    where: { language_id: lang.id },
    select: {
      id: true,
      language_id: true,
      joke: true,
      source: true,
      keywords: true,
    },
    orderBy: { date_entry: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    language_id: r.language_id,
    text: r.joke,
    source: r.source ?? undefined,
    keywords: r.keywords ?? [],
  }));
}
