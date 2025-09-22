/* eslint-disable @typescript-eslint/no-explicit-any */
import FillInTheGap from "@/components/exercises/FillInTheBlank";

import { getRandomExercises } from "@/lib/exercises";
import { getLanguageByName } from "@/lib/languages";
import { notFound, redirect } from "next/navigation";
import { getFlashcardsPrisma, getWordPairsPrisma } from "@/lib/words";
import Translations from "@/components/exercises/Translations";
import Idioms from "@/components/exercises/Idioms";
import { cookies } from "next/headers";
import DarkFlashcards from "@/components/exercises/Vocabulary";
import { auth } from "@/lib/auth";
import { getAccentFlashcards } from "@/lib/accents";
import Accent from "@/components/exercises/Accent";
import { getProverbFlashcards } from "@/lib/proverbs";
import ProverbFlashcards from "@/components/exercises/Proverb";
import { ConjCard, getRandomConjExercises } from "@/lib/conjugations";
import ConjugationGrid from "@/components/exercises/Conjugation";
import { getPuzzleFlashcardsPrisma } from "@/lib/puzzles";
import PuzzleFlashcards from "@/components/exercises/Puzzle";


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

function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

export const dynamic = "force-dynamic";

export default async function ExercisePage({
  params,
}: {
  params: { language: string; exerciseType: string };
}) {
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

    const shuffledPairs = shuffleArray(rawWordPairs);

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

        const shuffledTranslationsForDisplay = shuffleArray([
          ...translationsInExercise,
        ]);

        exercises.push({
          id: `ex_${languageData.id}_${i}_${Date.now()}`,
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
