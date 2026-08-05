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
  assert.match(sessionRoute, /auth\.signOut\(\)/);
  assert.match(authForm, /await syncServerSession\(data\.session\)/);
  assert.doesNotMatch(authForm, /copy\.authError\); setBusy\(false\); return; }\s*router\.replace\(returnTo\)/);
  assert.match(authForm, /fetch\("\/auth\/session"/);
  assert.match(dashboard, /fetch\("\/auth\/session", \{ method: "DELETE" \}/);
  assert.match(accountNav, /user\.user_metadata\?\.display_name/);
  assert.match(helpers, /export function profileFromUserMetadata/);
  assert.match(helpers, /export function mergeCustomerProfile/);
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
  assert.match(accountNav, /onAuthStateChange/);
  assert.match(copy, /loginSuccess:/);
});
