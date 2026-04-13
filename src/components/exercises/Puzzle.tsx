/* components/exercises/PuzzleFlashcards.tsx */
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
import { HelpModal } from "../ui/HelpModal";
import { motion, AnimatePresence } from "framer-motion";
import { RawPuzzleCard } from "@/lib/puzzles";
import { CardStatus } from "@/lib/wordProgress";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

type Props = {
  cards: RawPuzzleCard[];
};

export default function PuzzleFlashcards({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [revealStep, setRevealStep] = useState<0 | 1 | 2 | 3>(0); // 0=keywords,1=puzzle,2=solution,3=translations
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
    // Wir senden optional den exerciseType, damit das Backend unterscheiden kann
    await fetch("/api/flashcards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: card.id,
        languageId: card.languageId,
        status: newStatus,
        exerciseType: "puzzle",
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
        setRevealStep((step) => (step < 3 ? ((step + 1) as 0 | 1 | 2 | 3) : 0));
      }
    };
    window.addEventListener("keydown", h as any);
    return () => window.removeEventListener("keydown", h as any);
  }, [showHelp, visible.length, idx, status]);

  const resetAll = async () => {
    if (!confirm("Reset progress for every puzzle?")) return;
    await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languageId: card.languageId, exerciseType: "puzzle" }),
    });
    setStatus(Object.fromEntries(cards.map((c) => [c.id, 0])));
  };

  if (!visible.length) return <p className="p-4 text-white">No puzzles.</p>;

  // small helper to show language label (modify mapping to your language ids)
  const langLabel = (id: string) => {
    const map: Record<string, string> = {
      // example mapping — replace with your real language ids or fetch them
      "67bed42569a3680a95974aa9": "EN",
      "680b9178e6c767baf3bc3803": "FR",
      "67bed42569a3680a95974aaa": "ES",
    };
    return map[id] ?? id.slice(0, 6);
  };

  return (
    <div className="p-4 text-white mt-12 flex flex-col items-center space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyTodo}
            onChange={() => setTodo(!onlyTodo)}
          />
          Only un-learnt
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
        <button onClick={() => setHelp(true)} className="text-gray-300 hover:text-white">
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
          transition={{ duration: 0.25 }}
          className="relative w-[300px] md:w-[480px] h-[260px] md:h-[340px]"
        >
          <div
            onClick={() =>
              setRevealStep((step) =>
                step < 3 ? ((step + 1) as 0 | 1 | 2 | 3) : 0
              )
            }
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              revealStep === 3 ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            {/* FRONT */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#141F24] backface-visibility-hidden flex flex-col items-center justify-center p-4 overflow-y-auto">
              {/* Step 0: keywords */}
              {revealStep === 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Keywords</h2>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {card.words.map((w, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 rounded-full border text-sm bg-[#0E1620] text-gray-200"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Step 1: puzzle text */}
              {revealStep === 1 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">Riddle</h3>
                  <p className="text-center max-w-lg italic">{card.puzzle}</p>
                </>
              )}

              {/* Step 2: solution */}
              {revealStep === 2 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Solution</h2>
                  <p className="text-center max-w-lg font-bold">{card.solution}</p>
                </>
              )}
            </div>

            {/* BACK (translations) */}
            <div
              className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#1E2A2E] backface-visibility-hidden rotate-y-180 flex flex-col items-center justify-center p-4 overflow-y-auto"
              style={{ transform: "rotateY(180deg)" }}
            >
              <h3 className="text-lg font-semibold mb-2">Translations</h3>
              <div className="space-y-3 w-full">
                {card.translations.length === 0 && (
                  <p className="text-sm text-gray-300">No translations available.</p>
                )}
                {card.translations.map((tr) => (
                  <div key={tr.language_id} className="w-full text-left">
                    <div className="text-sm text-gray-400 mb-1">{langLabel(tr.language_id)}</div>
                    <div className="text-sm">
                      <div className="italic mb-1">{tr.puzzle}</div>
                      <div className="font-medium">Solution: {tr.solution}</div>
                      <div className="mt-1 text-xs text-gray-300">
                        Keywords: {tr.words.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls (identisch zum Vocabulary UI) */}
      <div className="flex items-center space-x-4">
        <Button onClick={(e) => (e.stopPropagation(), go(-1))} className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800">
          <FiArrowLeft size={24} />
        </Button>

        <Button onClick={resetStatus} className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-red-700">
          <FiX size={24} />
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            setRevealStep((step) => (step < 3 ? ((step + 1) as 0 | 1 | 2 | 3) : 0));
          }}
          className="px-4 py-2 bg-transparent hover:bg-green-700 rounded-xl font-bold"
        >
          {revealStep === 0 && "More"}
          {revealStep === 1 && "More"}
          {revealStep === 2 && "Flip"}
          {revealStep === 3 && "Reset"}
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
          {status[card.id] > 0 && <span className="ml-1">{status[card.id]}</span>}
        </Button>

        <Button onClick={(e) => (e.stopPropagation(), go(1))} className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800">
          <FiArrowRight size={24} />
        </Button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal title="Puzzle Controls" onClose={() => setHelp(false)}>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Click or ↑ / ↓ or Space to reveal next step (keywords → puzzle → solution → translations).</li>
            <li>← / → change card.</li>
            <li>✔︎ single-click → 1, double-click → 2.</li>
            <li>✕ resets the card.</li>
            <li>"Only un-learnt" hides mastered cards.</li>
            <li>"Reset all" clears progress for this language.</li>
            <li>Esc closes this window.</li>
          </ul>
        </HelpModal>
      )}
    </div>
  );
}
