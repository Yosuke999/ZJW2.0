"use client";

import { useMemo, useState } from "react";
import type { AdvisorCopy } from "@/data/advisor-translations";
import type { Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AdvisorInquiry = {
  id: string;
  intent_type: "callback" | "purchase_intent";
  market_code: string | null;
  language: string;
  name: string | null;
  contact: string;
  channel: string;
  delivery_city: string | null;
  custom_product_name: string | null;
  quantity: number | null;
  message: string | null;
  source: string | null;
  status: string;
  created_at: string;
  products: { legacy_id: string } | null;
};

const localeByLanguage: Record<Language, string> = {
  zh: "zh-CN",
  ru: "ru-RU",
  ky: "ky-KG",
  uz: "uz-UZ",
};

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdvisorDashboard({
  initialInquiries,
  copy,
  language,
}: {
  initialInquiries: AdvisorInquiry[];
  copy: AdvisorCopy;
  language: Language;
}) {
  const [items, setItems] = useState(initialInquiries);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const pending = useMemo(() => items.filter((item) => item.status === "new"), [items]);
  const processed = useMemo(() => items.filter((item) => item.status !== "new"), [items]);

  async function updateStatus(id: string, status: "contacted" | "qualified" | "closed" | "spam") {
    setBusyId(id);
    setMessage("");
    const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (session?.access_token) headers.authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`/api/advisor/inquiries/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setMessage(copy.processFailed);
      setBusyId(null);
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setBusyId(null);
  }

  return (
    <>
      <section className="advisor-summary" aria-label={copy.workspace}>
        <div><strong>{pending.length}</strong><span>{copy.pending}</span></div>
        <div><strong>{processed.length}</strong><span>{copy.processed}</span></div>
        <div><strong>{items.length}</strong><span>{copy.total}</span></div>
      </section>
      {message && <p className="form-message" role="status">{message}</p>}
      <InquirySection title={copy.pendingInfo} empty={copy.noPending} items={pending} busyId={busyId} copy={copy} language={language} onUpdate={updateStatus} />
      <InquirySection title={copy.processedInfo} empty={copy.noProcessed} items={processed} busyId={busyId} copy={copy} language={language} onUpdate={updateStatus} />
    </>
  );
}

function InquirySection({
  title,
  empty,
  items,
  busyId,
  copy,
  language,
  onUpdate,
}: {
  title: string;
  empty: string;
  items: AdvisorInquiry[];
  busyId: string | null;
  copy: AdvisorCopy;
  language: Language;
  onUpdate: (id: string, status: "contacted" | "qualified" | "closed" | "spam") => Promise<void>;
}) {
  return (
    <section className="advisor-card">
      <h2>{title}</h2>
      {items.length === 0 ? <p>{empty}</p> : <div className="advisor-list">{items.map((item) => (
        <article key={item.id} className="advisor-inquiry">
          <div className="advisor-inquiry-head">
            <div>
              <strong>{copy.intentTypes[item.intent_type] ?? item.intent_type}</strong>
              <span>{item.market_code?.toUpperCase() ?? "—"} · {formatDate(item.created_at, language)}</span>
            </div>
            <span className={`status status-${item.status}`}>{copy.status[item.status] ?? item.status}</span>
          </div>
          <dl className="advisor-fields">
            <div><dt>{copy.customer}</dt><dd>{item.name ?? copy.notProvided}</dd></div>
            <div><dt>{copy.contact}</dt><dd>{copy.channels[item.channel] ?? item.channel} · {item.contact}</dd></div>
            <div><dt>{copy.city}</dt><dd>{item.delivery_city ?? copy.notProvided}</dd></div>
            <div><dt>{copy.product}</dt><dd>{item.products?.legacy_id ?? item.custom_product_name ?? copy.advisorConsultation}</dd></div>
            <div><dt>{copy.quantity}</dt><dd>{item.quantity ? item.quantity.toLocaleString(localeByLanguage[language]) : copy.notProvided}</dd></div>
            <div><dt>{copy.source}</dt><dd>{item.source ?? "website"}</dd></div>
          </dl>
          {item.message && <p className="advisor-note">{item.message}</p>}
          <div className="advisor-actions">
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "contacted")}>{copy.markContacted}</button>
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "qualified")}>{copy.markQualified}</button>
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "closed")}>{copy.markClosed}</button>
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "spam")}>{copy.close}</button>
          </div>
        </article>
      ))}</div>}
    </section>
  );
}
