"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { intentTranslations } from "@/data/intent-translations";
import type { CountryCode, InquiryPrefill, Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isProfileComplete, mergeCustomerProfile, profileFromUserMetadata, type CustomerProfile } from "@/lib/customer-intents";
import { trackEvent } from "@/lib/analytics";

const reviewCopy: Record<Language, { imported: string; confirm: string }> = {
  zh: { imported: "以下信息已从客服对话带入，请检查后再提交。", confirm: "我已检查以上信息，确认提交给当地顾问。" },
  ru: { imported: "Данные перенесены из чата. Проверьте их перед отправкой.", confirm: "Я проверил(а) данные и подтверждаю отправку местному консультанту." },
  ky: { imported: "Маалымат чаттан алынды. Жөнөтүүдөн мурун текшериңиз.", confirm: "Маалыматты текшердим жана жергиликтүү кеңешчиге жөнөтүүнү ырастайм." },
  uz: { imported: "Ma’lumotlar chatdan olindi. Yuborishdan oldin tekshiring.", confirm: "Ma’lumotlarni tekshirdim va mahalliy maslahatchiga yuborishni tasdiqlayman." },
  en: { imported: "These details were brought in from the chat. Review them before submitting.", confirm: "I have reviewed the details and confirm submission to the local advisor." },
};

export function IntentActions({ country, language, productId, source, prefill }: { country: CountryCode; language: Language; productId: string | null; source?: string; prefill?: InquiryPrefill | null }) {
  const copy = intentTranslations[language];
  const review = reviewCopy[language];
  const [authState, setAuthState] = useState<"loading" | "guest" | "ready" | "incomplete">("loading");
  const [mode, setMode] = useState<"choices" | "purchase" | "success">(prefill ? "purchase" : "choices");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [city, setCity] = useState(prefill?.destinationCity ?? "");
  const [quantity, setQuantity] = useState(prefill?.quantity ? String(prefill.quantity) : "");
  const [restoredPrefill, setRestoredPrefill] = useState<InquiryPrefill | null>(null);
  const activePrefill = prefill ?? restoredPrefill;
  const marketPath = language === (country === "kg" ? "ky" : "uz") ? `/${country}` : `/${country}/${language}`;
  const intentQuery = new URLSearchParams({ intent: "purchase" });
  if (productId) intentQuery.set("product", productId);
  if (source) intentQuery.set("src", source);
  const returnTo = `${marketPath}?${intentQuery}`;
  const authHref = `/auth?country=${country}&language=${language}&returnTo=${encodeURIComponent(returnTo)}`;
  const accountHref = `/account?country=${country}&language=${language}&returnTo=${encodeURIComponent(returnTo)}`;

  const readCurrentProfile = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("user_id,display_name,country_code,preferred_language,phone,whatsapp,telegram,city,contact_preference,contact_consent_at,profile_completed_at").eq("user_id", user.id).maybeSingle();
    const fallback = profileFromUserMetadata(user.id, user.user_metadata, { countryCode: country, language });
    return mergeCustomerProfile((profile as CustomerProfile | null) ?? null, fallback);
  }, [country, language]);

  useEffect(() => {
    let active = true;
    readCurrentProfile().then((typed) => {
      if (!active) return;
      if (!typed) { setAuthState("guest"); return; }
      setCity((current) => current || typed.city || "");
      setAuthState(isProfileComplete(typed) ? "ready" : "incomplete");
    });
    return () => { active = false; };
  }, [readCurrentProfile]);

  useEffect(() => {
    if (prefill || typeof window === "undefined") return;
    const raw = sessionStorage.getItem("ai-inquiry-prefill");
    if (!raw) return;
    let stored: InquiryPrefill | null = null;
    try {
      const parsed = JSON.parse(raw) as Partial<InquiryPrefill>;
      if ((parsed.productId === null || typeof parsed.productId === "string") && (parsed.quantity === null || (typeof parsed.quantity === "number" && parsed.quantity > 0)) && typeof parsed.destinationCity === "string") {
        stored = { productId: parsed.productId, quantity: parsed.quantity, destinationCity: parsed.destinationCity.slice(0, 120) };
      }
    } catch { sessionStorage.removeItem("ai-inquiry-prefill"); }
    if (!stored || stored.productId !== productId) return;
    const timer = window.setTimeout(() => {
      setRestoredPrefill(stored);
      setQuantity(stored?.quantity ? String(stored.quantity) : "");
      setCity(stored?.destinationCity ?? "");
      setMode("purchase");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [prefill, productId]);

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
    if (response.ok) {
      sessionStorage.removeItem("ai-inquiry-prefill");
      trackEvent("inquiry_submitted", { country, language, productId });
      setMode("success");
    }
    else if (response.status === 401) setAuthState("guest");
    else if (response.status === 409) setAuthState("incomplete");
    else setError(copy.authError);
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
    {activePrefill && <p className="intent-prefill-note">{review.imported}</p>}
    {!productId && <label>{copy.customProduct}<input name="customProductName" minLength={2} maxLength={160} required /></label>}
    <label>{copy.quantity}<input name="quantity" type="number" min={1} inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
    <label>{copy.deliveryCity}<input name="deliveryCity" value={city} onChange={(event) => setCity(event.target.value)} minLength={2} required /></label>
    <label>{copy.note}<textarea name="message" maxLength={1000} rows={3} /></label>
    <label className="intent-review-confirm"><input name="reviewConfirmed" type="checkbox" required /><span>{review.confirm}</span></label>
    <div className="intent-form-actions"><button type="button" className="secondary-button" onClick={() => setMode("choices")}>←</button><button className="primary-button" disabled={busy}>{busy ? copy.submitting : copy.submitIntent}</button></div>
    {error && <p className="form-message" role="alert">{error}</p>}
  </form>;
  return <div className="intent-choices">
    <button type="button" onClick={() => send({ intentType: "callback" })} disabled={busy}><strong>{copy.callback}</strong><small>{copy.callbackHint}</small></button>
    <button type="button" onClick={() => setMode("purchase")}><strong>{copy.purchaseIntent}</strong><small>{copy.purchaseHint}</small></button>
    {error && <p className="form-message" role="alert">{error}</p>}
  </div>;
}
