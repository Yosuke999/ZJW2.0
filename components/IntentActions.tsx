"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { intentTranslations } from "@/data/intent-translations";
import type { CountryCode, Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isProfileComplete, mergeCustomerProfile, profileFromUserMetadata, type CustomerProfile } from "@/lib/customer-intents";

export function IntentActions({ country, language, productId, source }: { country: CountryCode; language: Language; productId: string | null; source?: string }) {
  const copy = intentTranslations[language];
  const [authState, setAuthState] = useState<"loading" | "guest" | "ready" | "incomplete">("loading");
  const [mode, setMode] = useState<"choices" | "purchase" | "success">("choices");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [city, setCity] = useState("");
  const marketPath = language === (country === "kg" ? "ky" : "uz") ? `/${country}` : `/${country}/${language}`;
  const intentQuery = new URLSearchParams({ intent: "purchase" });
  if (productId) intentQuery.set("product", productId);
  if (source) intentQuery.set("src", source);
  const returnTo = `${marketPath}?${intentQuery}`;
  const authHref = `/auth?country=${country}&language=${language}&returnTo=${encodeURIComponent(returnTo)}`;
  const accountHref = `/account?country=${country}&language=${language}&returnTo=${encodeURIComponent(returnTo)}`;

  async function readCurrentProfile() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("user_id,display_name,country_code,preferred_language,phone,whatsapp,telegram,city,contact_preference,contact_consent_at,profile_completed_at").eq("user_id", user.id).maybeSingle();
    const fallback = profileFromUserMetadata(user.id, user.user_metadata, { countryCode: country, language });
    return mergeCustomerProfile((profile as CustomerProfile | null) ?? null, fallback);
  }

  useEffect(() => {
    let active = true;
    readCurrentProfile().then((typed) => {
      if (!active) return;
      if (!typed) { setAuthState("guest"); return; }
      setCity(typed.city ?? "");
      setAuthState(isProfileComplete(typed) ? "ready" : "incomplete");
    });
    return () => { active = false; };
  }, []);

  async function postInquiry(payload: Record<string, unknown>) {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (session?.access_token) headers.authorization = `Bearer ${session.access_token}`;
    return fetch("/api/inquiries", { method: "POST", headers, body: JSON.stringify({ countryCode: country, language, productLegacyId: productId ?? undefined, source: source ?? "website", website: "", ...payload }) });
  }

  async function send(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    let response = await postInquiry(payload);
    if (response.status === 409) {
      const typed = await readCurrentProfile();
      if (typed && isProfileComplete(typed)) response = await postInquiry(payload);
    }
    const result = await response.json().catch(() => ({}));
    if (response.ok) setMode("success");
    else if (response.status === 401) setAuthState("guest");
    else if (response.status === 409) setAuthState("incomplete");
    else setError(result.error ?? "SUBMIT_FAILED");
    setBusy(false);
  }

  async function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await send({ intentType: "purchase_intent", customProductName: productId ? undefined : String(form.get("customProductName") ?? ""), deliveryCity: String(form.get("deliveryCity") ?? ""), quantity: form.get("quantity") ? Number(form.get("quantity")) : undefined, message: String(form.get("message") ?? "") });
  }

  if (authState === "loading") return <div className="intent-loading" aria-live="polite">…</div>;
  if (authState === "guest") return <div className="intent-login"><p>{copy.signInToContinue}</p><Link className="primary-button" href={authHref}>{copy.signInRequired}</Link></div>;
  if (authState === "incomplete") return <div className="intent-login"><p>{copy.profileIncomplete}</p><Link className="primary-button" href={accountHref}>{copy.myProfile}</Link></div>;
  if (mode === "success") return <div className="intent-success" role="status"><strong>✓</strong><p>{copy.intentSuccess}</p></div>;
  if (mode === "purchase") return <form className="intent-form compact" onSubmit={submitPurchase}>
    {!productId && <label>{copy.customProduct}<input name="customProductName" minLength={2} maxLength={160} required /></label>}
    <label>{copy.quantity}<input name="quantity" type="number" min={1} inputMode="numeric" /></label>
    <label>{copy.deliveryCity}<input name="deliveryCity" defaultValue={city} minLength={2} required /></label>
    <label>{copy.note}<textarea name="message" maxLength={1000} rows={3} /></label>
    <div className="intent-form-actions"><button type="button" className="secondary-button" onClick={() => setMode("choices")}>←</button><button className="primary-button" disabled={busy}>{busy ? copy.submitting : copy.submitIntent}</button></div>
    {error && <p className="form-message" role="alert">{error}</p>}
  </form>;
  return <div className="intent-choices">
    <button type="button" onClick={() => send({ intentType: "callback" })} disabled={busy}><strong>{copy.callback}</strong><small>{copy.callbackHint}</small></button>
    <button type="button" onClick={() => setMode("purchase")}><strong>{copy.purchaseIntent}</strong><small>{copy.purchaseHint}</small></button>
    {error && <p className="form-message" role="alert">{error}</p>}
  </div>;
}
