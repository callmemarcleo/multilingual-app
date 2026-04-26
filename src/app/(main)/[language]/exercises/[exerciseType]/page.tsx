/* eslint-disable @typescript-eslint/no-explicit-any */
import dynamic from "next/dynamic";
import { shuffle } from "@/lib/utils";
import { getRandomExercises } from "@/lib/exercises";
import { getLanguageByName } from "@/lib/languages";
import { notFound, redirect } from "next/navigation";
import { getFlashcardsPrisma, getWordPairsPrisma } from "@/lib/words";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getAccentFlashcards } from "@/lib/accents";
import { getProverbFlashcards } from "@/lib/proverbs";
import { ConjCard, getRandomConjExercises } from "@/lib/conjugations";
import { getPuzzleFlashcardsPrisma } from "@/lib/puzzles";
import { getFremdwoerterCards } from "@/lib/fremdwoerter";
import { connection } from "next/server";

function ExerciseSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-white/10 rounded w-1/3" />
      <div className="h-48 bg-white/10 rounded" />
      <div className="h-10 bg-white/10 rounded w-1/2" />
    </div>
  );
}

// Dynamic imports — nur der aktive Übungstyp wird in den Client-Bundle geladen
const FillInTheGap = dynamic(
  () => import("@/components/exercises/FillInTheBlank"),
  { loading: () => <ExerciseSkeleton /> }
);
const Translations = dynamic(
  () => import("@/components/exercises/Translations"),
  { loading: () => <ExerciseSkeleton /> }
);
const Idioms = dynamic(
  () => import("@/components/exercises/Idioms"),
  { loading: () => <ExerciseSkeleton /> }
);
const DarkFlashcards = dynamic(
  () => import("@/components/exercises/Vocabulary"),
  { loading: () => <ExerciseSkeleton /> }
);
const Accent = dynamic(
  () => import("@/components/exercises/Accent"),
  { loading: () => <ExerciseSkeleton /> }
);
const ProverbFlashcards = dynamic(
  () => import("@/components/exercises/Proverb"),
  { loading: () => <ExerciseSkeleton /> }
);
const ConjugationGrid = dynamic(
  () => import("@/components/exercises/Conjugation"),
  { loading: () => <ExerciseSkeleton /> }
);
const PuzzleFlashcards = dynamic(
  () => import("@/components/exercises/Puzzle"),
  { loading: () => <ExerciseSkeleton /> }
);
const FremdwoerterCards = dynamic(
  () => import("@/components/exercises/Fremdwoerter"),
  { loading: () => <ExerciseSkeleton /> }
);


const LOCALE_MAP: Record<string, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  it: "Italian",
};

type Exercise = {
  id: string;
  words: string[];
  translations: string[];
  correctPairs: Record<string, string>;
};

type RawWordPair = {
  id: string;
  word: string;
  translation: string;
};


export default async function ExercisePage({
  params,
}: {
  params: Promise<{ language: string; exerciseType: string }>;
}) {
  // connection() ersetzt dynamic = "force-dynamic" mit Cache Components
  await connection();
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }
  const { language, exerciseType } = await params;
  const cookieStore = cookies();
  const userLocale = (await cookieStore).get("locale")?.value || "en";

  const formattedLanguage =
    language.charAt(0).toUpperCase() + language.slice(1);
  const formattedExerciseType = exerciseType.toLowerCase().replace(/-/g, "");

  const languageData = await getLanguageByName(formattedLanguage);
  if (!languageData) {
    console.error("Invalid Language:", formattedLanguage);
    return notFound();
  }

  const userLocaleName = LOCALE_MAP[userLocale] ?? "English";

  const userLocaleData = await getLanguageByName(userLocaleName);
  if (!userLocaleData) {
    console.error("Invalid user locale:", userLocaleName);
    return (
      <div className="p-4 text-red-500">
        Error: User language setting not found.
      </div>
    );
  }

  if (languageData.name === LOCALE_MAP[userLocale]) {
    console.warn(
      "User chose the same language as their locale:",
      languageData.name
    );
    return (
      <div className="p-4 text-yellow-500 text-xl">
        You are already using {languageData.name} as your app local language! If
        you want to learn {languageData.name} change your local Language besides
        the Multilingual-Titel in the Navigation-Bar to another language.
      </div>
    );
  }

  if (formattedExerciseType === "conjugation") {
    console.log("Language", languageData);
    const cards: ConjCard[] = await getRandomConjExercises(languageData.id);

    return <ConjugationGrid cards={cards} language={languageData.name} />;
  }

  if (formattedExerciseType === "accents") {
    const cards = await getAccentFlashcards(languageData.name);

    return <Accent cards={cards} />;
  }

  if (formattedExerciseType === "proverbs") {
    const cards = await getProverbFlashcards(languageData.name);

    return <ProverbFlashcards cards={cards} />;
  }

  if (formattedExerciseType === "vocabulary") {
    const flashcards = await getFlashcardsPrisma(
      languageData.id,
      userLocaleData.id,
      session.user?.id || ""
    );

    return <DarkFlashcards cards={flashcards} />;
  }

  if (formattedExerciseType === "fremdwoerter") {
    const cards = await getFremdwoerterCards();
    return <FremdwoerterCards cards={cards} />;
  }

  if (formattedExerciseType === "puzzle") {
  const cards = await getPuzzleFlashcardsPrisma(
    languageData.id,
    userLocaleData.id,
    session.user?.id || ""
  );

  return <PuzzleFlashcards cards={cards} />;
  }
 

  if (formattedExerciseType === "translations") {
    const totalPairsToFetch = 50;
    const rawWordPairs: RawWordPair[] = await getWordPairsPrisma(
      languageData.id,
      userLocaleData.id,
      totalPairsToFetch
    );

    if (!rawWordPairs || rawWordPairs.length === 0) {
      return (
        <div className="p-4 text-red-500">
          No translation pairs found in the database!
        </div>
      );
    }

    const shuffledPairs = shuffle(rawWordPairs);

    const exercises: Exercise[] = [];
    const pairsPerExercise = 5;
    const numberOfExercises = Math.floor(
      shuffledPairs.length / pairsPerExercise
    );

    if (numberOfExercises === 0) {
      return (
        <div className="p-4 text-orange-500">
          Not enough pairs ({shuffledPairs.length}) found to create a full
          exercise (need {pairsPerExercise}).
        </div>
      );
    }

    for (let i = 0; i < numberOfExercises; i++) {
      const chunk = shuffledPairs.slice(
        i * pairsPerExercise,
        (i + 1) * pairsPerExercise
      );

      if (chunk.length === pairsPerExercise) {
        const wordsInExercise = chunk.map((p) => p.word);
        const translationsInExercise = chunk.map((p) => p.translation);

        const correctPairsMap: Record<string, string> = {};
        chunk.forEach((p) => {
          correctPairsMap[p.word] = p.translation;
          correctPairsMap[p.translation] = p.word;
        });

        const shuffledTranslationsForDisplay = shuffle([
          ...translationsInExercise,
        ]);

        exercises.push({
          id: `ex_${languageData.id}_${i}`,
          words: wordsInExercise,
          translations: shuffledTranslationsForDisplay,
          correctPairs: correctPairsMap,
        });
      }
    }

    return (
      <Translations
        exercises={exercises}
        learningLanguage={languageData.name}
      />
    );
  }

  const exercises = await getRandomExercises(
    languageData.id,
    formattedExerciseType
  );
  if (!exercises || exercises.length === 0) {
    return <div className="text-red-500">No exercises found!</div>;
  }

  return (
    <>
      {formattedExerciseType === "fillintheblank" && (
        <FillInTheGap
          exercises={exercises}
          learningLanguage={languageData.name}
        />
      )}
      {formattedExerciseType === "idioms" && (
        <Idioms exercises={exercises} learningLanguage={languageData.name} />
      )}
      {!["fillintheblank", "idioms", "translations"].includes(
        formattedExerciseType
      ) && <div className="text-red-500">Invalid exercise type!</div>}
    </>
  );
}
