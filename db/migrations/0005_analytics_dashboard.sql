CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" varchar(64) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"user_id" uuid,
	"event_name" varchar(40) NOT NULL,
	"product_legacy_id" varchar(80),
	"market_code" varchar(2) NOT NULL,
	"language" varchar(5) NOT NULL,
	"source" varchar(120),
	"path" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_events_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code"),
	CONSTRAINT "analytics_events_name_check" CHECK ("event_name" IN ('page_view', 'product_view', 'consult_open', 'registration', 'inquiry_submit'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_time_idx" ON "analytics_events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_market_time_idx" ON "analytics_events" USING btree ("market_code", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_product_time_idx" ON "analytics_events" USING btree ("product_legacy_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_visitor_time_idx" ON "analytics_events" USING btree ("visitor_id", "created_at");
--> statement-breakpoint
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
GRANT INSERT ON public.analytics_events TO anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON public.analytics_events TO authenticated;
--> statement-breakpoint
CREATE POLICY "public records anonymous analytics" ON "analytics_events"
FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "advisors read scoped analytics" ON "analytics_events"
FOR SELECT TO authenticated
USING (
	EXISTS (
		SELECT 1 FROM public.profiles
		WHERE profiles.user_id = auth.uid()
		AND profiles.status = 'active'
		AND profiles.role IN ('staff', 'reviewer', 'admin')
		AND (profiles.role = 'admin' OR profiles.country_code = analytics_events.market_code)
	)
);
