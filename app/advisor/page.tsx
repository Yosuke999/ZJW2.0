import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdvisorDashboard, type AdvisorInquiry } from "@/components/AdvisorDashboard";
import { AnalyticsDashboard, type AnalyticsEventRow } from "@/components/AnalyticsDashboard";
import { AdvisorLanguageSwitch } from "@/components/AdvisorLanguageSwitch";
import { advisorTranslations } from "@/data/advisor-translations";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isAdvisorRole(role: unknown) {
  return role === "staff" || role === "reviewer" || role === "admin";
}

function isLanguage(value: unknown): value is Language {
  return value === "zh" || value === "ru" || value === "ky" || value === "uz" || value === "en";
}

function isCountry(value: unknown): value is CountryCode {
  return value === "kg" || value === "uz";
}

function marketHref(country: CountryCode, language: Language) {
  const defaultLanguage = country === "kg" ? "ky" : "uz";
  return language === defaultLanguage ? `/${country}` : `/${country}/${language}`;
}

type AdvisorSearchParams = Promise<{ language?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: AdvisorSearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const language: Language = isLanguage(query.language) ? query.language : "zh";
  const copy = advisorTranslations[language];
  return {
    title: `${copy.workspace}｜${translations[language].brandName}`,
    description: copy.intro,
    robots: { index: false, follow: false },
  };
}

export default async function AdvisorPage({ searchParams }: { searchParams: AdvisorSearchParams }) {
  const query = await searchParams;
  const language: Language = isLanguage(query.language) ? query.language : "zh";
  const copy = advisorTranslations[language];
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?country=kg&language=${language}&returnTo=${encodeURIComponent(`/advisor?language=${language}`)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,role,status,country_code")
    .eq("user_id", user.id)
    .maybeSingle();
  const profileMarket = isCountry(profile?.country_code) ? profile.country_code : "kg";
  const backHref = marketHref(profileMarket, language);

  if (!isAdvisorRole(profile?.role) || profile?.status !== "active") {
    return (
      <main className="account-shell shell">
        <div className="account-heading">
          <div>
            <Link className="back-link" href={backHref}>{copy.backToMarket}</Link>
            <h1>{copy.workspace}</h1>
          </div>
          <AdvisorLanguageSwitch language={language} ariaLabel={copy.language} />
        </div>
        <section className="advisor-card">
          <h2>{copy.noAccessTitle}</h2>
          <p>{copy.noAccessBody}</p>
        </section>
      </main>
    );
  }

  const isAdmin = profile.role === "admin";
  const advisorMarket = isCountry(profile.country_code) ? profile.country_code : null;
  if (!isAdmin && !advisorMarket) {
    return (
      <main className="advisor-shell shell">
        <div className="account-heading">
          <div>
            <Link className="back-link" href={backHref}>{copy.backToMarket}</Link>
            <h1>{copy.workspace}</h1>
            <p>{copy.signedInAs}：{profile.display_name ?? user.email}</p>
          </div>
          <AdvisorLanguageSwitch language={language} ariaLabel={copy.language} />
        </div>
        <section className="advisor-card">
          <h2>{copy.noMarketTitle}</h2>
          <p>{copy.noMarketBody}</p>
        </section>
      </main>
    );
  }

  let inquiryQuery = supabase
    .from("inquiries")
    .select("id,intent_type,market_code,language,name,email,contact,channel,delivery_city,custom_product_name,quantity,message,source,status,created_at,products(legacy_id)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!isAdmin && advisorMarket) inquiryQuery = inquiryQuery.eq("market_code", advisorMarket);

  const { data: inquiries } = await inquiryQuery;
  const normalizedInquiries = (inquiries ?? []).map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
  }));

  const analyticsSince = new Date();
  analyticsSince.setUTCDate(analyticsSince.getUTCDate() - 30);
  let analyticsQuery = supabase
    .from("analytics_events")
    .select("visitor_id,event_name,product_legacy_id,market_code,language,created_at")
    .gte("created_at", analyticsSince.toISOString())
    .order("created_at", { ascending: true })
    .limit(10000);
  if (!isAdmin && advisorMarket) analyticsQuery = analyticsQuery.eq("market_code", advisorMarket);
  const { data: analyticsEvents } = await analyticsQuery;

  return (
    <main className="advisor-shell shell">
      <div className="account-heading advisor-heading-card">
        <div className="advisor-heading-copy">
          <Link className="back-link" href={backHref}>{copy.backToMarket}</Link>
          <h1>{copy.workspace}</h1>
          <div className="advisor-meta">
            <span>{copy.signedInAs}：<strong>{profile.display_name ?? user.email}</strong></span>
            <span>{copy.marketScope}：<strong>{isAdmin ? copy.allMarkets : advisorMarket?.toUpperCase()}</strong></span>
          </div>
        </div>
        <AdvisorLanguageSwitch language={language} ariaLabel={copy.language} />
      </div>
      <AnalyticsDashboard events={(analyticsEvents ?? []) as AnalyticsEventRow[]} language={language} />
      <AdvisorDashboard initialInquiries={normalizedInquiries as AdvisorInquiry[]} copy={copy} language={language} />
    </main>
  );
}
