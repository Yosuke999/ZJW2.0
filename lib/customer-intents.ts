import { z } from "zod";

export const contactChannels = ["phone", "whatsapp", "telegram"] as const;
export type ContactChannel = (typeof contactChannels)[number];

export const inquiryInputSchema = z.object({
  intentType: z.enum(["callback", "purchase_intent"]),
  countryCode: z.enum(["kg", "uz"]),
  language: z.enum(["ky", "uz", "ru", "zh", "en"]),
  productLegacyId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  customProductName: z.string().trim().min(2).max(160).optional(),
  deliveryCity: z.string().trim().min(2).max(120).optional(),
  quantity: z.coerce.number().int().positive().max(100_000_000).optional(),
  message: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(120).optional(),
  website: z.string().max(0).optional(),
}).superRefine((value, context) => {
  if (value.intentType === "purchase_intent" && !value.productLegacyId && !value.customProductName) {
    context.addIssue({ code: "custom", path: ["customProductName"], message: "A product is required" });
  }
});

export type InquiryInput = z.infer<typeof inquiryInputSchema>;

export type CustomerProfile = {
  user_id: string;
  display_name: string | null;
  country_code: string | null;
  preferred_language: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  city: string | null;
  contact_preference: ContactChannel | null;
  contact_consent_at: string | null;
  profile_completed_at: string | null;
};

function metadataString(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataConsent(metadata: Record<string, unknown> | undefined) {
  const value = metadata?.contact_consent;
  return value === true || value === "true";
}

function metadataContactPreference(metadata: Record<string, unknown> | undefined): ContactChannel | null {
  const value = metadata?.contact_preference;
  return value === "phone" || value === "whatsapp" || value === "telegram" ? value : null;
}

export function profileFromUserMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined,
  defaults: { countryCode: string | null; language: string | null },
): CustomerProfile {
  return {
    user_id: userId,
    display_name: metadataString(metadata, "display_name") ?? metadataString(metadata, "name"),
    country_code: metadataString(metadata, "country_code") ?? defaults.countryCode,
    preferred_language: metadataString(metadata, "preferred_language") ?? defaults.language,
    phone: metadataString(metadata, "phone"),
    whatsapp: metadataString(metadata, "whatsapp"),
    telegram: metadataString(metadata, "telegram"),
    city: metadataString(metadata, "city"),
    contact_preference: metadataContactPreference(metadata),
    contact_consent_at: metadataConsent(metadata) ? new Date().toISOString() : null,
    profile_completed_at: null,
  };
}

export function mergeCustomerProfile(profile: CustomerProfile | null, fallback: CustomerProfile): CustomerProfile {
  return {
    user_id: profile?.user_id ?? fallback.user_id,
    display_name: profile?.display_name?.trim() ? profile.display_name : fallback.display_name,
    country_code: profile?.country_code ?? fallback.country_code,
    preferred_language: profile?.preferred_language ?? fallback.preferred_language,
    phone: profile?.phone?.trim() ? profile.phone : fallback.phone,
    whatsapp: profile?.whatsapp?.trim() ? profile.whatsapp : fallback.whatsapp,
    telegram: profile?.telegram?.trim() ? profile.telegram : fallback.telegram,
    city: profile?.city?.trim() ? profile.city : fallback.city,
    contact_preference: profile?.contact_preference ?? fallback.contact_preference,
    contact_consent_at: profile?.contact_consent_at ?? fallback.contact_consent_at,
    profile_completed_at: profile?.profile_completed_at ?? fallback.profile_completed_at,
  };
}

export function profileContact(profile: CustomerProfile) {
  const preferred = profile.contact_preference;
  if (preferred && profile[preferred]) return { channel: preferred, contact: profile[preferred] as string };
  for (const channel of contactChannels) {
    if (profile[channel]) return { channel, contact: profile[channel] as string };
  }
  return null;
}

export function isProfileComplete(profile: CustomerProfile) {
  return Boolean(profile.display_name?.trim() && profile.city?.trim() && profile.contact_consent_at && profileContact(profile));
}

export function safeReturnPath(value: string | undefined, fallback = "/kg/zh") {
  return value && /^\/[a-z0-9_?&=/%.-]*$/i.test(value) && !value.startsWith("//") ? value : fallback;
}
