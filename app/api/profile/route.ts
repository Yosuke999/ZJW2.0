import { NextResponse } from "next/server";
import { z } from "zod";
import { contactChannels } from "@/lib/customer-intents";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  countryCode: z.enum(["kg", "uz"]),
  preferredLanguage: z.enum(["ky", "uz", "ru", "zh"]),
  city: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(80).optional(),
  whatsapp: z.string().trim().max(80).optional(),
  telegram: z.string().trim().max(80).optional(),
  contactPreference: z.enum(contactChannels),
  consent: z.literal(true),
}).superRefine((value, context) => {
  if (!value.phone && !value.whatsapp && !value.telegram) context.addIssue({ code: "custom", path: ["phone"], message: "A contact is required" });
  if (!value[value.contactPreference]) context.addIssue({ code: "custom", path: ["contactPreference"], message: "Preferred contact is empty" });
});

export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_PROFILE" }, { status: 400 });
  const value = parsed.data;
  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    display_name: value.displayName,
    country_code: value.countryCode,
    preferred_language: value.preferredLanguage,
    city: value.city,
    phone: value.phone || null,
    whatsapp: value.whatsapp || null,
    telegram: value.telegram || null,
    contact_preference: value.contactPreference,
    contact_consent_at: now,
    profile_completed_at: now,
    updated_at: now,
  }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
