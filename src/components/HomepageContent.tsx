"use client";

import Image from "next/image";
import LanguageCard from "./LanguageCard";
import { useI18n } from "@/contexts/I18nContext";
import { getTranslation } from "@/lib/translations";

type Language = {
  name: string;
  icon: React.ReactNode;
  href: string;
};

const languages: Language[] = [
  {
    name: "English",
    icon: <Image src="/img/united-kingdom.png" alt="UK Flag" width={64} height={64} />,
    href: "/english",
  },
  {
    name: "German",
    icon: <Image src="/img/germany.png" alt="Germany Flag" width={64} height={64} />,
    href: "/german",
  },
  {
    name: "Spanish",
    icon: <Image src="/img/spain.png" alt="Spain Flag" width={64} height={64} />,
    href: "/spanish",
  },
  {
    name: "Italian",
    icon: <Image src="/img/italy.png" alt="Italy Flag" width={64} height={64} />,
    href: "/italian",
  },
  {
    name: "French",
    icon: <Image src="/img/france.png" alt="French Flag" width={64} height={64} />,
    href: "/french",
  },
];

export default function HomepageContent() {
  const { locale } = useI18n();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-8">
          {getTranslation(locale, "homepage.title")}
        </h1>
        <p className="text-gray-300 leading-relaxed">
          {getTranslation(locale, "homepage.description")}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-12 text-center pb-2 border-b-2 border-[#6A6A6A]">
          {getTranslation(locale, "homepage.languageSentence")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {languages.map((lang) => (
            <LanguageCard
              key={lang.name}
              name={getTranslation(
                locale,
                `homepage.${lang.name.toLocaleLowerCase()}`
              )}
              icon={lang.icon}
              href={lang.href}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
