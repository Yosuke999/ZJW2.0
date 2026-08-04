import postgres from "postgres";

process.loadEnvFile(".env.local");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

const sql = postgres(connectionString, { max: 1, prepare: false });

try {
  const [result] = await sql<{
    markets: number;
    categories: number;
    categoryTranslations: number;
    products: number;
    productTranslations: number;
    productCategories: number;
    priceSnapshots: number;
    profiles: number;
    inquiries: number;
    rlsTables: number;
    attachmentBuckets: number;
    profileMvpColumns: number;
    inquiryMvpColumns: number;
    inquiryIntentTypes: string;
    authProfileFunction: number;
  }[]>`
    select
      (select count(*)::int from markets) as markets,
      (select count(*)::int from categories) as categories,
      (select count(*)::int from category_translations) as "categoryTranslations",
      (select count(*)::int from products) as products,
      (select count(*)::int from product_translations) as "productTranslations",
      (select count(*)::int from product_categories) as "productCategories",
      (select count(*)::int from price_snapshots) as "priceSnapshots",
      (select count(*)::int from profiles) as profiles,
      (select count(*)::int from inquiries) as inquiries,
      (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity) as "rlsTables",
      (select count(*)::int from storage.buckets where id = 'application-attachments') as "attachmentBuckets",
      (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('city', 'contact_preference', 'contact_consent_at', 'profile_completed_at')) as "profileMvpColumns",
      (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'inquiries' and column_name in ('intent_type', 'delivery_city', 'custom_product_name')) as "inquiryMvpColumns",
      (select string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'inquiry_intent_type') as "inquiryIntentTypes",
      (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'handle_new_auth_user') as "authProfileFunction"
  `;

  console.info(JSON.stringify(result, null, 2));
} finally {
  await sql.end();
}
