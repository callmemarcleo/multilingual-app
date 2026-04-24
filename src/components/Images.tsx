// src/components/Images.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { FiArrowLeft, FiArrowRight, FiInfo } from "react-icons/fi";
import { Button } from "./ui/button";
import { HelpModal } from "./ui/HelpModal";
import Image from "next/image";
import { ImageCard, QuizQuestion as QuizQuestionType } from "@/lib/images";

// ---------------------------------------------------------------------------
// Animation variants (card slide)
// ---------------------------------------------------------------------------
const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

// ---------------------------------------------------------------------------
// QuizQuestion – inline component (not exported)
// ---------------------------------------------------------------------------
type QuizQuestionProps = QuizQuestionType & {
  selectedAnswer: number | null;
  onAnswer: (index: number) => void;
  onNext: () => void;
  isLast: boolean;
};

function QuizQuestion({
  question,
  options,
  correctIndex,
  selectedAnswer,
  onAnswer,
  onNext,
  isLast,
}: QuizQuestionProps) {
  const hasAnswered = selectedAnswer !== null;

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm font-medium text-gray-100 leading-snug">{question}</p>

      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isSelected = i === selectedAnswer;

          const cls = clsx(
            "text-xs px-2 py-2.5 rounded border text-left transition-colors leading-snug",
            !hasAnswered &&
              "border-[#6A6A6A] text-gray-200 hover:border-gray-300 hover:bg-[#2a3a40] cursor-pointer",
            hasAnswered && isCorrect &&
              "border-green-500 bg-green-900/30 text-green-300",
            hasAnswered && !isCorrect && isSelected &&
              "border-red-500 bg-red-900/30 text-red-300",
            hasAnswered && !isCorrect && !isSelected &&
              "border-[#6A6A6A] text-gray-500 opacity-40 cursor-not-allowed"
          );

          return (
            <button
              key={i}
              disabled={hasAnswered}
              onClick={(e) => {
                e.stopPropagation();
                onAnswer(i);
              }}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="self-end text-sm border border-[#6A6A6A] hover:border-white rounded px-3 py-1.5 text-gray-200 hover:text-white transition-colors"
        >
          {isLast ? "Auswertung →" : "Weiter →"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------------------
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={clsx(
            "w-2 h-2 rounded-full transition-colors",
            i < current ? "bg-white" : "bg-gray-600"
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type Props = {
  cards: ImageCard[];
};

export default function Images({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dir, setDir] = useState(0);
  const [showHelp, setHelp] = useState(false);

  // Quiz state
  // quizStep: 0 = Übersetzungen, 1–3 = Fragen, 4 = Auswertung
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});

  const resetQuiz = () => {
    setQuizStep(0);
    setAnswers({});
  };

  const go = (d: -1 | 1) => {
    setFlipped(false);
    setDir(d);
    setIdx((p) => (p + d + cards.length) % cards.length);
    resetQuiz();
  };

  // Flip to back → always start at translations (step 0)
  const handleFlip = () => {
    if (!flipped) resetQuiz();
    setFlipped((f) => !f);
  };

  const card = cards[idx];

  const quizQuestions = card.quiz
    ? [card.quiz.typeQuestion, card.quiz.origin, card.quiz.season, card.quiz.vitamins]
    : [];

  const correctCount = quizQuestions.filter(
    (q, i) => answers[i + 1] === q.correctIndex
  ).length;

  // Language-ID → Label mapping
  const langLabel = (id: string) => {
    const map: Record<string, string> = {
      "67bed42569a3680a95974aa9": "EN",
      "67bed42569a3680a95974aaa": "ES",
      "67bed42569a3680a95974aab": "IT",
      "67bed4528f87b8e3161ad51b": "DE",
      "680b9178e6c767baf3bc3803": "FR",
    };
    return map[id] ?? id.slice(0, 6);
  };

  const recordAnswer = (step: number, index: number) => {
    setAnswers((prev) => ({ ...prev, [step]: index }));
  };

  return (
    <div className="p-4 text-white mt-12 flex flex-col items-center space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-gray-400">
          Image {idx + 1}/{cards.length}
        </span>
        <button
          onClick={() => setHelp(true)}
          className="flex items-center gap-1 text-gray-300 hover:text-white"
        >
          <FiInfo size={18} />
        </button>
      </div>

      {/* Card */}
      <AnimatePresence custom={dir} mode="popLayout">
        <motion.div
          key={card.id}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="relative w-[500px] md:w-[500px] h-[500px] md:h-[580px]"
        >
          <div
            onClick={handleFlip}
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              flipped ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            {/* ── FRONT ── */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#141F24] backface-visibility-hidden flex flex-col items-center justify-center gap-2 p-2 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <Image
                  src={card.first_image}
                  alt="Vegetable"
                  width={400}
                  height={200}
                  className="object-contain rounded-lg"
                />
              </div>
              {card.second_image && (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <Image
                    src={card.second_image}
                    alt="Vegetable second view"
                    width={400}
                    height={200}
                    className="object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* ── BACK ── */}
            {/* stopPropagation prevents clicks inside from triggering the flip */}
            <div
              className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#1E2A2E] backface-visibility-hidden rotate-y-180 flex flex-col p-5 overflow-y-auto"
              style={{ transform: "rotateY(180deg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ─ Step 0: Translations ─ */}
              {quizStep === 0 && (
                <div className="flex flex-col items-center flex-1 gap-3">
                  <h3 className="text-lg font-semibold">Translations</h3>
                  <div className="space-y-2 text-center flex-1">
                    {card.translations.map((tr) => (
                      <div key={tr.language_id} className="text-sm">
                        <span className="font-semibold text-gray-300">
                          {langLabel(tr.language_id)}:
                        </span>{" "}
                        {tr.translation}
                      </div>
                    ))}
                  </div>
                  {/* Only show quiz button if quiz data exists */}
                  {card.quiz && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuizStep(1);
                      }}
                      className="mt-2 text-sm border border-[#6A6A6A] hover:border-white rounded px-4 py-2 text-gray-200 hover:text-white transition-colors"
                    >
                      Zu den Fragen →
                    </button>
                  )}
                </div>
              )}

              {/* ─ Steps 1–N: Quiz questions ─ */}
              {quizStep >= 1 && quizStep <= quizQuestions.length && card.quiz && (
                <div className="flex flex-col gap-4 flex-1">
                  {/* Progress header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Frage {quizStep} von {quizQuestions.length}
                    </span>
                    <ProgressDots current={quizStep} total={quizQuestions.length} />
                  </div>

                  <QuizQuestion
                    {...quizQuestions[quizStep - 1]}
                    selectedAnswer={answers[quizStep] ?? null}
                    onAnswer={(i) => recordAnswer(quizStep, i)}
                    onNext={() => setQuizStep((s) => s + 1)}
                    isLast={quizStep === quizQuestions.length}
                  />
                </div>
              )}

              {/* ─ Summary ─ */}
              {quizStep === quizQuestions.length + 1 && card.quiz && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6">
                  {/* Score */}
                  <div className="text-center">
                    <p className="text-5xl font-bold">
                      {correctCount}
                      <span className="text-3xl text-gray-400">/{quizQuestions.length}</span>
                    </p>
                    <p className="text-gray-300 mt-2 text-sm">
                      {correctCount === quizQuestions.length
                        ? "Perfekt! Alle richtig!"
                        : correctCount >= quizQuestions.length / 2
                        ? "Gut gemacht!"
                        : correctCount === 1
                        ? "Weiter üben!"
                        : "Nächstes Mal schaffst du es!"}
                    </p>
                  </div>

                  {/* Per-question recap */}
                  <div className="w-full space-y-1.5">
                    {quizQuestions.map((q, i) => {
                      const isRight = answers[i + 1] === q.correctIndex;
                      return (
                        <div
                          key={i}
                          className={clsx(
                            "text-xs px-3 py-2 rounded border flex flex-col gap-0.5",
                            isRight
                              ? "border-green-700 bg-green-900/20 text-green-300"
                              : "border-red-700 bg-red-900/20 text-red-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span>{isRight ? "✓" : "✗"}</span>
                            <span>{q.question}</span>
                          </div>
                          <span className="pl-4 text-gray-400">
                            Lösung: {q.options[q.correctIndex]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      go(1);
                    }}
                    className="text-sm border border-[#6A6A6A] hover:border-white rounded px-4 py-2 text-gray-200 hover:text-white transition-colors"
                  >
                    Nächste Karte →
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Button onClick={() => go(-1)} className="bg-[#141F24] hover:bg-gray-800">
          <FiArrowLeft size={24} />
        </Button>

        <Button
          onClick={handleFlip}
          className="bg-transparent hover:bg-green-700 font-bold px-4 py-2"
        >
          {flipped ? "Back" : "Flip"}
        </Button>

        <Button onClick={() => go(1)} className="bg-[#141F24] hover:bg-gray-800">
          <FiArrowRight size={24} />
        </Button>
      </div>

      {/* Help modal */}
      {showHelp && (
        <HelpModal title="Image Controls" onClose={() => setHelp(false)}>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Karte anklicken oder Flip-Button drücken, um zu wenden.</li>
            <li>← / → um zwischen Bildern zu wechseln.</li>
            <li>
              Auf der Rückseite: Übersetzungen ansehen, dann Quiz starten.
            </li>
          </ul>
        </HelpModal>
      )}
    </div>
  );
}