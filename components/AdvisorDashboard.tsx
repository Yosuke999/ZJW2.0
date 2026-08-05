"use client";

import { useMemo, useState } from "react";
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

const statusLabels: Record<string, string> = {
  new: "待处理",
  contacted: "已联系",
  qualified: "跟进中",
  closed: "已结束",
  spam: "已关闭",
};

const intentLabels: Record<string, string> = {
  callback: "咨询申请",
  purchase_intent: "采购意向",
};

const channelLabels: Record<string, string> = {
  phone: "手机",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdvisorDashboard({ initialInquiries }: { initialInquiries: AdvisorInquiry[] }) {
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
      setMessage("处理失败，请刷新后重试。");
      setBusyId(null);
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setBusyId(null);
  }

  return (
    <>
      <section className="advisor-summary" aria-label="顾问处理概览">
        <div><strong>{pending.length}</strong><span>待处理</span></div>
        <div><strong>{processed.length}</strong><span>已处理</span></div>
        <div><strong>{items.length}</strong><span>全部意向</span></div>
      </section>
      {message && <p className="form-message" role="status">{message}</p>}
      <InquirySection title="待处理信息" empty="当前没有待处理意向。" items={pending} busyId={busyId} onUpdate={updateStatus} />
      <InquirySection title="已处理信息" empty="当前没有已处理记录。" items={processed} busyId={busyId} onUpdate={updateStatus} />
    </>
  );
}

function InquirySection({
  title,
  empty,
  items,
  busyId,
  onUpdate,
}: {
  title: string;
  empty: string;
  items: AdvisorInquiry[];
  busyId: string | null;
  onUpdate: (id: string, status: "contacted" | "qualified" | "closed" | "spam") => Promise<void>;
}) {
  return (
    <section className="advisor-card">
      <h2>{title}</h2>
      {items.length === 0 ? <p>{empty}</p> : <div className="advisor-list">{items.map((item) => (
        <article key={item.id} className="advisor-inquiry">
          <div className="advisor-inquiry-head">
            <div>
              <strong>{intentLabels[item.intent_type] ?? item.intent_type}</strong>
              <span>{item.market_code?.toUpperCase() ?? "—"} · {formatDate(item.created_at)}</span>
            </div>
            <span className={`status status-${item.status}`}>{statusLabels[item.status] ?? item.status}</span>
          </div>
          <dl className="advisor-fields">
            <div><dt>客户</dt><dd>{item.name ?? "未填写"}</dd></div>
            <div><dt>联系方式</dt><dd>{channelLabels[item.channel] ?? item.channel} · {item.contact}</dd></div>
            <div><dt>城市</dt><dd>{item.delivery_city ?? "未填写"}</dd></div>
            <div><dt>商品</dt><dd>{item.products?.legacy_id ?? item.custom_product_name ?? "咨询顾问"}</dd></div>
            <div><dt>数量</dt><dd>{item.quantity ? item.quantity.toLocaleString("zh-CN") : "未填写"}</dd></div>
            <div><dt>来源</dt><dd>{item.source ?? "website"}</dd></div>
          </dl>
          {item.message && <p className="advisor-note">{item.message}</p>}
          <div className="advisor-actions">
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "contacted")}>标记已联系</button>
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "qualified")}>标记跟进中</button>
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "closed")}>标记已结束</button>
            <button type="button" disabled={busyId === item.id} onClick={() => onUpdate(item.id, "spam")}>关闭</button>
          </div>
        </article>
      ))}</div>}
    </section>
  );
}
