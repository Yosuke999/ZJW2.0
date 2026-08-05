import { NextResponse } from "next/server";
import { z } from "zod";
import { isProfileComplete, mergeCustomerProfile, profileFromUserMetadata, type CustomerProfile } from "@/lib/customer-intents";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sessionSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
}).transform((value) => ({
  accessToken: value.accessToken ?? value.access_token,
  refreshToken: value.refreshToken ?? value.refresh_token,
})).refine((value) => Boolean(value.accessToken && value.refreshToken), { message: "Missing session tokens" });

export async function POST(request: Request) {
  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_SESSION" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.setSession({
    access_token: parsed.data.accessToken!,
    refresh_token: parsed.data.refreshToken!,
  });

  if (error) return NextResponse.json({ error: "SESSION_SYNC_FAILED", detail: error.message }, { status: 200 });
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id,display_name,country_code,preferred_language,phone,whatsapp,telegram,city,contact_preference,contact_consent_at,profile_completed_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const fallback = profileFromUserMetadata(user.id, user.user_metadata, { countryCode: null, language: null });
    const merged = mergeCustomerProfile((profile as CustomerProfile | null) ?? null, fallback);
    if (!profile || isProfileComplete(merged)) {
      const now = new Date().toISOString();
      await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: merged.display_name,
        country_code: merged.country_code,
        preferred_language: merged.preferred_language,
        phone: merged.phone,
        whatsapp: merged.whatsapp,
        telegram: merged.telegram,
        city: merged.city,
        contact_preference: merged.contact_preference,
        contact_consent_at: merged.contact_consent_at,
        profile_completed_at: isProfileComplete(merged) ? merged.profile_completed_at ?? now : null,
        updated_at: now,
      }, { onConflict: "user_id" });
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
