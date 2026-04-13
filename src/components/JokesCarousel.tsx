/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { FiArrowLeft, FiArrowRight, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Joke } from "@/lib/jokes";
import { Button } from "./ui/button";
import { HelpModal } from "./ui/HelpModal";
import clsx from "clsx";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

type Props = { jokes: (Joke & { keywords?: string[] })[] };

export default function JokesCarousel({ jokes }: Props) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(0);
  const [flipped, setFlip] = useState(false);
  const [showHelp, setHelp] = useState(false);

  const go = (d: -1 | 1) => {
    setFlip(false);
    setDir(d);
    setIdx((i) => (i + d + jokes.length) % jokes.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showHelp && e.key === "Escape") return setHelp(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (["ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key))
        setFlip((f) => !f);
    };
    window.addEventListener("keydown", onKey as any);
    return () => window.removeEventListener("keydown", onKey as any);
  }, [showHelp, idx]);

  if (!jokes.length) {
    return <p className="p-4 text-center text-red-400">No jokes found.</p>;
  }

  const joke = jokes[idx];

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-gray-400 text-sm flex items-center gap-2">
        Joke {idx + 1}/{jokes.length}
        <button onClick={() => setHelp(true)} className="hover:text-white">
          <FiInfo size={18} />
        </button>
      </div>

      <AnimatePresence custom={dir} mode="popLayout">
        <motion.div
          key={idx}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35 }}
          className="w-full max-w-2xl h-[350px] md:h-[450px] flex items-center justify-center"
        >
          <div
            onClick={() => setFlip((f) => !f)}
            className={clsx(
              "w-full h-full perspective-1000 preserve-3d transition-transform duration-500 cursor-pointer",
              flipped ? "rotate-y-180" : "rotate-y-0"
            )}
          >
            <div className="absolute inset-0 bg-[#1E2A2E] border border-[#6A6A6A] rounded-2xl shadow p-8 backface-visibility-hidden flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-gray-200 text-center">
                Keywords
              </h3>
              <ul className="list-disc list-inside text-gray-100 space-y-2 overflow-auto flex-1">
                {joke.keywords?.length ? (
                  joke.keywords.map((kw, i) => <li key={i}>{kw}</li>)
                ) : (
                  <li>
                    <em>No keywords</em>
                  </li>
                )}
              </ul>
            </div>
            <div
              className="absolute inset-0 bg-[#141F24] border border-[#6A6A6A] rounded-2xl shadow p-8 backface-visibility-hidden rotate-y-180 flex flex-col"
              style={{ transform: "rotateY(180deg)" }}
            >
              <div className="flex-1 overflow-auto">
                <p className="whitespace-pre-wrap text-gray-100 text-center leading-relaxed">
                  {joke.text}
                </p>
              </div>
              {joke.source && (
                <div className="mt-4 text-right">
                  <span className="text-sm text-gray-500">— {joke.source}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => go(-1)}
          className="bg-[#141F24] hover:bg-gray-800 rounded-xl p-3"
        >
          <FiArrowLeft size={20} />
        </Button>
        <Button
          onClick={() => setFlip((f) => !f)}
          className="px-4 py-2 bg-transparent hover:bg-green-700 rounded-xl font-bold"
        >
          Flip
        </Button>
        <Button
          onClick={() => go(1)}
          className="bg-[#141F24] hover:bg-gray-800 rounded-xl p-3"
        >
          <FiArrowRight size={20} />
        </Button>
      </div>
      {showHelp && (
        <HelpModal title="How to navigate" onClose={() => setHelp(false)}>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Click ‘Flip’ (or Space/Enter) to show the joke.</li>
            <li>Use ← / → (or buttons) to switch jokes.</li>
            <li>Esc or outside click closes this help.</li>
          </ul>
        </HelpModal>
      )}
    </div>
  );
}
