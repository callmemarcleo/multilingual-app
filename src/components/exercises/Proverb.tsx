"use client";

import { useState } from "react";
import { ProverbCard } from "@/lib/proverbs";
import { Button } from "../ui/button";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

type Props = { cards: ProverbCard[] };

export default function Proverb({ cards }: Props) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const card = cards[idx];

  const nextCard = () => {
    setPhase(0);
    setIdx((i) => (i + 1) % cards.length);
  };

  const nextPhase = () => {
    if (phase < 3) {
      setPhase((p) => (p + 1) as 1 | 2);
    } else {
      setPhase(0);
      setIdx((i) => (i + 1) % cards.length);
    }
  };
  const prevCard = () => {
    setPhase(0);
    setIdx((i) => (i - 1 + cards.length) % cards.length);
  };

  return (
    <div className="p-6 text-white flex flex-col items-center space-y-6">
      <h2 className="text-lg text-gray-400">
        Proverb {idx + 1} / {cards.length}
      </h2>

      <div className="w-full max-w-xl bg-[#1E2A2E] border border-[#6A6A6A] rounded-2xl p-8 space-y-4">
        <div>
          <strong className="block mb-2">Keywords:</strong>
          <ul className="list-disc list-inside text-gray-200">
            {card.keywords.map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
        </div>

        {phase >= 1 && (
          <div className="pt-4 border-t border-[#6A6A6A]">
            <p className="pt-4 italic text-lg text-white mb-2">
              “{card.proverb}”
            </p>
          </div>
        )}

        {phase >= 2 && (
          <div className="pt-4 border-t border-[#6A6A6A]">
            <p className="text-gray-300">{card.frontText}</p>
          </div>
        )}

        {phase >= 3 && (
          <div className="pt-4 border-t border-[#6A6A6A]">
            <p className="font-semibold pt-4">{card.translation}</p>
          </div>
        )}
      </div>

      <div className="flex space-x-4 mt-4">
        <Button
          onClick={prevCard}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowLeft size={24} />
        </Button>

        <Button onClick={nextPhase} className="bg-green-600 hover:bg-green-700">
          {phase === 0
            ? "Show Proverb"
            : phase === 1
            ? "Show Definition"
            : phase === 2
            ? "Show Translation"
            : "Next Proverb"}
        </Button>
        <Button
          onClick={nextCard}
          className="px-4 py-2 bg-[#141F24] rounded-xl hover:bg-gray-800"
        >
          <FiArrowRight size={24} />
        </Button>
      </div>
    </div>
  );
}
