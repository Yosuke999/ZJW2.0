import { redirect } from "next/navigation";
import { AccountDashboard } from "@/components/AccountDashboard";
import type { CountryCode, Language } from "@/data/types";
import { safeReturnPath, type CustomerProfile } from "@/lib/customer-intents";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ country?: string; language?: string; returnTo?: string }> }) {
  const query = await searchParams;
  const country: CountryCode = query.country === "uz" ? "uz" : "kg";
  const language: Language = ["ky", "uz", "ru", "zh"].includes(query.language ?? "") ? query.language as Language : country === "uz" ? "uz" : "ky";
  const fallback = language === (country === "kg" ? "ky" : "uz") ? `/${country}` : `/${country}/${language}`;
  const returnTo = safeReturnPath(query.returnTo, fallback);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?country=${country}&language=${language}&returnTo=${encodeURIComponent(returnTo)}`);
  const [{ data: profile }, { data: intents }] = await Promise.all([
    supabase.from("profiles").select("user_id,display_name,country_code,preferred_language,phone,whatsapp,telegram,city,contact_preference,contact_consent_at,profile_completed_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("inquiries").select("id,intent_type,delivery_city,custom_product_name,quantity,message,status,created_at,products(legacy_id)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const fallbackProfile: CustomerProfile = {
    user_id: user.id,
    display_name: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
    country_code: country,
    preferred_language: language,
    phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null,
    whatsapp: typeof user.user_metadata?.whatsapp === "string" ? user.user_metadata.whatsapp : null,
    telegram: typeof user.user_metadata?.telegram === "string" ? user.user_metadata.telegram : null,
    city: typeof user.user_metadata?.city === "string" ? user.user_metadata.city : null,
    contact_preference: ["phone", "whatsapp", "telegram"].includes(user.user_metadata?.contact_preference) ? user.user_metadata.contact_preference : null,
    contact_consent_at: user.user_metadata?.contact_consent === true ? new Date().toISOString() : null,
    profile_completed_at: null,
  };
  return <main className="account-shell shell"><AccountDashboard profile={(profile ?? fallbackProfile) as CustomerProfile} intents={(intents ?? []) as never} country={country} language={language} returnTo={returnTo} /></main>;
}
