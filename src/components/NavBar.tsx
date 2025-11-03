"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoHomeOutline } from "react-icons/io5";
import { CiLogout, CiUser } from "react-icons/ci";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nContext";
import { useState } from "react";
import { Button } from "./ui/button";
import { getTranslation } from "@/lib/translations";
import { setCookie } from "cookies-next";
import { signOut } from "next-auth/react";
import { TbJoker } from "react-icons/tb";
import { TbPhoto } from "react-icons/tb";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Home", icon: <IoHomeOutline size={24} />, href: "/" },
  {
    label: "English",
    icon: <Image src="/img/united-kingdom.png" alt="UK Flag" width={24} height={24} />,
    href: "/english",
  },
  {
    label: "German",
    icon: <Image src="/img/germany.png" alt="Germany Flag" width={24} height={24} />,
    href: "/german",
  },
  {
    label: "Spanish",
    icon: <Image src="/img/spain.png" alt="Spain Flag" width={24} height={24} />,
    href: "/spanish",
  },
  {
    label: "Italian",
    icon: <Image src="/img/italy.png" alt="Italy Flag" width={24} height={24} />,
    href: "/italian",
  },
  {
    label: "French",
    icon: <Image src="/img/france.png" alt="French Flag" width={24} height={24} />,
    href: "/french",
  },
  {
    label: "Jokes",
    icon: <TbJoker size={24} />,
    href: "/jokes",
  },
  { label: "Images", icon: <TbPhoto size={24} />, href: "/images", },
  { label: "Profile", icon: <CiUser size={24} />, href: "/profile" },
];

const languageOptions = [
  { name: "English", code: "en", flag: "/img/united-kingdom.png" },
  { name: "German", code: "de", flag: "/img/germany.png" },
  { name: "Spanish", code: "es", flag: "/img/spain.png" },
  { name: "Italian", code: "it", flag: "/img/italy.png" },
  { name: "French", code: "fr", flag: "/img/france.png" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLang =
    languageOptions.find((lang) => lang.code === locale) || languageOptions[0];

  const handleLocaleChange = (langCode: string) => {
    setCookie("locale", langCode, { path: "/" });
    setLocale(langCode);
    setShowDropdown(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="h-screen w-64 text-gray-200 flex flex-col border-r-2 border-[#6A6A6A]">
      <div className="p-4 flex items-center justify-between">
        <span className="text-2xl font-bold">Multilingual</span>
        <div className="relative">
          <Button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-[#141F24] px-3 py-2 rounded-md hover:bg-gray-800"
          >
            <Image
              src={currentLang.flag}
              alt={currentLang.name}
              width={24}
              height={24}
            />
          </Button>

          {showDropdown && (
            <div className="absolute bg-[#141F24] left-0 mt-2 w-40 shadow-md rounded-md flex flex-col gap-1">
              {languageOptions.map((lang) => (
                <Button
                  key={lang.code}
                  onClick={() => handleLocaleChange(lang.code)}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-[#141F24] text-white hover:font-semibold hover:bg-gray-800"
                >
                  <Image
                    src={lang.flag}
                    alt={lang.name}
                    width={20}
                    height={20}
                  />
                  {lang.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      <ul className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
      flex items-center gap-4
       rounded-md p-2
      hover:bg-gray-800
      ${isActive ? "bg-gray-800 font-semibold border-2 border-[#31639C]" : ""}
    `}
              >
                {item.icon}
                <span className="text-xl">
                  {getTranslation(
                    locale,
                    `navbar.${item.label.toLocaleLowerCase()}`
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4">
        <Button
          onClick={handleSignOut}
          className="flex items-center justify-start rounded-md gap-4 p-2 w-full bg-[#141F24] hover:bg-gray-800 text-white text-xl"
        >
          <CiLogout size={24} />
          Logout
        </Button>
      </div>
    </nav>
  );
}
