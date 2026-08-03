CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'in_review', 'need_more_information', 'quoted', 'approved', 'rejected', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'contacted', 'qualified', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."price_status" AS ENUM('demo', 'pending_review', 'verified', 'stale');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('draft', 'pending_review', 'approved', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'staff', 'reviewer', 'admin');--> statement-breakpoint
CREATE TABLE "application_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"image_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"category_id" uuid NOT NULL,
	"locale" varchar(5) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "review_status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_translations_category_id_locale_pk" PRIMARY KEY("category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "design_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"market_code" varchar(2),
	"category_id" uuid,
	"application_type" varchar(40) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_quantity" integer,
	"budget_min" numeric(18, 2),
	"budget_max" numeric(18, 2),
	"currency" varchar(3),
	"deadline" date,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"assigned_to" uuid,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "design_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"product_id" uuid,
	"market_code" varchar(2),
	"language" varchar(5) NOT NULL,
	"name" text,
	"contact" text NOT NULL,
	"channel" varchar(30) NOT NULL,
	"quantity" integer,
	"budget" numeric(18, 2),
	"message" text,
	"source" text,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"consent_at" timestamp with time zone,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"currency" varchar(3) NOT NULL,
	"default_language" varchar(5) NOT NULL,
	"contact_phone" text,
	"telegram_url" text,
	"whatsapp_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"market_code" varchar(2) NOT NULL,
	"local_retail_price" numeric(18, 2) NOT NULL,
	"china_reference_price" numeric(18, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"reference_quantity" integer NOT NULL,
	"confirmed_at" date NOT NULL,
	"status" "price_status" DEFAULT 'pending_review' NOT NULL,
	"source_note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"owned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"product_id" uuid NOT NULL,
	"locale" varchar(5) NOT NULL,
	"name" text NOT NULL,
	"specification" text NOT NULL,
	"description" text,
	"status" "review_status" DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_translations_product_id_locale_pk" PRIMARY KEY("product_id","locale")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text NOT NULL,
	"slug" text NOT NULL,
	"primary_image_url" text NOT NULL,
	"image_status" varchar(20) DEFAULT 'placeholder' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_legacy_id_unique" UNIQUE("legacy_id"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"country_code" varchar(2),
	"preferred_language" varchar(5),
	"phone" text,
	"telegram" text,
	"whatsapp" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_name" text,
	"source_url" text,
	"source_sku" text,
	"minimum_order_quantity" integer,
	"purchase_price_min" numeric(18, 2),
	"purchase_price_max" numeric(18, 2),
	"captured_at" timestamp with time zone,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_attachments" ADD CONSTRAINT "application_attachments_application_id_design_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."design_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_design_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."design_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_applications" ADD CONSTRAINT "design_applications_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_applications" ADD CONSTRAINT "design_applications_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_market_code_markets_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_country_code_markets_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."markets"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD CONSTRAINT "sourcing_references_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_attachments_application_idx" ON "application_attachments" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "application_status_history_idx" ON "application_status_history" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id","display_order");--> statement-breakpoint
CREATE INDEX "category_translations_locale_idx" ON "category_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "design_applications_user_idx" ON "design_applications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "design_applications_queue_idx" ON "design_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "inquiries_queue_idx" ON "inquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "inquiries_user_idx" ON "inquiries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "price_snapshots_latest_idx" ON "price_snapshots" USING btree ("product_id","market_code","status","confirmed_at");--> statement-breakpoint
CREATE INDEX "product_categories_category_idx" ON "product_categories" USING btree ("category_id","product_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id","display_order");--> statement-breakpoint
CREATE INDEX "product_translations_locale_idx" ON "product_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "products_listing_idx" ON "products" USING btree ("status","featured","display_order");--> statement-breakpoint
CREATE INDEX "sourcing_references_product_idx" ON "sourcing_references" USING btree ("product_id","captured_at");--> statement-breakpoint

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assigned_to_profiles_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("user_id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "design_applications" ADD CONSTRAINT "design_applications_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "design_applications" ADD CONSTRAINT "design_applications_assigned_to_profiles_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("user_id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "application_attachments" ADD CONSTRAINT "application_attachments_uploaded_by_profiles_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("user_id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_profiles_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("user_id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "sourcing_references" ADD CONSTRAINT "sourcing_references_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_profiles_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('staff', 'reviewer', 'admin')
      AND status = 'active'
  );
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();--> statement-breakpoint

ALTER TABLE markets ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE products ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE sourcing_references ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE design_applications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "public reads active markets" ON markets FOR SELECT TO anon, authenticated USING (active);--> statement-breakpoint
CREATE POLICY "public reads active categories" ON categories FOR SELECT TO anon, authenticated USING (status = 'active');--> statement-breakpoint
CREATE POLICY "public reads approved category translations" ON category_translations FOR SELECT TO anon, authenticated USING (status = 'approved');--> statement-breakpoint
CREATE POLICY "public reads active products" ON products FOR SELECT TO anon, authenticated USING (status = 'active');--> statement-breakpoint
CREATE POLICY "public reads approved product translations" ON product_translations FOR SELECT TO anon, authenticated USING (status = 'approved');--> statement-breakpoint
CREATE POLICY "public reads product category assignments" ON product_categories FOR SELECT TO anon, authenticated USING (true);--> statement-breakpoint
CREATE POLICY "public reads product images" ON product_images FOR SELECT TO anon, authenticated USING (true);--> statement-breakpoint
CREATE POLICY "public reads published prices" ON price_snapshots FOR SELECT TO anon, authenticated USING (status IN ('demo', 'verified'));--> statement-breakpoint

CREATE POLICY "users read own profile" ON profiles FOR SELECT TO authenticated USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "users update own profile" ON profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'active') WITH CHECK (user_id = auth.uid() AND status = 'active' AND role = public.current_user_role());--> statement-breakpoint
CREATE POLICY "staff manage profiles" ON profiles FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "users create own inquiries" ON inquiries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "users read own inquiries" ON inquiries FOR SELECT TO authenticated USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "staff manage inquiries" ON inquiries FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "users read own applications" ON design_applications FOR SELECT TO authenticated USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "users create own applications" ON design_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'draft');--> statement-breakpoint
CREATE POLICY "users update own drafts" ON design_applications FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'draft') WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'submitted'));--> statement-breakpoint
CREATE POLICY "staff manage applications" ON design_applications FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "users read own attachments" ON application_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM design_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "users add attachments to drafts" ON application_attachments FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM design_applications a WHERE a.id = application_id AND a.user_id = auth.uid() AND a.status = 'draft'));--> statement-breakpoint
CREATE POLICY "users remove attachments from drafts" ON application_attachments FOR DELETE TO authenticated USING (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM design_applications a WHERE a.id = application_id AND a.user_id = auth.uid() AND a.status = 'draft'));--> statement-breakpoint
CREATE POLICY "staff manage attachments" ON application_attachments FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "users read own status history" ON application_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM design_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "staff manage status history" ON application_status_history FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

CREATE POLICY "staff manage markets" ON markets FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage categories" ON categories FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage category translations" ON category_translations FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage products" ON products FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage product translations" ON product_translations FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage product categories" ON product_categories FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage product images" ON product_images FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage prices" ON price_snapshots FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff manage sourcing references" ON sourcing_references FOR ALL TO authenticated USING (public.current_user_is_staff()) WITH CHECK (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff read audit logs" ON audit_logs FOR SELECT TO authenticated USING (public.current_user_is_staff());--> statement-breakpoint
CREATE POLICY "staff create audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (public.current_user_is_staff());--> statement-breakpoint

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-attachments',
  'application-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

CREATE POLICY "users read own stored attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'application-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);--> statement-breakpoint
CREATE POLICY "users upload own stored attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'application-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);--> statement-breakpoint
CREATE POLICY "users remove own stored attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'application-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);--> statement-breakpoint
CREATE POLICY "staff manage stored attachments" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'application-attachments' AND public.current_user_is_staff()) WITH CHECK (bucket_id = 'application-attachments' AND public.current_user_is_staff());
