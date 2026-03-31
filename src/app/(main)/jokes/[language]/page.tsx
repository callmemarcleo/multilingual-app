import JokesCarousel from "@/components/JokesCarousel";
import { getJokesForLanguage, Joke } from "@/lib/jokes";

export function generateStaticParams() {
  return [
    { language: "german" },
    { language: "english" },
    { language: "spanish" },
    { language: "italian" },
    { language: "french" },
  ];
}

export default async function JokesByLanguagePage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  const pretty = language.charAt(0).toUpperCase() + language.slice(1);

  const jokes: Joke[] = await getJokesForLanguage(pretty);
  if (!jokes.length) {
    return <p className="p-4 text-red-500">No jokes found for {pretty}.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">{pretty} Jokes</h1>
      <JokesCarousel jokes={jokes} />
    </div>
  );
}
