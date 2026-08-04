"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { intentTranslations } from "@/data/intent-translations";
import type { CountryCode, Language } from "@/data/types";
import type { CustomerProfile } from "@/lib/customer-intents";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type IntentRow = { id: string; intent_type: string; delivery_city: string | null; custom_product_name: string | null; quantity: number | null; message: string | null; status: string; created_at: string; products: { legacy_id: string } | null };

export function AccountDashboard({ profile, intents, country, language, returnTo }: { profile: CustomerProfile; intents: IntentRow[]; country: CountryCode; language: Language; returnTo: string }) {
  const copy = intentTranslations[language];
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const preferred = profile.contact_preference ?? (profile.phone ? "phone" : profile.whatsapp ? "whatsapp" : "telegram");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const body = { displayName: String(form.get("displayName") ?? ""), countryCode: country, preferredLanguage: language, city: String(form.get("city") ?? ""), phone: String(form.get("phone") ?? ""), whatsapp: String(form.get("whatsapp") ?? ""), telegram: String(form.get("telegram") ?? ""), contactPreference: String(form.get("contactPreference") ?? "phone"), consent: form.get("consent") === "on" };
    const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setMessage(response.ok ? "✓" : copy.authError); setSaving(false);
    if (response.ok) router.refresh();
  }

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace(returnTo); router.refresh();
  }

  return <>
    <div className="account-heading"><div><Link className="back-link" href={returnTo}>← {copy.backToMarket}</Link><h1>{copy.account}</h1></div><button className="text-button" onClick={signOut}>{copy.signOut}</button></div>
    <section className="account-card"><h2>{copy.myProfile}</h2><form className="intent-form" onSubmit={saveProfile}>
      <label>{copy.displayName}<input name="displayName" defaultValue={profile.display_name ?? ""} minLength={2} required /></label>
      <label>{copy.city}<input name="city" defaultValue={profile.city ?? ""} minLength={2} required /></label>
      <div className="contact-fields"><label>{copy.phone}<input name="phone" type="tel" defaultValue={profile.phone ?? ""} /></label><label>{copy.whatsapp}<input name="whatsapp" type="tel" defaultValue={profile.whatsapp ?? ""} /></label><label>{copy.telegram}<input name="telegram" defaultValue={profile.telegram ?? ""} /></label></div>
      <label>{copy.preferredContact}<select name="contactPreference" defaultValue={preferred}><option value="phone">{copy.phone}</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></label>
      <label className="consent-check"><input name="consent" type="checkbox" defaultChecked={Boolean(profile.contact_consent_at)} required /><span>{copy.consent}</span></label>
      <button className="primary-button" disabled={saving}>{saving ? copy.submitting : copy.myProfile}</button>{message && <span role="status">{message}</span>}
    </form></section>
    <section className="account-card"><h2>{copy.myIntents}</h2>{intents.length === 0 ? <p>{copy.noIntents}</p> : <div className="intent-history">{intents.map((item) => <article key={item.id}><div><strong>{copy.intentTypes[item.intent_type] ?? item.intent_type}</strong><span className={`status status-${item.status}`}>{copy.status[item.status] ?? item.status}</span></div><p>{item.products?.legacy_id ?? item.custom_product_name ?? "—"}{item.quantity ? ` · ${item.quantity}` : ""}{item.delivery_city ? ` · ${item.delivery_city}` : ""}</p><time dateTime={item.created_at}>{new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : language === "ru" ? "ru-RU" : language === "uz" ? "uz-UZ" : "ky-KG", { dateStyle: "medium" }).format(new Date(item.created_at))}</time></article>)}</div>}</section>
  </>;
}
