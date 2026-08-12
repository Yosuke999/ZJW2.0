CREATE TYPE "public"."knowledge_access_level" AS ENUM('public', 'internal', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."knowledge_scope" AS ENUM('global', 'market', 'category', 'product');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_type" AS ENUM('government', 'carrier', 'supplier', 'market_research', 'platform_policy', 'internal_record');--> statement-breakpoint
CREATE TYPE "public"."knowledge_topic" AS ENUM('pricing', 'minimum_order', 'sourcing', 'inspection', 'shipping', 'customs', 'payment', 'delivery', 'warranty', 'returns', 'compliance', 'platform_process', 'railway_project');--> statement-breakpoint
CREATE TABLE "knowledge_article_translations" (
	"article_id" uuid NOT NULL,
	"locale" varchar(5) NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"sample_questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_article_translations_article_id_locale_pk" PRIMARY KEY("article_id","locale")
);
--> statement-breakpoint
CREATE TABLE "knowledge_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"topic" "knowledge_topic" NOT NULL,
	"scope" "knowledge_scope" DEFAULT 'global' NOT NULL,
	"market_code" varchar(2),
	"product_id" uuid,
	"category_id" uuid,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"source_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_articles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "knowledge_articles_scope_check" CHECK (
    ("knowledge_articles"."scope" = 'global' AND "knowledge_articles"."market_code" IS NULL AND "knowledge_articles"."product_id" IS NULL AND "knowledge_articles"."category_id" IS NULL)
    OR ("knowledge_articles"."scope" = 'market' AND "knowledge_articles"."market_code" IS NOT NULL AND "knowledge_articles"."product_id" IS NULL AND "knowledge_articles"."category_id" IS NULL)
    OR ("knowledge_articles"."scope" = 'product' AND "knowledge_articles"."product_id" IS NOT NULL)
    OR ("knowledge_articles"."scope" = 'category' AND "knowledge_articles"."category_id" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"source_type" "knowledge_source_type" NOT NULL,
	"source_url" text,
	"source_note" text,
	"access_level" "knowledge_access_level" DEFAULT 'internal' NOT NULL,
	"confidence_level" integer DEFAULT 3 NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_sources_confidence_check" CHECK ("knowledge_sources"."confidence_level" BETWEEN 1 AND 5)
);
--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "china_price_min" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "china_price_max" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "local_price_min" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "local_price_max" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "quantity_min" integer;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "quantity_max" integer;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "price_unit" varchar(20) DEFAULT 'piece' NOT NULL;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "incoterm" varchar(10);--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "freight_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "customs_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "tax_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "valid_until" date;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "selling_points" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "usage_notes" text;--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "aliases" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "translated_by" varchar(30);--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "product_translations" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit_code" varchar(20) DEFAULT 'piece' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "origin_country" varchar(2) DEFAULT 'CN' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hs_code" varchar(16);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "packaging" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compliance_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "knowledge_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "currency" varchar(3);--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "price_unit" varchar(20) DEFAULT 'piece' NOT NULL;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "market_code" varchar(2);--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "status" "review_status" DEFAULT 'pending_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "last_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "valid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "knowledge_article_translations" ADD CONSTRAINT "knowledge_article_translations_article_id_knowledge_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."knowledge_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_article_translations_lookup_idx" ON "knowledge_article_translations" USING btree ("locale","status");--> statement-breakpoint
CREATE INDEX "knowledge_articles_lookup_idx" ON "knowledge_articles" USING btree ("status","topic","scope","market_code","priority");--> statement-breakpoint
CREATE INDEX "knowledge_sources_access_idx" ON "knowledge_sources" USING btree ("access_level","valid_until");--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD CONSTRAINT "sourcing_references_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD CONSTRAINT "sourcing_references_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

UPDATE "price_snapshots"
SET
  "china_price_min" = "china_reference_price",
  "china_price_max" = "china_reference_price",
  "local_price_min" = "local_retail_price",
  "local_price_max" = "local_retail_price",
  "quantity_min" = "reference_quantity"
WHERE "china_price_min" IS NULL;--> statement-breakpoint

ALTER TABLE "knowledge_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_article_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "public reads public knowledge sources" ON "knowledge_sources"
FOR SELECT TO anon, authenticated
USING ("access_level" = 'public' AND ("valid_until" IS NULL OR "valid_until" > now()));--> statement-breakpoint

CREATE POLICY "public reads approved knowledge articles" ON "knowledge_articles"
FOR SELECT TO anon, authenticated
USING (
  "status" = 'approved'
  AND "valid_from" <= now()
  AND ("valid_until" IS NULL OR "valid_until" > now())
);--> statement-breakpoint

CREATE POLICY "public reads approved knowledge translations" ON "knowledge_article_translations"
FOR SELECT TO anon, authenticated
USING (
  "status" = 'approved'
  AND EXISTS (
    SELECT 1 FROM "knowledge_articles" a
    WHERE a."id" = "article_id"
      AND a."status" = 'approved'
      AND a."valid_from" <= now()
      AND (a."valid_until" IS NULL OR a."valid_until" > now())
  )
);--> statement-breakpoint

CREATE POLICY "staff manage knowledge sources" ON "knowledge_sources"
FOR ALL TO authenticated
USING (public.current_user_is_staff())
WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "staff manage knowledge articles" ON "knowledge_articles"
FOR ALL TO authenticated
USING (public.current_user_is_staff())
WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "staff manage knowledge translations" ON "knowledge_article_translations"
FOR ALL TO authenticated
USING (public.current_user_is_staff())
WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

GRANT SELECT ON public.knowledge_sources, public.knowledge_articles, public.knowledge_article_translations TO anon, authenticated;--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON public.knowledge_sources, public.knowledge_articles, public.knowledge_article_translations TO authenticated;
