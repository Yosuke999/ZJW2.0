CREATE TYPE "public"."inquiry_intent_type" AS ENUM('callback', 'purchase_intent');--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "intent_type" "inquiry_intent_type" DEFAULT 'callback' NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "delivery_city" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "custom_product_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "contact_preference" varchar(20);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "contact_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_contact_preference_check" CHECK ("contact_preference" IS NULL OR "contact_preference" IN ('phone', 'whatsapp', 'telegram'));--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_present boolean;
BEGIN
  contact_present := NULLIF(NEW.raw_user_meta_data ->> 'phone', '') IS NOT NULL
    OR NULLIF(NEW.raw_user_meta_data ->> 'whatsapp', '') IS NOT NULL
    OR NULLIF(NEW.raw_user_meta_data ->> 'telegram', '') IS NOT NULL;

  INSERT INTO public.profiles (
    user_id, display_name, country_code, preferred_language, phone, whatsapp,
    telegram, city, contact_preference, contact_consent_at, profile_completed_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name'),
    CASE WHEN NEW.raw_user_meta_data ->> 'country_code' IN ('kg', 'uz') THEN NEW.raw_user_meta_data ->> 'country_code' ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'preferred_language' IN ('ky', 'uz', 'ru', 'zh') THEN NEW.raw_user_meta_data ->> 'preferred_language' ELSE NULL END,
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'whatsapp', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'telegram', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'city', ''),
    CASE WHEN NEW.raw_user_meta_data ->> 'contact_preference' IN ('phone', 'whatsapp', 'telegram') THEN NEW.raw_user_meta_data ->> 'contact_preference' ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'contact_consent' = 'true' THEN now() ELSE NULL END,
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name') IS NOT NULL
        AND contact_present
        AND NULLIF(NEW.raw_user_meta_data ->> 'city', '') IS NOT NULL
        AND NEW.raw_user_meta_data ->> 'contact_consent' = 'true'
      THEN now() ELSE NULL
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    country_code = EXCLUDED.country_code,
    preferred_language = EXCLUDED.preferred_language,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    telegram = EXCLUDED.telegram,
    city = EXCLUDED.city,
    contact_preference = EXCLUDED.contact_preference,
    contact_consent_at = EXCLUDED.contact_consent_at,
    profile_completed_at = EXCLUDED.profile_completed_at,
    updated_at = now();
  RETURN NEW;
END;
$$;
