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
  const [route, profileRoute, form] = await Promise.all([
    read("app/api/inquiries/route.ts"), read("app/api/profile/route.ts"), read("components/IntentActions.tsx"),
  ]);
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /PROFILE_INCOMPLETE/);
  assert.match(route, /profileContact\(profile\)/);
  assert.doesNotMatch(form, /name=\"(?:phone|whatsapp|telegram)\"/);
  assert.match(profileRoute, /contact_consent_at/);
});

test("email confirmation callback supports both PKCE codes and token hashes", async () => {
  const callback = await read("app/auth/confirm/route.ts");
  assert.match(callback, /searchParams\.get\("code"\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /verifyOtp\(\{ type, token_hash: tokenHash \}\)/);
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
