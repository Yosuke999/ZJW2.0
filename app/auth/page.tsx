import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { intentTranslations } from "@/data/intent-translations";
import type { CountryCode, Language } from "@/data/types";
import { safeReturnPath } from "@/lib/customer-intents";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ country?: string; language?: string; returnTo?: string }> }) {
  const query = await searchParams;
  const country: CountryCode = query.country === "uz" ? "uz" : "kg";
  const language: Language = ["ky", "uz", "ru", "zh"].includes(query.language ?? "") ? query.language as Language : country === "uz" ? "uz" : "ky";
  const fallback = language === (country === "kg" ? "ky" : "uz") ? `/${country}` : `/${country}/${language}`;
  const returnTo = safeReturnPath(query.returnTo, fallback);
  const copy = intentTranslations[language];
  return <main className="account-shell shell"><Link className="back-link" href={fallback}>← {copy.backToMarket}</Link><h1>{copy.signIn} / {copy.signUp}</h1><AuthForm country={country} language={language} returnTo={returnTo} /></main>;
}
