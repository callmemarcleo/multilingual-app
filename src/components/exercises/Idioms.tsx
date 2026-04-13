"use client";

import { useState } from "react";
import ProgressBar from "../ProgressBar";
import { Button } from "../ui/button";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { GoXCircleFill } from "react-icons/go";
import { useExerciseCheck } from "@/hooks/useExerciseCheck";

type Exercise = {
  id: string;
  question: string;
  correct_answer: string;
  options: string[];
};

type IdiomProps = {
  exercises: Exercise[];
  learningLanguage: string;
};

export default function Idioms({ exercises, learningLanguage }: IdiomProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const {
    activeIndex,
    hasChecked,
    isCorrect,
    revealedCorrect,
    exerciseStatuses,
    currentExercise,
    submitAnswer,
    handleCancel,
  } = useExerciseCheck(exercises, learningLanguage, (ex) => ex.correct_answer);

  const handleCheck = () => {
    if (!selectedAnswer && !hasChecked) return;
    submitAnswer(selectedAnswer ?? "", () => setSelectedAnswer(null));
  };

  if (!currentExercise) {
    return <div>Keine Übungen gefunden.</div>;
  }

  const buttonLabel = hasChecked ? "Nächste Frage" : "Überprüfen";

  return (
    <div className="p-4 text-white flex flex-col">
      <div className="flex justify-center">
        <ProgressBar
          exercises={exerciseStatuses}
          activeIndex={activeIndex}
          onCancel={handleCancel}
        />
      </div>

      <h2 className="text-2xl font-bold mt-16">{currentExercise.question}</h2>

      <div className="mt-6 flex flex-col gap-4">
        {currentExercise.options.map((option, index) => (
          <Button
            key={option}
            onClick={() => setSelectedAnswer(option)}
            className={`w-full p-4 border rounded-md text-left
                        ${
                          selectedAnswer === option
                            ? "border-blue-500 bg-blue-900 text-white"
                            : "border-gray-600 bg-gray-800"
                        }
                        hover:border-blue-400 transition-all`}
          >
            {index + 1}. {option}
          </Button>
        ))}
      </div>

      <div
        className={`mt-12 p-8 flex items-center ${
          hasChecked ? "justify-between" : "justify-end"
        }`}
      >
        {hasChecked && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <IoIosCheckmarkCircle className="text-green-500" size={24} />
                <p className="text-green-500 font-bold">Richtig!</p>
              </>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <GoXCircleFill className="text-red-500" size={24} />
                  <p className="text-red-500 font-bold">Falsch!</p>
                </div>
                <p className="text-red-400 font-semibold">
                  Korrekte Antwort: {revealedCorrect}
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleCheck}
          disabled={!selectedAnswer && !hasChecked}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}