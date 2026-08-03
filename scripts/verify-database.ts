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
    rlsTables: number;
    attachmentBuckets: number;
  }[]>`
    select
      (select count(*)::int from markets) as markets,
      (select count(*)::int from categories) as categories,
      (select count(*)::int from category_translations) as "categoryTranslations",
      (select count(*)::int from products) as products,
      (select count(*)::int from product_translations) as "productTranslations",
      (select count(*)::int from product_categories) as "productCategories",
      (select count(*)::int from price_snapshots) as "priceSnapshots",
      (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity) as "rlsTables",
      (select count(*)::int from storage.buckets where id = 'application-attachments') as "attachmentBuckets"
  `;

  console.info(JSON.stringify(result, null, 2));
} finally {
  await sql.end();
}
