// src/components/Images.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { FiArrowLeft, FiArrowRight, FiInfo, FiRefreshCcw } from "react-icons/fi";
import { Button } from "./ui/button";
import { HelpModal } from "./ui/HelpModal";
import Image from "next/image";
import { ImageCard } from "@/lib/images";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

type Props = {
  cards: ImageCard[];
};

export default function Images({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dir, setDir] = useState(0);
  const [showHelp, setHelp] = useState(false);

  const go = (d: -1 | 1) => {
    setFlipped(false);
    setDir(d);
    setIdx((p) => (p + d + cards.length) % cards.length);
  };

  const card = cards[idx];

  // Mapping der Sprache-IDs → Labels
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

      {/* Karte */}
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
            onClick={() => setFlipped(!flipped)}
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              flipped ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            {/* FRONT */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#141F24] backface-visibility-hidden flex flex-col items-center justify-center gap-2 p-2 overflow-hidden">

              {/* Erstes Bild */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <Image
                  src={card.first_image}
                  alt="Vegetable"
                  width={400}
                  height={200}
                  className="object-contain rounded-lg"
                />
              </div>

              {/* Zweites Bild (falls vorhanden) */}
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


            {/* BACK */}
            <div
              className="absolute inset-0 rounded-xl border-2 border-[#6A6A6A] bg-[#1E2A2E] backface-visibility-hidden rotate-y-180 flex flex-col items-center justify-center p-4 overflow-y-auto"
              style={{ transform: "rotateY(180deg)" }}
            >
              <h3 className="text-lg font-semibold mb-3">Translations</h3>
              <div className="space-y-2 text-center">
                {card.translations.map((tr) => (
                  <div key={tr.language_id} className="text-sm">
                    <span className="font-semibold text-gray-300">
                      {langLabel(tr.language_id)}:
                    </span>{" "}
                    {tr.translation}
                  </div>
                ))}
              </div>
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
          onClick={() => setFlipped(!flipped)}
          className="bg-transparent hover:bg-green-700 font-bold px-4 py-2"
        >
          {flipped ? "Back" : "Flip"}
        </Button>

        <Button onClick={() => go(1)} className="bg-[#141F24] hover:bg-gray-800">
          <FiArrowRight size={24} />
        </Button>
      </div>

      {/* Help */}
      {showHelp && (
        <HelpModal title="Image Controls" onClose={() => setHelp(false)}>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Click to flip card (image ↔ translations).</li>
            <li>← / → to change image.</li>
          </ul>
        </HelpModal>
      )}
    </div>
  );
}
