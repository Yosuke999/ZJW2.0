import Link from "next/link";
import { redirect } from "next/navigation";
import { AdvisorDashboard, type AdvisorInquiry } from "@/components/AdvisorDashboard";
import { AnalyticsDashboard, type AnalyticsEventRow } from "@/components/AnalyticsDashboard";
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
        <div className="account-heading">
          <div>
            <Link className="back-link" href="/kg/zh">← 返回商机页面</Link>
            <h1>顾问工作台</h1>
          </div>
          <AdvisorLanguageSwitch language={language} />
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
            <Link className="back-link" href="/kg/zh">← 返回商机页面</Link>
            <h1>顾问工作台</h1>
            <p>登录账号：{profile.display_name ?? user.email}</p>
          </div>
          <AdvisorLanguageSwitch language={language} />
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
    .select("id,intent_type,market_code,language,name,contact,channel,delivery_city,custom_product_name,quantity,message,source,status,created_at,products(legacy_id)")
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
      <div className="account-heading">
        <div>
          <Link className="back-link" href="/kg/zh">← 返回商机页面</Link>
          <h1>顾问工作台</h1>
          <p>处理采购意向和咨询申请。登录账号：{profile.display_name ?? user.email}</p>
          <p>负责市场：{isAdmin ? "全部市场" : advisorMarket?.toUpperCase()}</p>
        </div>
        <AdvisorLanguageSwitch language={language} />
      </div>
      <AnalyticsDashboard events={(analyticsEvents ?? []) as AnalyticsEventRow[]} language={language} />
      <AdvisorDashboard initialInquiries={normalizedInquiries as AdvisorInquiry[]} copy={copy} language={language} />
    </main>
  );
}

function AdvisorLanguageSwitch({ language }: { language: Language }) {
  const languages: Language[] = ["zh", "ru", "ky", "uz"];
  return (
    <details className="advisor-language-switch">
      <summary aria-label="界面语言">
        <span>{languageLabels[language]}</span>
        <span className="language-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="advisor-language-popover">
        {languages.map((item) => (
          <Link key={item} className={item === language ? "active" : ""} href={`/advisor?language=${item}`}>
            {languageLabels[item]}
          </Link>
        ))}
      </div>
    </details>
  );
}
