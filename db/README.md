# Supabase database foundation

The first migration creates the product catalog, multilingual content, price history,
inquiries, profiles, design applications, private sourcing references, audit records,
Supabase Auth profile provisioning, row-level security policies, and the private
`application-attachments` Storage bucket.

## Environment

Copy `.env.example` to `.env.local` and replace the placeholders with values from the
Supabase project settings. Use the transaction-pooler connection string for
`DATABASE_URL` when running on Vercel.

## Commands

- `pnpm db:generate` generates a migration after editing `db/schema.ts`.
- `pnpm db:migrate` applies pending migrations through `DATABASE_URL`.
- `pnpm db:seed` imports the current 20 products, translations, categories, markets,
  and price snapshots without duplicating the initial price rows.

The public site still reads the existing static files until the Supabase project is
connected and the seeded data has been verified.
