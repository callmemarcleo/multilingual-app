"use client";

import ExerciseCard from "./ExerciseCard";

type Exercise = {
  name: string;
  description: string;
  href: string;
};

const exercisesByLanguage: Record<string, Exercise[]> = {
  german: [
    {
      name: "Vocabulary",
      description: "Learn new words to expand your vocabulary.",
      href: "/german/exercises/vocabulary",
    },
    {
      name: "Fill in the Blank",
      description: "Complete sentences by filling in the missing words.",
      href: "/german/exercises/fill-in-the-blank",
    },
    {
      name: "Idioms",
      description: "Choose the correct answer from multiple options.",
      href: "/german/exercises/idioms",
    },
    {
      name: "Translations",
      description: "Match the words to its translation.",
      href: "/german/exercises/translations",
    },
  ],
  english: [
    {
      name: "Vocabulary",
      description: "Learn new words to expand your vocabulary.",
      href: "/english/exercises/vocabulary",
    },
    {
      name: "Translations",
      description: "Match the words to its translation.",
      href: "/english/exercises/translations",
    },
  ],
  spanish: [
    {
      name: "Vocabulary",
      description: "Learn new words to expand your vocabulary.",
      href: "/spanish/exercises/vocabulary",
    },
    {
      name: "Accents",
      description: "Learn Accents to expand your knowledge of spanish.",
      href: "/spanish/exercises/accents",
    },
    {
      name: "Idioms",
      description: "Match expressions with their meanings.",
      href: "/spanish/exercises/idioms",
    },
    {
      name: "Translations",
      description: "Match the words to its translation.",
      href: "/spanish/exercises/translations",
    },
    {
      name: "Conjugation",
      description: "Try to conjugate spanish verbs.",
      href: "/spanish/exercises/conjugation",
    },
        {
      name: "Puzzle",
      description: "Learn new words to expand your vocabulary.",
      href: "/spanish/exercises/puzzle",
    },
  ],
  italian: [
    {
      name: "Vocabulary",
      description: "Learn new words to expand your vocabulary.",
      href: "/italian/exercises/vocabulary",
    },
    {
      name: "Translations",
      description: "Match the words to its translation.",
      href: "/italian/exercises/translations",
    },
    {
      name: "Proverbs",
      description: "Learn Proverbs to expand your knowledge of italian.",
      href: "/italian/exercises/proverbs",
    },
    {
      name: "Conjugation",
      description: "Try to conjugate italian verbs.",
      href: "/italian/exercises/conjugation",
    },
  ],
  french: [
    {
      name: "Idioms",
      description: "Match expressions with their meanings.",
      href: "/french/exercises/idioms",
    },
  ],
};

export default function LanguagePageContent({
  language,
}: {
  language: string;
}) {
  const exercises = exercisesByLanguage[language];

  if (!exercises) {
    return <div className="text-red-500">Language not found!</div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-12">
          Welcome to the {language.charAt(0).toUpperCase() + language.slice(1)}{" "}
          learning section
        </h1>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-12 text-center pb-2 border-b-2 border-[#6A6A6A]">
          You can choose between one of the following exercises
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.name}
              name={exercise.name}
              description={exercise.description}
              href={exercise.href}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
