import en from "@/locales/en/common.json";
import de from "@/locales/de/common.json";
import es from "@/locales/es/common.json";
import it from "@/locales/it/common.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<string, any> = { en, de, es, it };

export function getTranslation(locale: string, key: string) {
  const keys = key.split(".");
  let value = translations[locale];

  for (const k of keys) {
    value = value?.[k];
    if (!value) return key;
  }

  return value;
}
