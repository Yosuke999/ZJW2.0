import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AccountDashboard } from "@/components/AccountDashboard";
import { intentTranslations } from "@/data/intent-translations";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { mergeCustomerProfile, profileFromUserMetadata, safeReturnPath, type CustomerProfile } from "@/lib/customer-intents";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AccountSearchParams = Promise<{ country?: string; language?: string; returnTo?: string }>;

function resolveLanguage(value: string | undefined, country: CountryCode): Language {
  return value === "ky" || value === "uz" || value === "ru" || value === "zh" ? value : country === "uz" ? "uz" : "ky";
}

export async function generateMetadata({ searchParams }: { searchParams: AccountSearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const country: CountryCode = query.country === "uz" ? "uz" : "kg";
  const language = resolveLanguage(query.language, country);
  const copy = intentTranslations[language];
  return {
    title: `${copy.account}｜${translations[language].brandName}`,
    description: copy.myProfile,
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({ searchParams }: { searchParams: AccountSearchParams }) {
  const query = await searchParams;
  const country: CountryCode = query.country === "uz" ? "uz" : "kg";
  const language = resolveLanguage(query.language, country);
  const fallback = language === (country === "kg" ? "ky" : "uz") ? `/${country}` : `/${country}/${language}`;
  const returnTo = safeReturnPath(query.returnTo, fallback);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?country=${country}&language=${language}&returnTo=${encodeURIComponent(returnTo)}`);
  const [{ data: profile }, { data: intents }] = await Promise.all([
    supabase.from("profiles").select("user_id,display_name,country_code,preferred_language,phone,whatsapp,telegram,city,contact_preference,contact_consent_at,profile_completed_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("inquiries").select("id,intent_type,delivery_city,custom_product_name,quantity,message,status,created_at,products(legacy_id)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const fallbackProfile = profileFromUserMetadata(user.id, user.user_metadata, { countryCode: country, language });
  const mergedProfile = mergeCustomerProfile((profile as CustomerProfile | null) ?? null, fallbackProfile);
  const normalizedIntents = (intents ?? []).map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
  }));
  return <main className="account-shell shell"><AccountDashboard profile={mergedProfile} intents={normalizedIntents as never} country={country} language={language} returnTo={returnTo} /></main>;
}
