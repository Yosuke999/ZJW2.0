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
