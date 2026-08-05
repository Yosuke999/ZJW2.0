import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteContext } from "@/lib/supabase/route";

const statusSchema = z.object({
  status: z.enum(["contacted", "qualified", "closed", "spam"]),
});

function isAdvisorRole(role: unknown) {
  return role === "staff" || role === "reviewer" || role === "admin";
}

function canProcessMarket(profile: { role?: unknown; country_code?: unknown } | null, marketCode: unknown) {
  if (profile?.role === "admin") return true;
  return typeof profile?.country_code === "string" && profile.country_code === marketCode;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await createSupabaseRouteContext(request);
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status,country_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isAdvisorRole(profile?.role) || profile?.status !== "active") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });

  const { id } = await params;
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("id,market_code")
    .eq("id", id)
    .maybeSingle();

  if (!inquiry) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!canProcessMarket(profile, inquiry.market_code)) return NextResponse.json({ error: "FORBIDDEN_MARKET" }, { status: 403 });

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status: parsed.data.status,
      assigned_to: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,status")
    .single();

  if (error) return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json(data);
}
