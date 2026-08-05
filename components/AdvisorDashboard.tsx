"use client";

import { useMemo, useState } from "react";
import type { AdvisorCopy } from "@/data/advisor-translations";
import { products } from "@/data/products";
import type { Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type InquiryStatus = "new" | "contacted" | "qualified" | "closed" | "spam";
type FilterStatus = "all" | InquiryStatus;

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

const filterStatuses: FilterStatus[] = ["all", "new", "contacted", "qualified", "closed", "spam"];

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

function productName(legacyId: string | undefined, language: Language) {
  if (!legacyId) return null;
  return products.find((product) => product.id === legacyId)?.name[language] ?? legacyId;
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
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const visibleItems = useMemo(() => items.filter((item) => !hiddenIds.has(item.id) && item.status !== "spam"), [items, hiddenIds]);
  const filteredItems = useMemo(() => visibleItems.filter((item) => filter === "all" ? true : item.status === filter), [visibleItems, filter]);
  const counts = useMemo(() => Object.fromEntries(filterStatuses.map((status) => [
    status,
    status === "all" ? visibleItems.length : visibleItems.filter((item) => item.status === status).length,
  ])) as Record<FilterStatus, number>, [visibleItems]);

  async function updateStatus(id: string, status: Exclude<InquiryStatus, "new">) {
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
    if (status === "spam") {
      setHiddenIds((current) => new Set(current).add(id));
    } else {
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    }
    setBusyId(null);
  }

  return (
    <>
      <div className="advisor-management-heading">
        <h2>{copy.management}</h2>
        <div className="advisor-filter" role="tablist" aria-label={copy.allVisible}>
          {filterStatuses.map((status) => (
            <button key={status} type="button" className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
              {copy.filters[status]}<span>{counts[status]}</span>
            </button>
          ))}
        </div>
      </div>
      {message && <p className="form-message" role="status">{message}</p>}
      <InquirySection title={filter === "new" ? copy.pendingInfo : filter === "all" ? copy.allVisible : copy.filters[filter]} empty={filter === "new" ? copy.noPending : copy.noProcessed} items={filteredItems} busyId={busyId} copy={copy} language={language} onUpdate={updateStatus} />
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
  onUpdate: (id: string, status: Exclude<InquiryStatus, "new">) => Promise<void>;
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
            <div><dt>{copy.product}</dt><dd>{productName(item.products?.legacy_id, language) ?? item.custom_product_name ?? copy.advisorConsultation}</dd></div>
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
