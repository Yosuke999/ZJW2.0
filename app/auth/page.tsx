import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { intentTranslations } from "@/data/intent-translations";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { safeReturnPath } from "@/lib/customer-intents";

type AuthSearchParams = Promise<{ country?: string; language?: string; returnTo?: string }>;

function resolveLanguage(value: string | undefined, country: CountryCode): Language {
  return value === "ky" || value === "uz" || value === "ru" || value === "zh" ? value : country === "uz" ? "uz" : "ky";
}

export async function generateMetadata({ searchParams }: { searchParams: AuthSearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const country: CountryCode = query.country === "uz" ? "uz" : "kg";
  const language = resolveLanguage(query.language, country);
  const copy = intentTranslations[language];
  return {
    title: `${copy.signIn} / ${copy.signUp}｜${translations[language].brandName}`,
    description: copy.authIntro,
    robots: { index: false, follow: false },
  };
}

export default async function AuthPage({ searchParams }: { searchParams: AuthSearchParams }) {
  const query = await searchParams;
  const country: CountryCode = query.country === "uz" ? "uz" : "kg";
  const language = resolveLanguage(query.language, country);
  const fallback = language === (country === "kg" ? "ky" : "uz") ? `/${country}` : `/${country}/${language}`;
  const returnTo = safeReturnPath(query.returnTo, fallback);
  const copy = intentTranslations[language];
  return <main className="account-shell shell"><Link className="back-link" href={fallback}>← {copy.backToMarket}</Link><h1>{copy.signIn} / {copy.signUp}</h1><AuthForm country={country} language={language} returnTo={returnTo} /></main>;
}
