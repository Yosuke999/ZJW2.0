import { z } from "zod";

export const contactChannels = ["phone", "whatsapp", "telegram"] as const;
export type ContactChannel = (typeof contactChannels)[number];

export const inquiryInputSchema = z.object({
  intentType: z.enum(["callback", "purchase_intent"]),
  countryCode: z.enum(["kg", "uz"]),
  language: z.enum(["ky", "uz", "ru", "zh"]),
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
