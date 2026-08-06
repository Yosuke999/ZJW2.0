import type { CountryCode, Currency, Language } from "./types";

export type CountryConfig = {
  code: CountryCode;
  name: Record<Language, string>;
  currency: Currency;
  defaultLanguage: Language;
  localLanguage: Language;
  contact: {
    whatsappNumber: string;
    whatsappUrl: string;
    telegramHandle: string;
    telegramUrl: string;
    phone: string;
  };
};

export const countries: Record<CountryCode, CountryConfig> = {
  kg: {
    code: "kg",
    name: {
      ky: "Кыргызстан",
      uz: "Qirgʻiziston",
      ru: "Кыргызстан",
      zh: "吉尔吉斯斯坦",
      en: "Kyrgyzstan",
    },
    currency: "KGS",
    defaultLanguage: "ky",
    localLanguage: "ky",
    contact: {
      whatsappNumber: "00000000000",
      whatsappUrl: "https://wa.me/00000000000",
      telegramHandle: "example_contact",
      telegramUrl: "https://t.me/example_contact",
      phone: "+000 000 000 000",
    },
  },
  uz: {
    code: "uz",
    name: {
      ky: "Өзбекстан",
      uz: "Oʻzbekiston",
      ru: "Узбекистан",
      zh: "乌兹别克斯坦",
      en: "Uzbekistan",
    },
    currency: "UZS",
    defaultLanguage: "uz",
    localLanguage: "uz",
    contact: {
      whatsappNumber: "00000000000",
      whatsappUrl: "https://wa.me/00000000000",
      telegramHandle: "example_contact",
      telegramUrl: "https://t.me/example_contact",
      phone: "+000 000 000 000",
    },
  },
};

export const languageLabels: Record<Language, string> = {
  ky: "Кыргызча",
  uz: "Oʻzbekcha",
  ru: "Русский",
  zh: "中文预览",
  en: "English",
};

export const languageCountry: Partial<Record<Language, CountryCode>> = {
  ky: "kg",
  uz: "uz",
};

export function getLanguageRoute(currentCountry: CountryCode, nextLanguage: Language) {
  const nextCountry = languageCountry[nextLanguage] ?? currentCountry;
  const nextCountryConfig = countries[nextCountry];
  return nextLanguage === nextCountryConfig.defaultLanguage
    ? `/${nextCountry}`
    : `/${nextCountry}/${nextLanguage}`;
}
