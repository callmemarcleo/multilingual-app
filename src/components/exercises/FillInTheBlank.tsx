"use client";

import React, { useState, useEffect } from "react";
import ProgressBar from "../ProgressBar";
import { Button } from "../ui/button";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { GoXCircleFill } from "react-icons/go";
import { useExerciseCheck } from "@/hooks/useExerciseCheck";

type Exercise = {
  id: string;
  question: string;
  correct_answer: string;
};

type FillInTheBlankProps = {
  exercises: Exercise[];
  learningLanguage: string;
};

type FieldStatus = "idle" | "correct" | "wrong";

// ---------------------------------------------------------------------------
// Greedy blank-to-answer matcher
//
// The DB can have more blanks than answer parts when a single correct answer
// spans multiple blanks + static text in between, e.g.:
//   question:        "Tag ___ ein___ Handvoll"
//   correct_answer:  "für eine"   ← ONE answer for TWO blanks
//   segments:        ["Tag ", " ein", " Handvoll"]
//   answers entered: ["für", "e"]
//   candidate:       "für" + " ein" + "e"  =  "für eine"  ✓
//
// The algorithm walks left-to-right through blanks (i) and answers (j).
// For each answer it tries the current blank alone, then extends by appending
// the next segment's text + the next blank until the candidate matches or
// there are no more blanks to extend with.
// ---------------------------------------------------------------------------
type MatchResult = {
  statuses: FieldStatus[];
  /** Normalised value to pass to the hook so its isCorrect flag is accurate */
  submissionValue: string;
};

function matchBlanksToAnswers(
  segments: string[],   // question.split(/_+/)
  answers: string[],    // user inputs, one per blank
  correctAnswers: string[] // correct_answer.split(/[,;]/).map(trim)
): MatchResult {
  const statuses: FieldStatus[] = Array(answers.length).fill(
    "wrong" as FieldStatus
  );
  const submissionParts: string[] = [];

  let i = 0; // blank index
  let j = 0; // answer index

  while (i < answers.length && j < correctAnswers.length) {
    const expected = correctAnswers[j].trim().toLowerCase();
    let candidate = answers[i].trim().toLowerCase();
    let endIdx = i;

    // Extend: candidate += segments[endIdx+1] + answers[endIdx+1]
    // segments[k] is the static text that appears BEFORE blank k, so
    // segments[endIdx+1] is the text sitting between blank[endIdx] and
    // blank[endIdx+1] — exactly what we need as "glue".
    while (candidate !== expected && endIdx + 1 < answers.length) {
      endIdx++;
      candidate = (
        candidate + segments[endIdx] + answers[endIdx].trim()
      ).toLowerCase();
    }

    if (candidate === expected) {
      // All blanks from i to endIdx are part of this correct answer.
      for (let k = i; k <= endIdx; k++) statuses[k] = "correct";
      submissionParts.push(candidate);
      i = endIdx + 1;
    } else {
      // Could not match — mark blank i wrong, skip to next answer.
      statuses[i] = "wrong";
      submissionParts.push(answers[i].trim().toLowerCase());
      i++;
    }
    j++;
  }

  // Any remaining blanks (no corresponding answer) stay "wrong".
  while (i < answers.length) {
    submissionParts.push(answers[i].trim().toLowerCase());
    i++;
  }

  return { statuses, submissionValue: submissionParts.join(",") };
}

// Normalise correct_answer so the hook comparison works regardless of
// whitespace or separator style ("," vs ";").
function normaliseAnswer(answer: string): string {
  return answer
    .split(/[,;]/)
    .map((a) => a.trim().toLowerCase())
    .join(",");
}

export default function FillInTheBlank({
  exercises,
  learningLanguage,
}: FillInTheBlankProps) {
  const [answers, setAnswers] = useState<string[]>([]);
  const [fieldStatuses, setFieldStatuses] = useState<FieldStatus[]>([]);

  const {
    activeIndex,
    hasChecked,
    isCorrect,
    exerciseStatuses,
    currentExercise,
    submitAnswer,
    handleCancel,
  } = useExerciseCheck(
    exercises,
    learningLanguage,
    (ex) => normaliseAnswer(ex.correct_answer)
  );

  // Reset inline inputs whenever the active question changes.
  useEffect(() => {
    if (!currentExercise) return;
    const blankCount = currentExercise.question.split(/_+/).length - 1;
    setAnswers(Array(blankCount).fill(""));
    setFieldStatuses(Array(blankCount).fill("idle"));
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentExercise) {
    return <div>Keine Übungen gefunden.</div>;
  }

  // Split on one-or-more underscores so "___" counts as a single blank.
  const segments = currentExercise.question.split(/_+/);
  const blankCount = segments.length - 1;

  // Support both "," and ";" as answer separators.
  const correctAnswers = currentExercise.correct_answer
    .split(/[,;]/)
    .map((a) => a.trim());

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const resetState = () => {
    const count = currentExercise.question.split(/_+/).length - 1;
    setAnswers(Array(count).fill(""));
    setFieldStatuses(Array(count).fill("idle"));
  };

  const handleCheck = () => {
    if (hasChecked) {
      // Second click → advance to next question.
      submitAnswer("", resetState);
      return;
    }

    // First click → validate with the greedy matcher.
    const { statuses, submissionValue } = matchBlanksToAnswers(
      segments,
      answers,
      correctAnswers
    );
    setFieldStatuses(statuses);

    // Pass the reconstructed submission value so the hook's isCorrect and
    // the progress-bar dot colour are accurate.
    submitAnswer(submissionValue, resetState);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheck();
    }
  };

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

      <h2 className="text-2xl font-bold mt-16">Fülle die Lücken!</h2>

      {/* Inline question: alternate text segments and input fields */}
      <p className="mt-16 leading-loose text-base">
        {segments.map((segment, i) => (
          <React.Fragment key={i}>
            <span>{segment}</span>

            {i < blankCount && (
              <span className="inline-flex items-center gap-1 mx-0.5">
                <input
                  value={answers[i] ?? ""}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={hasChecked}
                  aria-label={`Lücke ${i + 1}`}
                  className={[
                    "w-28 border-b-2 bg-transparent px-1 py-0.5 text-center",
                    "focus:outline-none transition-colors",
                    fieldStatuses[i] === "correct"
                      ? "border-green-500 text-green-400"
                      : fieldStatuses[i] === "wrong"
                      ? "border-red-500 text-red-400"
                      : "border-[#6A6A6A] focus:border-blue-500",
                  ].join(" ")}
                />
                {fieldStatuses[i] === "correct" && (
                  <IoIosCheckmarkCircle
                    className="text-green-500 shrink-0"
                    size={16}
                  />
                )}
                {fieldStatuses[i] === "wrong" && (
                  <GoXCircleFill
                    className="text-red-500 shrink-0"
                    size={16}
                  />
                )}
              </span>
            )}
          </React.Fragment>
        ))}
      </p>

      {/* Show each correct answer when at least one blank is wrong */}
      {hasChecked && !isCorrect && (
        <p className="mt-4 text-sm">
          <span className="text-gray-400">Korrekte Antworten: </span>
          {correctAnswers.map((ans, i) => (
            <React.Fragment key={i}>
              <span className="text-red-300 font-semibold">{ans}</span>
              {i < correctAnswers.length - 1 && (
                <span className="text-gray-500">, </span>
              )}
            </React.Fragment>
          ))}
        </p>
      )}

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
              <div className="flex items-center gap-2">
                <GoXCircleFill className="text-red-500" size={24} />
                <p className="text-red-500 font-bold">Falsch!</p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleCheck}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
