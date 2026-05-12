/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import clsx from "clsx";
import { FiArrowLeft, FiArrowRight, FiInfo } from "react-icons/fi";
import { Button } from "../ui/button";
import { HelpModal } from "../ui/HelpModal";
import { motion, AnimatePresence } from "framer-motion";
import { AccentCard } from "@/lib/accents";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

type Props = {
  cards: AccentCard[];
};

export default function Accent({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [revealStep, setRevealStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState(0);
  const [showHelp, setHelp] = useState(false);

  const go = (d: -1 | 1) => {
    setRevealStep(0);
    setDir(d);
    setIdx((i) => (i + d + cards.length) % cards.length);
  };

  const advance = (card: AccentCard) => {
    setRevealStep((step) => {
      if (step === 1 && !card.example) return 3;
      return step < 3 ? ((step + 1) as 0 | 1 | 2 | 3) : 0;
    });
  };

  useEffect(() => {
    const card = cards[idx];
    const onKey = (e: KeyboardEvent) => {
      if (showHelp && e.key === "Escape") return setHelp(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (["ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key)) {
        advance(card);
      }
    };
    window.addEventListener("keydown", onKey as any);
    return () => window.removeEventListener("keydown", onKey as any);
  }, [showHelp, cards.length, idx]);

  if (!cards.length) {
    return <p className="p-4 text-white">No accent cards.</p>;
  }

  const card = cards[idx];

  const buttonLabel =
    revealStep === 0 ? "Show Rule" :
    revealStep === 1 ? (card.example ? "Show Example" : "Show Accent") :
    revealStep === 2 ? "Show Accent" :
    "Reset";

  return (
    <div className="p-4 text-white mt-8 flex flex-col items-center space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-400">
        Card {idx + 1}/{cards.length}
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
          className="relative w-[300px] md:w-[400px] h-[240px] md:h-[300px]"
        >
          <div
            onClick={() => advance(card)}
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              revealStep === 3 ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            {/* Front Side */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#141F24] backface-visibility-hidden flex flex-col items-center justify-center p-4 gap-3">
              <h2 className="text-2xl font-bold">{card.word}</h2>
              {revealStep >= 1 && (
                <div className="text-center space-y-3">
                  {card.type && (
                    <div>
                      <p className="text-gray-400 text-sm">Type:</p>
                      <p className="text-gray-200">{card.type}</p>
                    </div>
                  )}
                  {card.rule && (
                    <div>
                      <p className="text-gray-400 text-sm">Rule:</p>
                      <p className="text-gray-200">{card.rule}</p>
                    </div>
                  )}
                </div>
              )}
              {revealStep >= 2 && card.example && (
                <p className="text-sm text-center max-w-xs text-blue-300">
                  {card.example}
                </p>
              )}
            </div>

            {/* Back Side */}
            <div
              className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#1E2A2E] backface-visibility-hidden rotate-y-180 flex items-center justify-center p-4"
              style={{ transform: "rotateY(180deg)" }}
            >
              <p className="text-xl font-semibold text-center">
                {card.translation}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center space-x-4">
        <Button
          onClick={() => go(-1)}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowLeft size={24} />
        </Button>

        <Button
          onClick={() => advance(card)}
          className="px-4 py-2 bg-transparent hover:bg-green-700 rounded-xl font-bold"
        >
          {buttonLabel}
        </Button>

        <Button
          onClick={() => go(1)}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowRight size={24} />
        </Button>
      </div>

      {showHelp && (
        <HelpModal title="How to navigate" onClose={() => setHelp(false)}>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Click or ↑/↓ or Space/Enter to reveal steps.</li>
            <li>←/→ to change card.</li>
            <li>Esc or outside click to close.</li>
          </ul>
        </HelpModal>
      )}
    </div>
  );
}