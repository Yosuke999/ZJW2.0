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
    knowledgeSources: number;
    knowledgeArticles: number;
    knowledgeArticleTranslations: number;
    productMarketFacts: number;
    productMarketFactTranslations: number;
    shippingRoutes: number;
    shippingRouteTranslations: number;
    exchangeRateSnapshots: number;
    profiles: number;
    inquiries: number;
    rlsTables: number;
    attachmentBuckets: number;
    profileMvpColumns: number;
    inquiryMvpColumns: number;
    productKnowledgeColumns: number;
    priceKnowledgeColumns: number;
    knowledgeRlsTables: number;
    secondKnowledgeRlsTables: number;
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
      (select count(*)::int from knowledge_sources) as "knowledgeSources",
      (select count(*)::int from knowledge_articles) as "knowledgeArticles",
      (select count(*)::int from knowledge_article_translations) as "knowledgeArticleTranslations",
      (select count(*)::int from product_market_facts) as "productMarketFacts",
      (select count(*)::int from product_market_fact_translations) as "productMarketFactTranslations",
      (select count(*)::int from shipping_routes) as "shippingRoutes",
      (select count(*)::int from shipping_route_translations) as "shippingRouteTranslations",
      (select count(*)::int from exchange_rate_snapshots) as "exchangeRateSnapshots",
      (select count(*)::int from profiles) as profiles,
      (select count(*)::int from inquiries) as inquiries,
      (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity) as "rlsTables",
      (select count(*)::int from storage.buckets where id = 'application-attachments') as "attachmentBuckets",
      (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('city', 'contact_preference', 'contact_consent_at', 'profile_completed_at')) as "profileMvpColumns",
      (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'inquiries' and column_name in ('intent_type', 'delivery_city', 'custom_product_name')) as "inquiryMvpColumns",
      (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name in ('unit_code', 'origin_country', 'hs_code', 'attributes', 'packaging', 'compliance_notes', 'knowledge_updated_at')) as "productKnowledgeColumns",
      (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'price_snapshots' and column_name in ('china_price_min', 'china_price_max', 'local_price_min', 'local_price_max', 'quantity_min', 'quantity_max', 'price_unit', 'incoterm', 'freight_included', 'customs_included', 'tax_included', 'valid_until', 'source_id', 'reviewed_by', 'reviewed_at')) as "priceKnowledgeColumns",
      (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity and tablename in ('knowledge_sources', 'knowledge_articles', 'knowledge_article_translations')) as "knowledgeRlsTables",
      (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity and tablename in ('product_market_facts', 'product_market_fact_translations', 'shipping_routes', 'shipping_route_translations', 'exchange_rate_snapshots')) as "secondKnowledgeRlsTables",
      (select string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'inquiry_intent_type') as "inquiryIntentTypes",
      (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'handle_new_auth_user') as "authProfileFunction"
  `;

  console.info(JSON.stringify(result, null, 2));
} finally {
  await sql.end();
}
