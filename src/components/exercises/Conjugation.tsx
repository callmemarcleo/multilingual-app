/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import ProgressBar, { ExerciseProgress } from "../ProgressBar";
import { Button } from "../ui/button";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { GoXCircleFill } from "react-icons/go";
import { FiInfo } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { ConjCard } from "@/lib/conjugations";

const PRONOUNS_BY_LANG: Record<string, string[]> = {
  Italian: ["io", "tu", "lui/lei", "noi", "voi", "loro"],
  Spanish: ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos"],
};

const TENSE_TABLE = [
  { de: "Präsens",              fr: "Présent",                       en: "Present Simple / Present Continuous", it: "Presente",              es: "Presente" },
  { de: "Präteritum",           fr: "Imparfait / Passé simple*",     en: "Past Simple",                         it: "Imperfetto / Passato remoto*", es: "Pretérito imperfecto / Pretérito indefinido" },
  { de: "Perfekt",              fr: "Passé composé",                 en: "Present Perfect",                     it: "Passato prossimo",      es: "Pretérito perfecto" },
  { de: "Plusquamperfekt",      fr: "Plus-que-parfait",              en: "Past Perfect",                        it: "Trapassato prossimo",   es: "Pluscuamperfecto" },
  { de: "Futur I",              fr: "Futur simple",                  en: "Future Simple (will)",                it: "Futuro semplice",       es: "Futuro simple" },
  { de: "Futur II",             fr: "Futur antérieur",               en: "Future Perfect",                      it: "Futuro anteriore",      es: "Futuro compuesto" },
  { de: "Konjunktiv I & II",    fr: "Subjonctif",                    en: "Subjunctive",                         it: "Congiuntivo",           es: "Subjuntivo" },
  { de: "Konditional (würde)",  fr: "Conditionnel",                  en: "Conditional",                         it: "Condizionale",          es: "Condicional" },
  { de: "Imperativ",            fr: "Impératif",                     en: "Imperative",                          it: "Imperativo",            es: "Imperativo" },
];

const TENSE_ROW_MAP: Record<string, number> = {
  "Presente":              0,
  "Imperfecto":            1,
  "Imperfetto":            1,
  "Passato remoto":        1,
  "Passato prossimo":      2,
  "Trapassato prossimo":   3,
  "Futuro semplice":       4,
  "Futuro Simple":         4,
  "Futuro anteriore":      5,
  "Congiuntivo Presente":  6,
  "Condizionale":          7,
  "Condizionale Presente": 7,
  "Imperativo":            8,
};

type Props = {
  cards: ConjCard[];
  language: string;
};

export default function ConjugationGrid({ cards, language }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => Array(6).fill(""));
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setCorrect] = useState<boolean | null>(null);
  const PRONOUNS = PRONOUNS_BY_LANG[language];

  const [slotCorrect, setSlotCorrect] = useState<boolean[]>(() =>
    Array(6).fill(false)
  );

  const [statuses, setStatuses] = useState<ExerciseProgress[]>(
    cards.map((c) => ({ id: c.id, status: "default" }))
  );

  useEffect(() => {
    setAnswers(Array(6).fill(""));
    setCorrect(null);
    setHasChecked(false);
    setSlotCorrect(Array(6).fill(false));
  }, [idx]);

  const currentRaw = cards[idx];
  const current = {
    ...currentRaw,
    forms:
      language === "Spanish"
        ? currentRaw.forms.map((f) => f.replace(/-/g, ""))
        : currentRaw.forms,
  };

  const handleCheck = () => {
    setHasChecked(true);
    const trimmed = answers.map((a) => a.trim().toLowerCase());
    const correctFormsRaw = current.forms.map((f) => f.trim());
    const lowerCorrect = correctFormsRaw.map((f) => f.toLowerCase());
    const perSlot = trimmed.map((ans, i) => ans === lowerCorrect[i]);
    setSlotCorrect(perSlot);

    const allRight = perSlot.every(Boolean);
    setCorrect(allRight);
    setStatuses((st) =>
      st.map((s, i) =>
        i === idx ? { ...s, status: allRight ? "right" : "wrong" } : s
      )
    );
    setAnswers((prev) =>
      prev.map((given, i) => (perSlot[i] ? given : correctFormsRaw[i]))
    );
  };

  const goNext = () => {
    if (idx < cards.length - 1) setIdx(idx + 1);
    else {
      alert("Congratulazioni, alle Übungen fertig!");
      router.push("/italian");
    }
  };

  const handleCancel = () => {
    router.push("/italian");
  };

  const buttonLabel = hasChecked ? "Nächste Frage" : "Verifizieren";

  return (
    <div className="p-4 text-white flex flex-col items-center">
      <div className="w-full max-w-xl">
        <ProgressBar
          exercises={statuses}
          activeIndex={idx}
          onCancel={handleCancel}
        />
      </div>

      <h2 className="text-2xl font-bold mt-8">
        Coniuga "{current.infinitive}" – {current.tense}
      </h2>

      {/* Verbstamm display — only shown when the card has a stem */}
      {current.verbstamm && (
        <div className="w-full max-w-xl mt-4">
          <div className="bg-[#1E2A2E] border border-[#6A6A6A] rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-gray-400 text-sm">Verbstamm:</span>
            <span className="text-white font-mono text-lg font-semibold">
              {current.verbstamm}
            </span>
            <span
              title="Der Verbstamm dient als Orientierungshilfe"
              className="ml-auto text-gray-500 hover:text-gray-300 cursor-help"
            >
              <FiInfo size={15} />
            </span>
          </div>
        </div>
      )}

      {/* 6-slot conjugation grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 w-full max-w-xl">
        {PRONOUNS.map((pronoun, i) => (
          <div key={i} className="flex flex-col">
            <label className="text-gray-300">{pronoun}</label>
            <div
              className={`mt-1 flex items-center rounded bg-[#141F24] border ${
                hasChecked
                  ? slotCorrect[i]
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-600"
              }`}
            >
              <input
                className="p-2 bg-transparent flex-1 outline-none min-w-0"
                value={answers[i]}
                disabled={hasChecked}
                onChange={(e) => {
                  const v = e.target.value;
                  setAnswers((a) => {
                    const copy = [...a];
                    copy[i] = v;
                    return copy;
                  });
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center space-x-8 w-full max-w-xl">
        {isCorrect !== null && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <IoIosCheckmarkCircle size={28} className="text-green-500" />
                <span className="text-green-400 font-semibold">
                  Alles richtig!
                </span>
              </>
            ) : (
              <>
                <GoXCircleFill size={28} className="text-red-500" />
                <span className="text-red-400 font-semibold">
                  Einige Fehler
                </span>
              </>
            )}
          </div>
        )}

        <Button
          onClick={() => (hasChecked ? goNext() : handleCheck())}
          className="justify-start bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          {buttonLabel}
        </Button>
      </div>

      <div className="mt-10 w-full max-w-xl">
        <p className="text-gray-400 text-sm mb-2">Zeitformen – Übersicht</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1E2A2E] text-gray-400 font-medium">
                <th className="py-2 px-3 text-left">DE</th>
                <th className="py-2 px-3 text-left">FR</th>
                <th className="py-2 px-3 text-left">EN</th>
                <th className="py-2 px-3 text-left">IT</th>
                <th className="py-2 px-3 text-left">ES</th>
              </tr>
            </thead>
            <tbody>
              {TENSE_TABLE.map((row, i) => {
                const highlighted = TENSE_ROW_MAP[current.tense] === i;
                return (
                  <tr
                    key={i}
                    className={
                      highlighted
                        ? "bg-[#1E3A2E] text-white border-l-2 border-green-500"
                        : "text-gray-300"
                    }
                  >
                    <td className="py-2 px-3 border-b border-[#2A3A40]">{row.de}</td>
                    <td className="py-2 px-3 border-b border-[#2A3A40]">{row.fr}</td>
                    <td className="py-2 px-3 border-b border-[#2A3A40]">{row.en}</td>
                    <td className="py-2 px-3 border-b border-[#2A3A40]">{row.it}</td>
                    <td className="py-2 px-3 border-b border-[#2A3A40]">{row.es}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}