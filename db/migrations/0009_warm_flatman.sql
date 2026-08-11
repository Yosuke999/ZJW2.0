CREATE TYPE "public"."availability_status" AS ENUM('unknown', 'available_on_request', 'limited', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."freight_cost_basis" AS ENUM('per_kg', 'per_cubic_meter', 'per_shipment', 'quote_only');--> statement-breakpoint
CREATE TYPE "public"."transport_mode" AS ENUM('road', 'rail', 'multimodal', 'air');--> statement-breakpoint
CREATE TABLE "exchange_rate_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" varchar(3) NOT NULL,
	"quote_currency" varchar(3) NOT NULL,
	"rate" numeric(24, 10) NOT NULL,
	"source_id" uuid,
	"captured_at" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"status" "price_status" DEFAULT 'pending_review' NOT NULL,
	"created_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_rate_snapshots_rate_check" CHECK ("exchange_rate_snapshots"."rate" > 0 AND "exchange_rate_snapshots"."base_currency" <> "exchange_rate_snapshots"."quote_currency")
);
--> statement-breakpoint
CREATE TABLE "product_market_fact_translations" (
	"fact_id" uuid NOT NULL,
	"locale" varchar(5) NOT NULL,
	"availability_note" text,
	"warranty_note" text,
	"return_note" text,
	"compliance_note" text,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_market_fact_translations_fact_id_locale_pk" PRIMARY KEY("fact_id","locale")
);
--> statement-breakpoint
CREATE TABLE "product_market_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"market_code" varchar(2) NOT NULL,
	"availability" "availability_status" DEFAULT 'unknown' NOT NULL,
	"minimum_order_quantity" integer,
	"maximum_order_quantity" integer,
	"sample_available" boolean,
	"production_days_min" integer,
	"production_days_max" integer,
	"source_id" uuid,
	"confirmed_at" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_market_facts_quantity_check" CHECK (
    ("product_market_facts"."minimum_order_quantity" IS NULL OR "product_market_facts"."minimum_order_quantity" > 0)
    AND ("product_market_facts"."maximum_order_quantity" IS NULL OR "product_market_facts"."maximum_order_quantity" > 0)
    AND ("product_market_facts"."minimum_order_quantity" IS NULL OR "product_market_facts"."maximum_order_quantity" IS NULL OR "product_market_facts"."minimum_order_quantity" <= "product_market_facts"."maximum_order_quantity")
  ),
	CONSTRAINT "product_market_facts_production_days_check" CHECK (
    ("product_market_facts"."production_days_min" IS NULL OR "product_market_facts"."production_days_min" >= 0)
    AND ("product_market_facts"."production_days_max" IS NULL OR "product_market_facts"."production_days_max" >= 0)
    AND ("product_market_facts"."production_days_min" IS NULL OR "product_market_facts"."production_days_max" IS NULL OR "product_market_facts"."production_days_min" <= "product_market_facts"."production_days_max")
  )
);
--> statement-breakpoint
CREATE TABLE "shipping_route_translations" (
	"route_id" uuid NOT NULL,
	"locale" varchar(5) NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"limitations" text,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_route_translations_route_id_locale_pk" PRIMARY KEY("route_id","locale")
);
--> statement-breakpoint
CREATE TABLE "shipping_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"origin_country" varchar(2) NOT NULL,
	"origin_city" text,
	"destination_market_code" varchar(2) NOT NULL,
	"destination_city" text,
	"transport_mode" "transport_mode" NOT NULL,
	"transit_days_min" integer,
	"transit_days_max" integer,
	"cost_basis" "freight_cost_basis" DEFAULT 'quote_only' NOT NULL,
	"cost_min" numeric(18, 4),
	"cost_max" numeric(18, 4),
	"currency" varchar(3),
	"freight_unit" varchar(20),
	"customs_included" boolean,
	"source_id" uuid,
	"confirmed_at" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"status" "review_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_routes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "shipping_routes_transit_days_check" CHECK (
    ("shipping_routes"."transit_days_min" IS NULL OR "shipping_routes"."transit_days_min" >= 0)
    AND ("shipping_routes"."transit_days_max" IS NULL OR "shipping_routes"."transit_days_max" >= 0)
    AND ("shipping_routes"."transit_days_min" IS NULL OR "shipping_routes"."transit_days_max" IS NULL OR "shipping_routes"."transit_days_min" <= "shipping_routes"."transit_days_max")
  ),
	CONSTRAINT "shipping_routes_cost_check" CHECK (
    ("shipping_routes"."cost_min" IS NULL OR "shipping_routes"."cost_min" >= 0)
    AND ("shipping_routes"."cost_max" IS NULL OR "shipping_routes"."cost_max" >= 0)
    AND ("shipping_routes"."cost_min" IS NULL OR "shipping_routes"."cost_max" IS NULL OR "shipping_routes"."cost_min" <= "shipping_routes"."cost_max")
  )
);
--> statement-breakpoint
ALTER TABLE "exchange_rate_snapshots" ADD CONSTRAINT "exchange_rate_snapshots_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_market_fact_translations" ADD CONSTRAINT "product_market_fact_translations_fact_id_product_market_facts_id_fk" FOREIGN KEY ("fact_id") REFERENCES "public"."product_market_facts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_market_facts" ADD CONSTRAINT "product_market_facts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_market_facts" ADD CONSTRAINT "product_market_facts_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_market_facts" ADD CONSTRAINT "product_market_facts_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_route_translations" ADD CONSTRAINT "shipping_route_translations_route_id_shipping_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."shipping_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_routes" ADD CONSTRAINT "shipping_routes_destination_market_code_markets_code_fk" FOREIGN KEY ("destination_market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_routes" ADD CONSTRAINT "shipping_routes_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exchange_rate_snapshots_lookup_idx" ON "exchange_rate_snapshots" USING btree ("base_currency","quote_currency","status","captured_at");--> statement-breakpoint
CREATE INDEX "product_market_fact_translations_lookup_idx" ON "product_market_fact_translations" USING btree ("locale","status");--> statement-breakpoint
CREATE INDEX "product_market_facts_lookup_idx" ON "product_market_facts" USING btree ("product_id","market_code","status","confirmed_at");--> statement-breakpoint
CREATE INDEX "shipping_route_translations_lookup_idx" ON "shipping_route_translations" USING btree ("locale","status");--> statement-breakpoint
CREATE INDEX "shipping_routes_lookup_idx" ON "shipping_routes" USING btree ("destination_market_code","transport_mode","status","confirmed_at");
--> statement-breakpoint
ALTER TABLE "product_market_facts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_market_fact_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_routes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_route_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "exchange_rate_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "public reads approved product market facts" ON "product_market_facts"
FOR SELECT TO anon, authenticated
USING ("status" = 'approved' AND ("valid_until" IS NULL OR "valid_until" > now()));--> statement-breakpoint

CREATE POLICY "public reads approved product market fact translations" ON "product_market_fact_translations"
FOR SELECT TO anon, authenticated
USING (
  "status" = 'approved'
  AND EXISTS (
    SELECT 1 FROM "product_market_facts" f
    WHERE f."id" = "fact_id"
      AND f."status" = 'approved'
      AND (f."valid_until" IS NULL OR f."valid_until" > now())
  )
);--> statement-breakpoint

CREATE POLICY "public reads approved shipping routes" ON "shipping_routes"
FOR SELECT TO anon, authenticated
USING ("status" = 'approved' AND ("valid_until" IS NULL OR "valid_until" > now()));--> statement-breakpoint

CREATE POLICY "public reads approved shipping route translations" ON "shipping_route_translations"
FOR SELECT TO anon, authenticated
USING (
  "status" = 'approved'
  AND EXISTS (
    SELECT 1 FROM "shipping_routes" r
    WHERE r."id" = "route_id"
      AND r."status" = 'approved'
      AND (r."valid_until" IS NULL OR r."valid_until" > now())
  )
);--> statement-breakpoint

CREATE POLICY "public reads verified exchange rates" ON "exchange_rate_snapshots"
FOR SELECT TO anon, authenticated
USING ("status" = 'verified' AND ("valid_until" IS NULL OR "valid_until" > now()));--> statement-breakpoint

CREATE POLICY "staff manage product market facts" ON "product_market_facts"
FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage product market fact translations" ON "product_market_fact_translations"
FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage shipping routes" ON "shipping_routes"
FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage shipping route translations" ON "shipping_route_translations"
FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage exchange rates" ON "exchange_rate_snapshots"
FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

GRANT SELECT ON public.product_market_facts, public.product_market_fact_translations, public.shipping_routes, public.shipping_route_translations, public.exchange_rate_snapshots TO anon, authenticated;--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON public.product_market_facts, public.product_market_fact_translations, public.shipping_routes, public.shipping_route_translations, public.exchange_rate_snapshots TO authenticated;
