"use client";

import LanguageCard from "@/components/LanguageCard";
import Image from "next/image";
import germany from "../public/img/germany.png";
import unitedKingdom from "../public/img/united-kingdom.png";
import spain from "../public/img/spain.png";
import france from "../public/img/france.png";

type Language = {
  name: string;
  icon: React.ReactNode;
  href: string;
};

const LANGUAGES: Language[] = [
  {
    name: "German",
    href: "/jokes/german",
    icon: <Image src="/img/germany.png" alt="Germany Flag" width={64} height={64} />,
  },
  {
    name: "English",
    href: "/jokes/english",
    icon: <Image src="/img/united-kingdom.png" alt="UK Flag" width={64} height={64} />,
  },
  {
    name: "Spanish",
    href: "/jokes/spanish",
    icon: <Image src="/img/spain.png" alt="Spain Flag" width={64} height={64} />,
  },
  {
    name: "French",
    href: "/jokes/french",
    icon: <Image src="/img/france.png" alt="French Flag" width={64} height={64} />,
  },
];

export default function JokesContent() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Choose a language for jokes</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {LANGUAGES.map((l) => (
          <LanguageCard
            key={l.name}
            name={l.name}
            href={l.href}
            icon={<span className="text-4xl">{l.icon}</span>}
          />
        ))}
      </div>
    </div>
  );
}
