import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteContext } from "@/lib/supabase/route";

const analyticsInput = z.object({
  visitorId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  sessionId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  eventName: z.enum(["page_view", "product_view", "consult_open", "registration", "inquiry_submit"]),
  productLegacyId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  marketCode: z.enum(["kg", "uz"]),
  language: z.enum(["ky", "uz", "ru", "zh", "en"]),
  source: z.string().trim().max(120).optional(),
  path: z.string().trim().max(240).optional(),
});

export async function POST(request: Request) {
  const parsed = analyticsInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
  const { supabase, user } = await createSupabaseRouteContext(request);
  const value = parsed.data;
  const { error } = await supabase.from("analytics_events").insert({
    visitor_id: value.visitorId,
    session_id: value.sessionId,
    user_id: user?.id ?? null,
    event_name: value.eventName,
    product_legacy_id: value.productLegacyId ?? null,
    market_code: value.marketCode,
    language: value.language,
    source: value.source ?? null,
    path: value.path ?? null,
  });
  if (error) return NextResponse.json({ error: "EVENT_NOT_RECORDED" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
