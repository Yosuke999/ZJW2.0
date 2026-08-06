import { NextResponse } from "next/server";
import { inquiryInputSchema, isProfileComplete, mergeCustomerProfile, profileContact, profileFromUserMetadata, type CustomerProfile } from "@/lib/customer-intents";
import { createSupabaseRouteContext } from "@/lib/supabase/route";

export async function POST(request: Request) {
  const { supabase, user } = await createSupabaseRouteContext(request);
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const parsed = inquiryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  const input = parsed.data;

  const { data: rawProfile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id,display_name,country_code,preferred_language,phone,whatsapp,telegram,city,contact_preference,contact_consent_at,profile_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const fallback = profileFromUserMetadata(user.id, user.user_metadata, { countryCode: input.countryCode, language: input.language });
  const profile = mergeCustomerProfile((rawProfile as CustomerProfile | null) ?? null, fallback);
  if (profileError || !isProfileComplete(profile)) {
    return NextResponse.json({ error: "PROFILE_INCOMPLETE" }, { status: 409 });
  }
  const contact = profileContact(profile)!;

  let productId: string | null = null;
  if (input.productLegacyId) {
    const { data: product } = await supabase.from("products").select("id").eq("legacy_id", input.productLegacyId).eq("status", "active").maybeSingle();
    if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
    productId = product.id as string;
  }

  const { data, error } = await supabase.from("inquiries").insert({
    user_id: user.id,
    product_id: productId,
    intent_type: input.intentType,
    delivery_city: input.deliveryCity ?? profile.city,
    custom_product_name: input.customProductName ?? null,
    market_code: input.countryCode,
    language: input.language,
    name: profile.display_name,
    email: user.email ?? null,
    contact: contact.contact,
    channel: contact.channel,
    quantity: input.quantity ?? null,
    message: input.message ?? null,
    source: input.source ?? "website",
    consent_at: profile.contact_consent_at,
  }).select("id,status").single();

  if (error) return NextResponse.json({ error: "SUBMIT_FAILED" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
