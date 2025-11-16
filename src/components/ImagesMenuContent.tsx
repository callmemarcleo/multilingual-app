"use client";

import Link from "next/link";

const CATEGORIES = [
  { key: "vegetables", label: "Gemüse", emoji: "🥦" },
  { key: "fruits", label: "Früchte", emoji: "🍎" },
  { key: "grains", label: "Getreide / Weizen", emoji: "🌾" },
  { key: "office", label: "Büromaterial", emoji: "🖨️" },
];

export default function ImagesMenuContent() {
  return (
    <div className="space-y-8 p-6 text-white">
      <h1 className="text-3xl font-bold">Choose Image Exercise</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/images/${c.key}`}
            className="bg-[#1E2A2E] border border-gray-700 rounded-xl p-6 
                       hover:bg-[#2A3A40] transition flex items-center gap-4"
          >
            <span className="text-4xl">{c.emoji}</span>
            <span className="text-xl">{c.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
