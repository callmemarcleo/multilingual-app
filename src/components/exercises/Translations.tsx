"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar, { ExerciseProgress } from "../ProgressBar";
import { Button } from "../ui/button";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { GoXCircleFill } from "react-icons/go";

type Exercise = {
  id: string;
  words: string[];
  translations: string[];
  correctPairs: Record<string, string>;
};

type TranslationsProps = {
  exercises: Exercise[];
  learningLanguage: string;
};

export default function Translations({
  exercises,
  learningLanguage,
}: TranslationsProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [wrongPairs, setWrongPairs] = useState<string[][]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [exerciseStatuses, setExerciseStatuses] = useState<ExerciseProgress[]>(
    exercises.map((ex) => ({ id: ex.id, status: "default" as const }))
  );

  useEffect(() => {
    setExerciseStatuses(
      exercises.map((ex) => ({ id: ex.id, status: "default" as const }))
    );
  }, [exercises]);

  const currentExercise = exercises[activeIndex];
  if (!currentExercise) return <div>Keine Übungen gefunden.</div>;

  const handleCancel = () => {
    router.push(`/${learningLanguage.toLowerCase()}`);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const isMatched = (word: string) => matchedPairs[word] !== undefined;
  const isWrong   = (word: string) => wrongPairs.some((pair) => pair.includes(word));
  const isSelected = (word: string) => selected.includes(word);

  // ── Auto-complete: fires after every correct match ─────────────────────────

  const checkCompletion = (
    newMatchedPairs: Record<string, string>,
    currentWrongPairs: string[][]
  ) => {
    const allWords = [...currentExercise.words, ...currentExercise.translations];
    const wrongWords = new Set(currentWrongPairs.flat());

    // Done when every word is either matched (green) or wrong (red) — none neutral
    const allDone = allWords.every(
      (w) => newMatchedPairs[w] !== undefined || wrongWords.has(w)
    );
    if (!allDone) return;

    const correct = currentWrongPairs.length === 0;
    setIsCorrect(correct);
    setExerciseStatuses((prev) =>
      prev.map((s, i) =>
        i === activeIndex ? { ...s, status: correct ? "right" : "wrong" } : s
      )
    );
  };

  // ── Selection handler ──────────────────────────────────────────────────────

  const handleSelect = (item: string) => {
    if (isMatched(item) || isWrong(item) || selected.includes(item)) return;

    const updated = [...selected, item];
    setSelected(updated);

    if (updated.length === 2) {
      const [first, second] = updated;
      const isMatch =
        currentExercise.correctPairs[first] === second ||
        currentExercise.correctPairs[second] === first;

      if (isMatch) {
        const newMatchedPairs = {
          ...matchedPairs,
          [first]: second,
          [second]: first,
        };
        setMatchedPairs(newMatchedPairs);
        // Pass current wrongPairs (not stale) into the check
        checkCompletion(newMatchedPairs, wrongPairs);
      } else {
        const newWrongPairs = [...wrongPairs, [first, second]];
        setWrongPairs(newWrongPairs);
        // Wrong pair permanently locked — check if remaining correct pairs
        // are all already matched (edge case: last action was a wrong pick)
        checkCompletion(matchedPairs, newWrongPairs);
      }

      setTimeout(() => setSelected([]), 500);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (activeIndex < exercises.length - 1) {
      setActiveIndex((i) => i + 1);
      setMatchedPairs({});
      setWrongPairs([]);
      setSelected([]);
      setIsCorrect(null);
    } else {
      alert("Alle Fragen abgeschlossen!");
      router.push(`/${learningLanguage.toLowerCase()}`);
    }
  };

  const handleRepeat = () => {
    setMatchedPairs({});
    setWrongPairs([]);
    setSelected([]);
    setIsCorrect(null);
  };

  // ── Button styling ─────────────────────────────────────────────────────────

  const btnClass = (word: string) => {
    if (isMatched(word))  return "bg-green-500 border-green-500 cursor-default";
    if (isWrong(word))    return "bg-red-500/40 border-red-500 text-red-300 cursor-not-allowed";
    if (isSelected(word)) return "border-[#31639C] bg-gray-800";
    return "border-[#6A6A6A] bg-[#141F24]";
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 text-white flex flex-col">
      <div className="flex justify-center">
        <ProgressBar
          exercises={exerciseStatuses}
          activeIndex={activeIndex}
          onCancel={handleCancel}
        />
      </div>

      <h2 className="text-2xl font-bold mt-16">Finde die richtigen Paare</h2>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left column — words */}
        <div className="flex flex-col gap-4">
          {currentExercise.words.map((word, index) => (
            <Button
              key={word + index}
              onClick={() => handleSelect(word)}
              disabled={isMatched(word) || isWrong(word)}
              className={`w-full py-6 rounded-xl text-white text-lg font-semibold border-2 transition-all hover:bg-gray-800 ${btnClass(word)}`}
            >
              {word}
            </Button>
          ))}
        </div>

        {/* Right column — translations */}
        <div className="flex flex-col gap-4">
          {currentExercise.translations.map((translation, index) => (
            <Button
              key={translation + index}
              onClick={() => handleSelect(translation)}
              disabled={isMatched(translation) || isWrong(translation)}
              className={`w-full py-6 rounded-xl text-white text-lg font-semibold border-2 transition-all hover:bg-gray-800 ${btnClass(translation)}`}
            >
              {translation}
            </Button>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 p-8 flex items-center justify-between">
        {/* Feedback */}
        {isCorrect !== null && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <IoIosCheckmarkCircle className="text-green-500" size={24} />
                <p className="text-green-500 font-bold">Richtig!</p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <GoXCircleFill className="text-red-500" size={24} />
                <p className="text-red-500 font-bold">Falsch!</p>
              </div>
            )}
          </div>
        )}

        {/* Buttons — only visible after completion */}
        {isCorrect !== null && (
          <div className="flex gap-3">
            <Button
              onClick={handleRepeat}
              className="bg-transparent border-2 border-white hover:bg-gray-800 text-white px-4 py-2 rounded-md"
            >
              Wiederholen
            </Button>
            <Button
              onClick={handleNext}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Nächste Frage →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}