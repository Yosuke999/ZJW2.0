"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { intentTranslations } from "@/data/intent-translations";
import type { CountryCode, Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ country, language, returnTo }: { country: CountryCode; language: Language; returnTo: string }) {
  const copy = intentTranslations[language];
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function syncServerSession(session: { access_token: string; refresh_token: string } | null) {
    if (!session) return { advisor: false };
    const response = await fetch("/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(session),
    }).catch(() => null);
    if (!response?.ok) return { advisor: false };
    const data = await response.json().catch(() => null);
    return { advisor: data?.advisor === true };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();
    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage(copy.authError); setBusy(false); return; }
      const session = await syncServerSession(data.session);
      router.replace(session.advisor ? "/advisor" : returnTo); router.refresh(); return;
    }
    const phone = String(form.get("phone") ?? "").trim();
    const whatsapp = String(form.get("whatsapp") ?? "").trim();
    const telegram = String(form.get("telegram") ?? "").trim();
    const preferred = String(form.get("contactPreference") ?? "phone");
    if (!phone && !whatsapp && !telegram) { setMessage(copy.profileIncomplete); setBusy(false); return; }
    if (!(preferred === "phone" ? phone : preferred === "whatsapp" ? whatsapp : telegram)) { setMessage(copy.profileIncomplete); setBusy(false); return; }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(returnTo)}`,
        data: {
          display_name: String(form.get("displayName") ?? "").trim(), country_code: country,
          preferred_language: language, city: String(form.get("city") ?? "").trim(),
          phone, whatsapp, telegram, contact_preference: preferred, contact_consent: true,
        },
      },
    });
    if (error) { setMessage(copy.authError); setBusy(false); return; }
    if (data.session) {
      await syncServerSession(data.session);
      router.replace(returnTo); router.refresh(); return;
    }
    setMessage(copy.checkEmail); setBusy(false);
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>{copy.loginTab}</button>
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{copy.registerTab}</button>
      </div>
      <p>{copy.authIntro}</p>
      <form onSubmit={submit} className="intent-form">
        {mode === "register" && <>
          <label>{copy.displayName}<input name="displayName" autoComplete="name" minLength={2} required /></label>
          <label>{copy.city}<input name="city" autoComplete="address-level2" minLength={2} required /></label>
          <div className="contact-fields">
            <label>{copy.phone}<input name="phone" type="tel" autoComplete="tel" /></label>
            <label>{copy.whatsapp}<input name="whatsapp" type="tel" /></label>
            <label>{copy.telegram}<input name="telegram" placeholder="@username" /></label>
          </div>
          <label>{copy.preferredContact}<select name="contactPreference" defaultValue="phone"><option value="phone">{copy.phone}</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></label>
          <label className="consent-check"><input name="consent" type="checkbox" required /> <span>{copy.consent}</span></label>
        </>}
        <label>{copy.email}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{copy.password}<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
        <button className="primary-button" disabled={busy}>{busy ? copy.submitting : mode === "login" ? copy.submitLogin : copy.submitRegister}</button>
        {message && <p className="form-message" role="status">{message}</p>}
      </form>
    </div>
  );
}
