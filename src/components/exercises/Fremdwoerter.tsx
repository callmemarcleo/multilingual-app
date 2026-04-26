/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { FiArrowLeft, FiArrowRight, FiInfo } from "react-icons/fi";
import { Button } from "../ui/button";
import { HelpModal } from "../ui/HelpModal";
import { motion, AnimatePresence } from "framer-motion";
import { FremdwoerterCard } from "@/lib/fremdwoerter";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

type Props = { cards: FremdwoerterCard[] };

function pickRandom(len: number) {
  return len > 0 ? Math.floor(Math.random() * len) : 0;
}

export default function Fremdwoerter({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [dir, setDir] = useState(0);
  const [showHelp, setHelp] = useState(false);
  const [frontExIdx, setFrontExIdx] = useState(() =>
    pickRandom(cards[0]?.examples.length ?? 0)
  );

  const card = cards[idx];
  const frontExample = card.examples[frontExIdx] ?? null;
  const backExamples = card.examples.filter((_, i) => i !== frontExIdx);

  const go = (d: -1 | 1) => {
    const newIdx = (idx + d + cards.length) % cards.length;
    setRevealed(false);
    setDir(d);
    setIdx(newIdx);
    setFrontExIdx(pickRandom(cards[newIdx].examples.length));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showHelp && e.key === "Escape") { setHelp(false); return; }
      if (e.key === "ArrowLeft")  go(-1);
      if (e.key === "ArrowRight") go(1);
      if (["ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key)) {
        setRevealed((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey as any);
    return () => window.removeEventListener("keydown", onKey as any);
  }, [showHelp, idx, cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cards.length) {
    return <p className="p-4 text-white">Keine Karten gefunden.</p>;
  }

  return (
    <div className="p-4 text-white mt-8 flex flex-col items-center space-y-4">
      {/* Counter + help */}
      <div className="flex items-center gap-3 text-sm text-gray-400">
        Wort {idx + 1}/{cards.length}
        <button
          onClick={() => setHelp(true)}
          className="text-gray-300 hover:text-white"
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
          className="relative w-[340px] md:w-[500px] h-[300px] md:h-[360px]"
        >
          <div
            onClick={() => setRevealed((r) => !r)}
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              revealed ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            {/* ── Front ── */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#141F24] backface-visibility-hidden flex flex-col items-center justify-center gap-4 p-6">
              <h2 className="text-3xl font-bold text-center">{card.wort}</h2>
              {frontExample && (
                <p className="text-sm italic text-gray-300 text-center leading-relaxed">
                  „{frontExample}"
                </p>
              )}
            </div>

            {/* ── Back ── */}
            <div
              className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#1E2A2E] backface-visibility-hidden rotate-y-180 flex flex-col justify-center gap-3 p-6 overflow-y-auto"
              style={{ transform: "rotateY(180deg)" }}
            >
              <p className="text-xl font-semibold text-center">{card.bedeutung}</p>

              {backExamples.length > 0 && (
                <div className="mt-2 space-y-2 border-t border-[#6A6A6A] pt-3">
                  {backExamples.map((ex, i) => (
                    <p key={i} className="text-sm italic text-gray-300 leading-relaxed">
                      „{ex}"
                    </p>
                  ))}
                </div>
              )}

              {card.quelle && (
                <p className="text-xs text-gray-500 mt-auto pt-2 border-t border-[#6A6A6A] text-right">
                  Quelle: {card.quelle}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => go(-1)}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowLeft size={24} />
        </Button>

        <Button
          onClick={() => setRevealed((r) => !r)}
          className="px-4 py-2 bg-transparent hover:bg-green-700 rounded-xl font-bold"
        >
          {revealed ? "Verbergen" : "Bedeutung anzeigen"}
        </Button>

        <Button
          onClick={() => go(1)}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowRight size={24} />
        </Button>
      </div>

      {showHelp && (
        <HelpModal title="Fremdwörter" onClose={() => setHelp(false)}>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Karte anklicken oder ↑/↓ / Leertaste um die Bedeutung aufzudecken.</li>
            <li>← / → um zwischen Karten zu wechseln.</li>
            <li>Esc zum Schliessen des Hilfsfensters.</li>
          </ul>
        </HelpModal>
      )}
    </div>
  );
}