"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExerciseProgress } from "@/components/ProgressBar";

export function useExerciseCheck<T extends { id: string }>(
  exercises: T[],
  learningLanguage: string,
  getCorrectAnswer: (exercise: T) => string
) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealedCorrect, setRevealedCorrect] = useState("");
  const [exerciseStatuses, setExerciseStatuses] = useState<ExerciseProgress[]>(
    exercises.map((ex) => ({ id: ex.id, status: "default" as const }))
  );

  useEffect(() => {
    setExerciseStatuses(
      exercises.map((ex) => ({ id: ex.id, status: "default" as const }))
    );
  }, [exercises]);

  const handleCancel = () => {
    router.push(`/${learningLanguage.toLowerCase()}`);
  };

  const submitAnswer = (userAnswer: string, onReset: () => void) => {
    if (hasChecked) {
      if (activeIndex < exercises.length - 1) {
        setActiveIndex((i) => i + 1);
        setIsCorrect(null);
        setHasChecked(false);
        setRevealedCorrect("");
        onReset();
      } else {
        alert("Alle Fragen abgeschlossen!");
        router.push(`/${learningLanguage.toLowerCase()}`);
      }
      return;
    }

    const currentEx = exercises[activeIndex];
    if (!currentEx) return;

    const correct = getCorrectAnswer(currentEx).toLowerCase().trim();
    setRevealedCorrect(correct);
    const isRight = userAnswer.toLowerCase().trim() === correct;

    setExerciseStatuses((prev) =>
      prev.map((item, i) =>
        i === activeIndex ? { ...item, status: isRight ? "right" : "wrong" } : item
      )
    );
    setIsCorrect(isRight);
    setHasChecked(true);
  };

  return {
    activeIndex,
    hasChecked,
    isCorrect,
    revealedCorrect,
    exerciseStatuses,
    currentExercise: exercises[activeIndex],
    submitAnswer,
    handleCancel,
  };
}