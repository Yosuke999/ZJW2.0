import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Supabase foundation exposes only public browser credentials", async () => {
  const env = await read(".env.example");

  assert.match(env, /^NEXT_PUBLIC_SUPABASE_URL=/m);
  assert.match(env, /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/m);
  assert.match(env, /^DATABASE_URL=/m);
  assert.doesNotMatch(env, /SERVICE_ROLE|SECRET_KEY/);
});

test("database schema covers catalog, accounts, inquiries, and applications", async () => {
  const schema = await read("db/schema.ts");

  for (const table of [
    "markets",
    "categories",
    "products",
    "price_snapshots",
    "profiles",
    "inquiries",
    "design_applications",
    "application_attachments",
    "application_status_history",
    "audit_logs",
  ]) {
    assert.match(schema, new RegExp(`pgTable\\(\\"${table}\\"`));
  }
});

test("initial migration protects user data and uploaded application files", async () => {
  const migration = await read("db/migrations/0000_silent_hex.sql");

  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY "users read own applications"/);
  assert.match(migration, /CREATE POLICY "staff manage applications"/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.handle_new_auth_user\(\)/);
  assert.match(migration, /'application-attachments',[\s\S]*false,[\s\S]*10485760/);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
});

test("customer intent migration adds only the MVP profile and inquiry fields", async () => {
  const [schema, migration] = await Promise.all([
    read("db/schema.ts"),
    read("db/migrations/0001_smiling_gertrude_yorkes.sql"),
  ]);
  assert.match(schema, /inquiryIntentType[\s\S]*callback[\s\S]*purchase_intent/);
  for (const column of ["city", "contact_preference", "contact_consent_at", "profile_completed_at", "intent_type", "delivery_city", "custom_product_name"]) {
    assert.match(migration, new RegExp(`\\"${column}\\"`));
  }
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|DROP INDEX/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.handle_new_auth_user\(\)/);
});

test("intent endpoints require auth and never accept contact identity from the form", async () => {
  const [route, profileRoute, routeClient, form, dashboard] = await Promise.all([
    read("app/api/inquiries/route.ts"), read("app/api/profile/route.ts"), read("lib/supabase/route.ts"), read("components/IntentActions.tsx"), read("components/AccountDashboard.tsx"),
  ]);
  assert.match(route, /createSupabaseRouteContext\(request\)/);
  assert.match(profileRoute, /createSupabaseRouteContext\(request\)/);
  assert.match(routeClient, /authorization/);
  assert.match(routeClient, /getUser\(token\)/);
  assert.match(form, /headers\.authorization = `Bearer \$\{session\.access_token\}`/);
  assert.match(form, /readCurrentProfile/);
  assert.match(form, /response\.status === 409/);
  assert.match(form, /postInquiry\(payload\)/);
  assert.match(dashboard, /headers\.authorization = `Bearer \$\{session\.access_token\}`/);
  assert.match(route, /PROFILE_INCOMPLETE/);
  assert.match(route, /mergeCustomerProfile/);
  assert.match(route, /profileContact\(profile\)/);
  assert.doesNotMatch(form, /name=\"(?:phone|whatsapp|telegram)\"/);
  assert.match(profileRoute, /contact_consent_at/);
  assert.match(profileRoute, /\.upsert\(/);
  assert.doesNotMatch(profileRoute, /Preferred contact is empty/);
  assert.match(profileRoute, /firstFilledContact/);
  assert.match(profileRoute, /user_id:\s*user\.id/);
});

test("email confirmation callback supports both PKCE codes and token hashes", async () => {
  const callback = await read("app/auth/confirm/route.ts");
  assert.match(callback, /searchParams\.get\("code"\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /verifyOtp\(\{ type, token_hash: tokenHash \}\)/);
});

test("password login syncs Supabase browser sessions into server cookies", async () => {
  const [sessionRoute, authForm, dashboard, accountNav, helpers] = await Promise.all([
    read("app/auth/session/route.ts"),
    read("components/AuthForm.tsx"),
    read("components/AccountDashboard.tsx"),
    read("components/AccountNav.tsx"),
    read("lib/customer-intents.ts"),
  ]);

  assert.match(sessionRoute, /auth\.setSession/);
  assert.match(sessionRoute, /access_token/);
  assert.match(sessionRoute, /profileFromUserMetadata/);
  assert.match(sessionRoute, /mergeCustomerProfile/);
  assert.match(sessionRoute, /\.upsert\(/);
  assert.match(sessionRoute, /refresh_token/);
  assert.match(sessionRoute, /isAdvisorRole\(profile\?\.role\)/);
  assert.match(sessionRoute, /advisor/);
  assert.match(sessionRoute, /auth\.signOut\(\)/);
  assert.match(authForm, /await syncServerSession\(data\.session\)/);
  assert.match(authForm, /session\.advisor \? "\/advisor" : returnTo/);
  assert.doesNotMatch(authForm, /copy\.authError\); setBusy\(false\); return; }\s*router\.replace\(returnTo\)/);
  assert.match(authForm, /fetch\("\/auth\/session"/);
  assert.doesNotMatch(authForm, /setMessage\(error\.message\)/);
  assert.match(dashboard, /fetch\("\/auth\/session", \{ method: "DELETE" \}/);
  assert.match(dashboard, /copy\.saveProfile/);
  assert.match(accountNav, /user\.user_metadata\?\.display_name/);
  assert.match(helpers, /export function profileFromUserMetadata/);
  assert.match(helpers, /export function mergeCustomerProfile/);
});

test("Kyrgyz and Uzbek customer flows use complete native-language copy", async () => {
  const [copy, intentActions] = await Promise.all([
    read("data/intent-translations.ts"),
    read("components/IntentActions.tsx"),
  ]);

  assert.doesNotMatch(copy, /const ky: IntentCopy = \{ \.\.\.ru/);
  assert.doesNotMatch(copy, /const uz: IntentCopy = \{ \.\.\.ru/);
  assert.match(copy, /loginTab: "Аккаунтум бар"/);
  assert.match(copy, /submitRegister: "Катталып, улантуу"/);
  assert.match(copy, /externalContact: "Же түз байланышсаңыз болот"/);
  assert.match(copy, /loginTab: "Akkauntim bor"/);
  assert.match(copy, /submitRegister: "Ro‘yxatdan o‘tib davom etish"/);
  assert.match(copy, /externalContact: "Yoki to‘g‘ridan-to‘g‘ri bog‘laning"/);
  assert.match(intentActions, /setError\(copy\.authError\)/);
  assert.doesNotMatch(intentActions, /SUBMIT_FAILED/);
});

test("first-party analytics records anonymous funnels and scopes the advisor dashboard", async () => {
  const [schema, migration, route, analytics, authForm, intents, advisorPage, dashboard] = await Promise.all([
    read("db/schema.ts"),
    read("db/migrations/0005_analytics_dashboard.sql"),
    read("app/api/analytics/route.ts"),
    read("lib/analytics.ts"),
    read("components/AuthForm.tsx"),
    read("components/IntentActions.tsx"),
    read("app/advisor/page.tsx"),
    read("components/AnalyticsDashboard.tsx"),
  ]);

  assert.match(schema, /export const analyticsEvents/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /public records anonymous analytics/);
  assert.match(migration, /advisors read scoped analytics/);
  assert.match(migration, /profiles\.role = 'admin' OR profiles\.country_code = analytics_events\.market_code/);
  assert.match(route, /visitorId: z\.string\(\)\.regex/);
  assert.match(route, /user_id: user\?\.id \?\? null/);
  assert.match(analytics, /window\.localStorage/);
  assert.match(analytics, /window\.sessionStorage/);
  assert.match(analytics, /fetch\("\/api\/analytics"/);
  assert.match(authForm, /trackEvent\("registration_completed"/);
  assert.match(intents, /trackEvent\("inquiry_submitted"/);
  assert.match(advisorPage, /\.from\("analytics_events"\)/);
  assert.match(advisorPage, /analyticsQuery\.eq\("market_code", advisorMarket\)/);
  assert.match(dashboard, /独立访客/);
  assert.match(dashboard, /注册转化率/);
  assert.match(dashboard, /国家与语言转化/);
});

test("account page always shows a profile form for authenticated users", async () => {
  const [accountPage, dashboard, intentActions, migration] = await Promise.all([
    read("app/account/page.tsx"),
    read("components/AccountDashboard.tsx"),
    read("components/IntentActions.tsx"),
    read("db/migrations/0002_profile_self_insert_policy.sql"),
  ]);

  assert.match(accountPage, /\.maybeSingle\(\)/);
  assert.match(accountPage, /mergeCustomerProfile/);
  assert.doesNotMatch(accountPage, /if \(!profile\) redirect/);
  assert.match(dashboard, /profile\.telegram \? "telegram" : "phone"/);
  assert.match(intentActions, /profileFromUserMetadata/);
  assert.match(intentActions, /mergeCustomerProfile/);
  assert.match(intentActions, /\.maybeSingle\(\)/);
  assert.match(migration, /CREATE POLICY "users create own profile"/);
});

test("customer tables grant the minimum privileges required by the app", async () => {
  const [customerMigration, advisorMigration] = await Promise.all([
    read("db/migrations/0003_grant_customer_app_privileges.sql"),
    read("db/migrations/0004_grant_advisor_workspace_privileges.sql"),
  ]);

  assert.match(customerMigration, /GRANT SELECT ON public\.markets TO anon, authenticated/);
  assert.match(customerMigration, /GRANT SELECT, INSERT, UPDATE ON public\.profiles TO authenticated/);
  assert.match(customerMigration, /GRANT SELECT, INSERT ON public\.inquiries TO authenticated/);
  assert.match(advisorMigration, /GRANT UPDATE ON public\.inquiries TO authenticated/);
  assert.match(advisorMigration, /GRANT SELECT ON public\.products TO authenticated/);
});

test("advisor workspace is staff-only, localized, and market-scoped", async () => {
  const [page, dashboard, route, copy] = await Promise.all([
    read("app/advisor/page.tsx"),
    read("components/AdvisorDashboard.tsx"),
    read("app/api/advisor/inquiries/[id]/route.ts"),
    read("data/advisor-translations.ts"),
  ]);

  assert.match(page, /advisorTranslations\[language\]/);
  assert.match(page, /AdvisorLanguageSwitch/);
  assert.match(page, /<h1>顾问工作台<\/h1>/);
  assert.match(page, /处理采购意向和咨询申请。登录账号/);
  assert.match(page, /负责市场/);
  assert.match(page, /<details className="advisor-language-switch">/);
  assert.match(page, /advisor-language-popover/);
  assert.match(page, /language=\$\{language\}/);
  assert.match(page, /isAdvisorRole\(profile\?\.role\)/);
  assert.match(page, /profile\.role === "admin"/);
  assert.match(page, /\.eq\("market_code", advisorMarket\)/);
  assert.match(page, /\.from\("inquiries"\)/);
  assert.match(page, /products\(legacy_id\)/);
  assert.match(page, /country_code/);
  assert.match(dashboard, /copy\.pendingInfo/);
  assert.match(dashboard, /advisor-filter/);
  assert.match(dashboard, /filterStatuses/);
  assert.match(dashboard, /setFilter\(status\)/);
  assert.match(dashboard, /hiddenIds/);
  assert.match(dashboard, /item\.status !== "spam"/);
  assert.match(dashboard, /new Set\(current\)\.add\(id\)/);
  assert.doesNotMatch(dashboard, /\.delete\(/);
  assert.match(dashboard, /item\.message/);
  assert.match(dashboard, /item\.custom_product_name/);
  assert.match(dashboard, /\{item\.message && <p className="advisor-note">\{item\.message\}<\/p>\}/);
  assert.match(dashboard, /filter === "new"/);
  assert.match(dashboard, /item\.status === filter/);
  assert.match(dashboard, /\/api\/advisor\/inquiries\/\$\{id\}/);
  assert.match(route, /z\.enum\(\["contacted", "qualified", "closed", "spam"\]\)/);
  assert.match(route, /canProcessMarket\(profile, inquiry\.market_code\)/);
  assert.match(route, /FORBIDDEN_MARKET/);
  assert.match(route, /assigned_to: user\.id/);
  assert.match(route, /status: parsed\.data\.status/);
  assert.match(route, /isAdvisorRole\(profile\?\.role\)/);
  assert.match(copy, /export const advisorTranslations/);
  assert.match(copy, /filters: Record<string, string>/);
  assert.match(copy, /zh, ru, ky, uz/);
});

test("account login returns to the market page while keeping a visible signed-in header", async () => {
  const [accountPage, dashboard, header, accountNav, copy] = await Promise.all([
    read("app/account/page.tsx"),
    read("components/AccountDashboard.tsx"),
    read("components/Header.tsx"),
    read("components/AccountNav.tsx"),
    read("data/intent-translations.ts"),
  ]);

  assert.doesNotMatch(accountPage, /accountReturnTo|welcome=1/);
  assert.match(accountPage, /returnTo=\$\{encodeURIComponent\(returnTo\)\}/);
  assert.match(dashboard, /showWelcome/);
  assert.match(dashboard, /copy\.loginSuccess/);
  assert.match(header, /<AccountNav country=\{country\.code\} language=\{language\} \/>/);
  assert.match(accountNav, /supabase\.auth\.getUser\(\)/);
  assert.match(accountNav, /\.from\("profiles"\)/);
  assert.match(accountNav, /select\("display_name,role,status"\)/);
  assert.match(accountNav, /isAdvisorRole\(data\?\.role\)/);
  assert.match(accountNav, /href="\/advisor"/);
  assert.match(accountNav, /工作台/);
  assert.match(accountNav, /onAuthStateChange/);
  assert.match(copy, /loginSuccess:/);
});
