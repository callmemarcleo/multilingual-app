/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, MouseEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import {
  FiArrowLeft,
  FiArrowRight,
  FiX,
  FiCheck,
  FiInfo,
  FiRefreshCcw,
} from "react-icons/fi";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { RawFlashcard } from "@/lib/words";
import { CardStatus } from "@/lib/wordProgress";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

type Props = {
  cards: RawFlashcard[];
};


export default function DarkFlashcards({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [revealStep, setRevealStep] = useState<0 | 1 | 2>(0);  // 0 = word + example, 1 = definition, 2 = translation
  const [dir, setDir] = useState(0);
  const [showHelp, setHelp] = useState(false);
  const [onlyTodo, setTodo] = useState(false);

  const [status, setStatus] = useState<Record<string, CardStatus>>(
    Object.fromEntries(cards.map((c) => [c.id, c.status]))
  );

  const visible = onlyTodo ? cards.filter((c) => status[c.id] < 2) : cards;

  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(visible.length - 1, 0)));
  }, [visible.length]);

  const card = visible[idx];

  const go = (d: -1 | 1) => {
    setRevealStep(0);
    setDir(d);
    setIdx((p) => (p + d + visible.length) % visible.length);
  };

  const setLocalAndServer = async (newStatus: CardStatus) => {
    setStatus((s) => ({ ...s, [card.id]: newStatus }));
    await fetch("/api/flashcards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: card.id,
        languageId: card.languageId,
        status: newStatus,
      }),
    });
  };

  const stepStatus = (e: MouseEvent) => {
    e.stopPropagation();
    const current = status[card.id] ?? 0;
    let next: CardStatus;
    if (current === 0) next = 1;
    else if (current === 1) next = 2;
    else next = 1;
    setLocalAndServer(next);
  };

  const masterCard = (e: MouseEvent) => {
    e.stopPropagation();
    setLocalAndServer(2);
  };

  const resetStatus = (e: MouseEvent) => {
    e.stopPropagation();
    setLocalAndServer(0);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showHelp && e.key === "Escape") return setHelp(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
        setRevealStep((step) => (step < 2 ? ((step + 1) as 0 | 1 | 2) : 0));
      }
    };
    window.addEventListener("keydown", h as any);
    return () => window.removeEventListener("keydown", h as any);
  }, [showHelp, visible.length, idx, status]);

  const resetAll = async () => {
    if (!confirm("Reset progress for every word?")) return;
    await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languageId: card.languageId }),
    });
    setStatus(Object.fromEntries(cards.map((c) => [c.id, 0])));
  };

  if (!visible.length) return <p className="p-4 text-white">No flashcards.</p>;

  return (
    <div className="p-4 text-white mt-12 flex flex-col items-center space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyTodo}
            onChange={() => setTodo(!onlyTodo)}
          />
          Only un‑learnt
        </label>

        <button
          onClick={resetAll}
          className="flex items-center gap-1 text-gray-300 hover:text-red-500"
        >
          <FiRefreshCcw /> Reset all
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-400">
        Card {idx + 1}/{visible.length}
        <button
          onClick={() => setHelp(true)}
          className="text-gray-300 hover:text-white"
        >
          <FiInfo size={18} />
        </button>
      </div>

      <AnimatePresence custom={dir} mode="popLayout">
        <motion.div
          key={card.id}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="relative w-[94vw] max-w-[680px] h-[380px] md:h-[460px] lg:h-[520px]"
        >
          <div
            onClick={() =>
              setRevealStep((step) =>
                step < 2 ? ((step + 1) as 0 | 1 | 2) : 0
              )
            }
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              revealStep === 2 ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            <div className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#141F24] backface-visibility-hidden flex flex-col items-center justify-center p-6">
              <h2 className="text-4xl font-bold mb-7 text-center">{card.word}</h2>
              {/* Beispiele */}
              {card.examples && card.examples.length > 0 && revealStep === 0 && (
                <div className="space-y-6 text-sm text-gray-300 text-center">
                  {card.examples.map((ex, i) => (
                    <p key={i} className="italic text-base">
                      {ex}
                    </p>
                    ))}
                  </div>
              )}

              {/* Definition */}
              {revealStep >= 1 && (
                <div className="mt-4">
                  <p className="font-bold text-gray-400 text-center text-lg">Definition</p>
                  <p className="mt-2 italic text-center text-gray-300 text-lg">
                    {card.frontText}
                  </p>
                </div>
              )}
            </div>

            <div
              className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#1E2A2E] backface-visibility-hidden rotate-y-180 flex items-center justify-center p-4"
              style={{ transform: "rotateY(180deg)" }}
            >
              <div className="w-full max-w-md">
                {card.translations?.length ? (
                  <div className="flex flex-col gap-8">
                    {card.translations.map((t, idx) => (
                      <div key={`${t.languageId}-${idx}`} className="flex justify-between gap-4">
                        <span className="text-xl text-gray-300 whitespace-nowrap">
                          {t.languageName}:
                        </span>
                        <span className="text-xl font-semibold text-right break-words whitespace-pre-wrap">
                          {t.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xl text-gray-400 text-center">
                    Keine Übersetzungen vorhanden.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center space-x-4">
        <Button
          onClick={(e) => (e.stopPropagation(), go(-1))}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowLeft size={24} />
        </Button>

        <Button
          onClick={resetStatus}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-red-700"
        >
          <FiX size={24} />
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            setRevealStep((step) => (step < 2 ? ((step + 1) as 0 | 1 | 2) : 0));
          }}
          className="px-4 py-2 bg-transparent hover:bg-green-700 rounded-xl font-bold"
        >
          {revealStep === 0 && "More"}
          {revealStep === 1 && "Flip"}
          {revealStep === 2 && "Reset"}
        </Button>

        <Button
          onClick={stepStatus}
          onDoubleClick={masterCard}
          className={clsx(
            "px-4 py-2 bg-[#141F24] rounded-xl",
            status[card.id] === 2 && "text-white hover:bg-green-700",
            status[card.id] === 1 && "text-white hover:bg-yellow-400"
          )}
        >
          <FiCheck size={24} />
          {status[card.id] > 0 && (
            <span className="ml-1">{status[card.id]}</span>
          )}
        </Button>

        <Button
          onClick={(e) => (e.stopPropagation(), go(1))}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowRight size={24} />
        </Button>
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setHelp(false)}
        >
          <div
            className="w-[90%] max-w-md bg-[#141F24] border border-[#444] rounded-xl p-6 space-y-4 text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FiInfo /> Flashcard Controls
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Click or ↑ / ↓ to reveal steps.</li>
              <li>← / → to change card.</li>
              <li>✔︎ single‑click → 1, double‑click → 2.</li>
              <li>✕ resets the card.</li>
              <li>“Only un‑learnt” hides mastered cards.</li>
              <li>“Reset all” clears progress for this language.</li>
              <li>Esc closes this window.</li>
            </ul>
            <div className="text-right">
              <Button onClick={() => setHelp(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}