"use client";

import { useState, type ReactNode } from "react";
import { products } from "@/data/products";
import type { Language } from "@/data/types";

export type AnalyticsEventRow = {
  visitor_id: string;
  event_name: "page_view" | "product_view" | "consult_open" | "registration" | "inquiry_submit";
  product_legacy_id: string | null;
  market_code: string;
  language: string;
  created_at: string;
};

const analyticsCopy = {
  zh: { title: "数据概览", period: "最近 30 天 · 从统计启用后开始累计", visitors: "独立访客", views: "商品浏览", inquiries: "咨询提交", registrations: "注册用户", rate: "注册转化率", trend: "每日趋势", sevenDays: "7天", thirtyDays: "30天", trendNoData: "当前范围暂无趋势数据", products: "热门商品", breakdown: "国家与语言转化", product: "商品", marketLanguage: "市场 / 语言", inquiryRate: "咨询率", noData: "统计启用后暂无数据。", pageViews: "访客", language: { zh: "中文", ru: "俄语", ky: "吉尔吉斯语", uz: "乌兹别克语", en: "英语" } },
  ru: { title: "Аналитика", period: "Последние 30 дней · данные с момента включения аналитики", visitors: "Уникальные посетители", views: "Просмотры товаров", inquiries: "Заявки", registrations: "Регистрации", rate: "Конверсия в регистрацию", trend: "Динамика по дням", sevenDays: "7 дней", thirtyDays: "30 дней", trendNoData: "За выбранный период данных пока нет", products: "Популярные товары", breakdown: "Конверсия по рынкам и языкам", product: "Товар", marketLanguage: "Рынок / язык", inquiryRate: "Конверсия в заявку", noData: "После включения аналитики данных пока нет.", pageViews: "Посетители", language: { zh: "Китайский", ru: "Русский", ky: "Кыргызский", uz: "Узбекский", en: "Английский" } },
  ky: { title: "Статистика", period: "Акыркы 30 күн · статистика иштетилгенден кийинки маалымат", visitors: "Уникалдуу коноктор", views: "Товарды көрүүлөр", inquiries: "Өтүнмөлөр", registrations: "Катталуулар", rate: "Катталуу конверсиясы", trend: "Күнүмдүк өзгөрүү", sevenDays: "7 күн", thirtyDays: "30 күн", trendNoData: "Тандалган аралыкта маалымат жок", products: "Популярдуу товарлар", breakdown: "Базар жана тил боюнча конверсия", product: "Товар", marketLanguage: "Базар / тил", inquiryRate: "Өтүнмө конверсиясы", noData: "Статистика иштетилгенден кийин азырынча маалымат жок.", pageViews: "Коноктор", language: { zh: "Кытайча", ru: "Орусча", ky: "Кыргызча", uz: "Өзбекче", en: "Англисче" } },
  uz: { title: "Statistika", period: "So‘nggi 30 kun · statistika yoqilgandan keyingi ma’lumotlar", visitors: "Noyob tashrifchilar", views: "Mahsulot ko‘rishlari", inquiries: "So‘rovlar", registrations: "Ro‘yxatdan o‘tishlar", rate: "Ro‘yxatdan o‘tish konversiyasi", trend: "Kunlik dinamika", sevenDays: "7 kun", thirtyDays: "30 kun", trendNoData: "Tanlangan davr uchun ma’lumot yo‘q", products: "Ommabop mahsulotlar", breakdown: "Bozor va til bo‘yicha konversiya", product: "Mahsulot", marketLanguage: "Bozor / til", inquiryRate: "So‘rov konversiyasi", noData: "Statistika yoqilgandan beri hali ma’lumot yo‘q.", pageViews: "Tashrifchilar", language: { zh: "Xitoycha", ru: "Ruscha", ky: "Qirg‘izcha", uz: "O‘zbekcha", en: "Inglizcha" } },
  en: { title: "Analytics", period: "Last 30 days · counted since analytics was enabled", visitors: "Unique visitors", views: "Product views", inquiries: "Inquiries", registrations: "Registrations", rate: "Registration conversion", trend: "Daily trend", sevenDays: "7 days", thirtyDays: "30 days", trendNoData: "No trend data for this period", products: "Popular products", breakdown: "Conversion by market and language", product: "Product", marketLanguage: "Market / language", inquiryRate: "Inquiry rate", noData: "No data has been collected yet.", pageViews: "Visitors", language: { zh: "Chinese", ru: "Russian", ky: "Kyrgyz", uz: "Uzbek", en: "English" } },
} satisfies Record<Language, Record<string, unknown>>;

function percent(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

function dayKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function AnalyticsDashboard({ events, language, anchorDate }: { events: AnalyticsEventRow[]; language: Language; anchorDate: string }) {
  const copy = analyticsCopy[language] as typeof analyticsCopy.zh;
  const [mobileRange, setMobileRange] = useState<7 | 30>(7);
  const pageEvents = events.filter((event) => event.event_name === "page_view");
  const visitors = new Set(pageEvents.map((event) => event.visitor_id)).size;
  const productViews = events.filter((event) => event.event_name === "product_view").length;
  const registrations = events.filter((event) => event.event_name === "registration").length;
  const inquiries = events.filter((event) => event.event_name === "inquiry_submit").length;

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(anchorDate);
    date.setUTCDate(date.getUTCDate() - (29 - index));
    const key = dayKey(date);
    const rows = events.filter((event) => dayKey(event.created_at) === key);
    return {
      key,
      visitors: new Set(rows.filter((event) => event.event_name === "page_view").map((event) => event.visitor_id)).size,
      registrations: rows.filter((event) => event.event_name === "registration").length,
      inquiries: rows.filter((event) => event.event_name === "inquiry_submit").length,
    };
  });
  const trendMax = Math.max(1, ...days.flatMap((day) => [day.visitors, day.registrations, day.inquiries]));
  const hasTrendData = days.some((day) => day.visitors || day.registrations || day.inquiries);

  const productStats = products.map((product) => {
    const views = events.filter((event) => event.event_name === "product_view" && event.product_legacy_id === product.id).length;
    const productInquiries = events.filter((event) => event.event_name === "inquiry_submit" && event.product_legacy_id === product.id).length;
    return { id: product.id, name: product.name[language], views, inquiries: productInquiries };
  }).filter((item) => item.views || item.inquiries).sort((a, b) => b.inquiries - a.inquiries || b.views - a.views).slice(0, 10);

  const breakdownKeys = [...new Set(events.map((event) => `${event.market_code}:${event.language}`))];
  const breakdown = breakdownKeys.map((key) => {
    const [market, eventLanguage] = key.split(":");
    const rows = events.filter((event) => event.market_code === market && event.language === eventLanguage);
    const rowVisitors = new Set(rows.filter((event) => event.event_name === "page_view").map((event) => event.visitor_id)).size;
    const rowRegistrations = rows.filter((event) => event.event_name === "registration").length;
    const rowInquiries = rows.filter((event) => event.event_name === "inquiry_submit").length;
    return { key, market, language: eventLanguage, visitors: rowVisitors, registrations: rowRegistrations, inquiries: rowInquiries };
  }).sort((a, b) => b.visitors - a.visitors);

  return (
    <section className="analytics-dashboard" aria-labelledby="analytics-title">
      <div className="analytics-heading"><div><h2 id="analytics-title">{copy.title}</h2><p>{copy.period}</p></div></div>
      <div className="analytics-cards">
        <Metric kind="visitors" label={copy.visitors} value={visitors} />
        <Metric kind="views" label={copy.views} value={productViews} />
        <Metric kind="inquiries" label={copy.inquiries} value={inquiries} />
        <Metric kind="registrations" label={copy.registrations} value={registrations} />
        <Metric kind="rate" label={copy.rate} value={percent(registrations, visitors)} />
      </div>
      {events.length === 0 ? <div className="analytics-empty"><MetricIcon kind="trend" /><p>{copy.noData}</p></div> : <>
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <h3>{copy.trend}</h3>
            <div className="analytics-range-switch" aria-label={copy.trend}>
              <button type="button" className={mobileRange === 7 ? "active" : ""} aria-pressed={mobileRange === 7} onClick={() => setMobileRange(7)}>{copy.sevenDays}</button>
              <button type="button" className={mobileRange === 30 ? "active" : ""} aria-pressed={mobileRange === 30} onClick={() => setMobileRange(30)}>{copy.thirtyDays}</button>
            </div>
          </div>
          {hasTrendData ? <>
            <TrendChart className="analytics-trend-desktop" days={days} max={trendMax} label={copy.trend} />
            <TrendChart className="analytics-trend-mobile" days={days.slice(-mobileRange)} max={trendMax} label={copy.trend} />
            <div className="analytics-legend"><span className="legend-visitors">{copy.pageViews}</span><span className="legend-registrations">{copy.registrations}</span><span className="legend-inquiries">{copy.inquiries}</span></div>
          </> : <div className="analytics-trend-empty"><MetricIcon kind="trend" /><p>{copy.trendNoData}</p></div>}
        </div>
        <div className="analytics-two-column">
          <div className="analytics-panel"><h3>{copy.products}</h3><div className="analytics-table-wrap"><table><thead><tr><th>{copy.product}</th><th>{copy.views}</th><th>{copy.inquiries}</th><th>{copy.inquiryRate}</th></tr></thead><tbody>{productStats.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.views}</td><td>{item.inquiries}</td><td>{percent(item.inquiries, item.views)}</td></tr>)}</tbody></table></div></div>
          <div className="analytics-panel"><h3>{copy.breakdown}</h3><div className="analytics-table-wrap"><table><thead><tr><th>{copy.marketLanguage}</th><th>{copy.visitors}</th><th>{copy.registrations}</th><th>{copy.rate}</th><th>{copy.inquiries}</th></tr></thead><tbody>{breakdown.map((item) => <tr key={item.key}><td>{item.market.toUpperCase()} · {copy.language[item.language as keyof typeof copy.language] ?? item.language}</td><td>{item.visitors}</td><td>{item.registrations}</td><td>{percent(item.registrations, item.visitors)}</td><td>{item.inquiries}</td></tr>)}</tbody></table></div></div>
        </div>
      </>}
    </section>
  );
}

type TrendDay = { key: string; visitors: number; registrations: number; inquiries: number };

function TrendChart({ days, max, label, className }: { days: TrendDay[]; max: number; label: string; className: string }) {
  const minimumColumnWidth = className.includes("mobile") ? days.length > 7 ? "24px" : "32px" : "16px";
  return <div className={`analytics-trend ${className}`} aria-label={label} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(${minimumColumnWidth}, 1fr))` }}>
    {days.map((day, index) => {
      const showLabel = days.length <= 7 || index === 0 || index === days.length - 1 || index % 5 === 0;
      return <div key={day.key} className="trend-day" title={`${day.key}: ${day.visitors} / ${day.registrations} / ${day.inquiries}`}>
        <div className="trend-bars">
          <TrendBar kind="visitors" value={day.visitors} max={max} />
          <TrendBar kind="registrations" value={day.registrations} max={max} />
          <TrendBar kind="inquiries" value={day.inquiries} max={max} />
        </div>
        <small className={showLabel ? "" : "is-hidden"}>{day.key.slice(5)}</small>
      </div>;
    })}
  </div>;
}

function TrendBar({ kind, value, max }: { kind: "visitors" | "registrations" | "inquiries"; value: number; max: number }) {
  return <span className={`trend-bar trend-bar-${kind}`} style={{ height: value ? `${Math.max(7, (value / max) * 100)}%` : 0 }} />;
}

type MetricKind = "visitors" | "views" | "inquiries" | "registrations" | "rate" | "trend";

function Metric({ kind, label, value }: { kind: MetricKind; label: string; value: string | number }) {
  return <div className={`analytics-metric analytics-metric-${kind}`}><MetricIcon kind={kind} /><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function MetricIcon({ kind }: { kind: MetricKind }) {
  const paths: Record<MetricKind, ReactNode> = {
    visitors: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20v-2.5A5.5 5.5 0 0 1 11 12h2a5.5 5.5 0 0 1 5.5 5.5V20" /></>,
    views: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    inquiries: <><path d="M4 5h16v11H9l-4 3v-3H4V5Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>,
    registrations: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M18 9v6M15 12h6" /></>,
    rate: <><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /><path d="m18.5 5.5-13 13" /></>,
    trend: <><path d="M5 19V9M10 19V5M15 19v-7M20 19V3" /><path d="M3 21h19" /></>,
  };
  return <span className="analytics-metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg></span>;
}
