import Link from "next/link";
import { redirect } from "next/navigation";
import { AdvisorDashboard, type AdvisorInquiry } from "@/components/AdvisorDashboard";
import { advisorTranslations } from "@/data/advisor-translations";
import { languageLabels } from "@/data/countries";
import type { CountryCode, Language } from "@/data/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isAdvisorRole(role: unknown) {
  return role === "staff" || role === "reviewer" || role === "admin";
}

function isLanguage(value: unknown): value is Language {
  return value === "zh" || value === "ru" || value === "ky" || value === "uz";
}

function isCountry(value: unknown): value is CountryCode {
  return value === "kg" || value === "uz";
}

export default async function AdvisorPage({ searchParams }: { searchParams: Promise<{ language?: string }> }) {
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

  if (!isAdvisorRole(profile?.role) || profile?.status !== "active") {
    return (
      <main className="account-shell shell">
        <Link className="back-link" href="/kg/zh">{copy.backToMarket}</Link>
        <AdvisorLanguageSwitch language={language} />
        <h1>{copy.workspace}</h1>
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
            <Link className="back-link" href="/kg/zh">{copy.backToMarket}</Link>
            <h1>{copy.workspace}</h1>
            <p>{copy.signedInAs}：{profile.display_name ?? user.email}</p>
          </div>
        </div>
        <AdvisorLanguageSwitch language={language} />
        <section className="advisor-card">
          <h2>{copy.noMarketTitle}</h2>
          <p>{copy.noMarketBody}</p>
        </section>
      </main>
    );
  }

  let inquiryQuery = supabase
    .from("inquiries")
    .select("id,intent_type,market_code,language,name,contact,channel,delivery_city,custom_product_name,quantity,message,source,status,created_at,products(legacy_id)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!isAdmin && advisorMarket) inquiryQuery = inquiryQuery.eq("market_code", advisorMarket);

  const { data: inquiries } = await inquiryQuery;
  const normalizedInquiries = (inquiries ?? []).map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
  }));

  return (
    <main className="advisor-shell shell">
      <div className="account-heading">
        <div>
          <Link className="back-link" href="/kg/zh">{copy.backToMarket}</Link>
          <h1>{copy.workspace}</h1>
          <p>{copy.intro}{copy.signedInAs}：{profile.display_name ?? user.email}</p>
          <p>{copy.marketScope}：{isAdmin ? copy.allMarkets : advisorMarket?.toUpperCase()}</p>
        </div>
      </div>
      <AdvisorLanguageSwitch language={language} />
      <AdvisorDashboard initialInquiries={normalizedInquiries as AdvisorInquiry[]} copy={copy} language={language} />
    </main>
  );
}

function AdvisorLanguageSwitch({ language }: { language: Language }) {
  const languages: Language[] = ["zh", "ru", "ky", "uz"];
  return (
    <nav className="advisor-language-switch" aria-label="Advisor language">
      {languages.map((item) => (
        <Link key={item} className={item === language ? "active" : ""} href={`/advisor?language=${item}`}>
          {languageLabels[item]}
        </Link>
      ))}
    </nav>
  );
}
