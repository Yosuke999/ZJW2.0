"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/data/types";

type StorySlide = {
  image: string;
  title: string;
  description: string;
};

type StoryContent = {
  eyebrow: string;
  heading: string;
  slides: StorySlide[];
  previous: string;
  next: string;
  goTo: string;
};

const content: Record<Language, StoryContent> = {
  zh: {
    eyebrow: "真实采购现场",
    heading: "从中国货源到当地交付，每一步都看得见",
    previous: "上一张",
    next: "下一张",
    goTo: "查看场景",
    slides: [
      { image: "/story/product-sourcing-market.png", title: "义乌市场现场选品", description: "在小商品城档口对照样品、数量和报价，把采购条件当面谈清楚。" },
      { image: "/story/product-sourcing-factory.png", title: "深入工厂确认货源", description: "走进生产与样品现场，确认材质、工艺、包装和交付能力。" },
      { image: "/story/our-partnership.png", title: "建立长期采购合作", description: "围绕价格、质量和交期形成清晰约定，让后续补货更稳定。" },
      { image: "/story/our-warehouse.png", title: "仓储集货与查验", description: "货物集中入仓，按订单核对数量、外观和包装后再安排出运。" },
      { image: "/story/customs-clearance.png", title: "跨境报关与清关", description: "整理贸易与运输资料，衔接报关、口岸和目的地清关流程。" },
      { image: "/story/our-logistics.png", title: "中亚线路运输交付", description: "根据货量和时效选择运输方案，持续跟进直到当地交付。" },
    ],
  },
  en: {
    eyebrow: "Sourcing in action",
    heading: "A visible journey from China sourcing to local delivery",
    previous: "Previous",
    next: "Next",
    goTo: "View scene",
    slides: [
      { image: "/story/product-sourcing-market.png", title: "Sourcing in Yiwu market", description: "Compare samples, quantities and quotations directly with wholesale-market suppliers." },
      { image: "/story/product-sourcing-factory.png", title: "Confirming supply at the factory", description: "Check materials, workmanship, packaging and production capacity at the source." },
      { image: "/story/our-partnership.png", title: "Building reliable partnerships", description: "Agree on price, quality and lead time to make repeat purchasing more dependable." },
      { image: "/story/our-warehouse.png", title: "Consolidation and inspection", description: "Bring orders into one warehouse and verify quantity, appearance and packaging." },
      { image: "/story/customs-clearance.png", title: "Customs coordination", description: "Prepare trade and transport documents for export and destination clearance." },
      { image: "/story/our-logistics.png", title: "Delivery across Central Asia", description: "Match the route to cargo volume and timing, then follow the shipment to delivery." },
    ],
  },
  ru: {
    eyebrow: "Закупки на практике",
    heading: "Весь путь от закупки в Китае до местной доставки",
    previous: "Назад",
    next: "Вперёд",
    goTo: "Открыть сцену",
    slides: [
      { image: "/story/product-sourcing-market.png", title: "Закупка на рынке Иу", description: "Сравниваем образцы, объёмы и цены напрямую с поставщиками оптового рынка." },
      { image: "/story/product-sourcing-factory.png", title: "Проверка товара на фабрике", description: "Уточняем материалы, качество, упаковку и производственные возможности." },
      { image: "/story/our-partnership.png", title: "Надёжное сотрудничество", description: "Согласуем цену, качество и сроки для стабильных повторных закупок." },
      { image: "/story/our-warehouse.png", title: "Консолидация и проверка", description: "Собираем заказы на складе и проверяем количество, вид и упаковку." },
      { image: "/story/customs-clearance.png", title: "Таможенное оформление", description: "Готовим торговые и транспортные документы для прохождения границы." },
      { image: "/story/our-logistics.png", title: "Доставка в Центральную Азию", description: "Подбираем маршрут и сопровождаем груз до передачи на месте." },
    ],
  },
  ky: {
    eyebrow: "Сатып алуу процесси",
    heading: "Кытайдан сатып алуудан жергиликтүү жеткирүүгө чейинки жол",
    previous: "Мурунку",
    next: "Кийинки",
    goTo: "Көрүнүштү ачуу",
    slides: [
      { image: "/story/product-sourcing-market.png", title: "Иу базарында товар тандоо", description: "Үлгүлөрдү, көлөмдү жана бааны дүң сатуучулар менен түз салыштырабыз." },
      { image: "/story/product-sourcing-factory.png", title: "Фабрикада булакты текшерүү", description: "Материалды, сапатты, таңгакты жана өндүрүш мүмкүнчүлүгүн тактайбыз." },
      { image: "/story/our-partnership.png", title: "Ишенимдүү өнөктөштүк", description: "Кийинки сатып алуулар туруктуу болушу үчүн баа, сапат жана мөөнөттү макулдашабыз." },
      { image: "/story/our-warehouse.png", title: "Кампада топтоо жана текшерүү", description: "Буйрутмаларды бир жерге чогултуп, санын, көрүнүшүн жана таңгагын текшеребиз." },
      { image: "/story/customs-clearance.png", title: "Бажы жол-жоболору", description: "Чек арадан өткөрүү үчүн соода жана ташуу документтерин даярдайбыз." },
      { image: "/story/our-logistics.png", title: "Борбор Азияга жеткирүү", description: "Жүккө ылайык маршрут тандап, жергиликтүү тапшырууга чейин көзөмөлдөйбүз." },
    ],
  },
  uz: {
    eyebrow: "Xarid jarayoni",
    heading: "Xitoydagi xariddan mahalliy yetkazib berishgacha",
    previous: "Oldingi",
    next: "Keyingi",
    goTo: "Sahnani ko‘rish",
    slides: [
      { image: "/story/product-sourcing-market.png", title: "Yiwu bozorida mahsulot tanlash", description: "Namunalar, miqdor va narxlarni ulgurji yetkazib beruvchilar bilan bevosita solishtiramiz." },
      { image: "/story/product-sourcing-factory.png", title: "Fabrikada manbani tekshirish", description: "Material, sifat, qadoqlash va ishlab chiqarish imkoniyatlarini aniqlaymiz." },
      { image: "/story/our-partnership.png", title: "Ishonchli hamkorlik", description: "Takroriy xaridlar barqaror bo‘lishi uchun narx, sifat va muddatni kelishamiz." },
      { image: "/story/our-warehouse.png", title: "Omborda jamlash va tekshirish", description: "Buyurtmalarni bir joyga yig‘ib, miqdor, ko‘rinish va qadoqni tekshiramiz." },
      { image: "/story/customs-clearance.png", title: "Bojxona rasmiylashtiruvi", description: "Chegaradan o‘tish uchun savdo va transport hujjatlarini tayyorlaymiz." },
      { image: "/story/our-logistics.png", title: "Markaziy Osiyoga yetkazish", description: "Yuk hajmi va muddatiga mos yo‘lni tanlab, mahalliy topshirishgacha kuzatamiz." },
    ],
  },
};

export function StoryShowcase({ language }: { language: Language }) {
  const copy = content[language];
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const slide = copy.slides[active];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => {
        setPrevious(current);
        setDirection(1);
        return (current + 1) % copy.slides.length;
      });
    }, 6500);
    return () => window.clearInterval(timer);
  }, [copy.slides.length, paused]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), 720);
    return () => window.clearTimeout(timer);
  }, [active, previous]);

  const move = (delta: number) => {
    setPrevious(active);
    setDirection(delta > 0 ? 1 : -1);
    setActive((active + delta + copy.slides.length) % copy.slides.length);
  };

  const goTo = (index: number) => {
    if (index === active) return;
    setPrevious(active);
    setDirection(index > active ? 1 : -1);
    setActive(index);
  };

  return (
    <section className="story-showcase shell" aria-labelledby="story-showcase-title">
      <div className="story-heading">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="story-showcase-title">{copy.heading}</h2>
      </div>
      <div
        className="story-stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="story-image-wrap">
          {previous !== null && (
            <img
              key={`previous-${copy.slides[previous].image}-${active}`}
              className={`story-image story-image-exit ${direction > 0 ? "to-left" : "to-right"}`}
              src={copy.slides[previous].image}
              alt=""
              aria-hidden="true"
            />
          )}
          <img
            key={`active-${slide.image}`}
            className={`story-image ${previous !== null ? `story-image-enter ${direction > 0 ? "from-right" : "from-left"}` : "story-image-current"}`}
            src={slide.image}
            alt={slide.title}
          />
          <span className="story-count" aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(copy.slides.length).padStart(2, "0")}</span>
        </div>
        <div className="story-copy" aria-live="polite">
          <span className="story-index">{String(active + 1).padStart(2, "0")}</span>
          <h3>{slide.title}</h3>
          <p>{slide.description}</p>
          <div className="story-arrows">
            <button type="button" onClick={() => move(-1)} aria-label={copy.previous}>←</button>
            <button type="button" onClick={() => move(1)} aria-label={copy.next}>→</button>
          </div>
        </div>
      </div>
      <div className="story-dots" role="tablist" aria-label={copy.heading}>
        {copy.slides.map((item, index) => (
          <button
            key={item.image}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-label={`${copy.goTo} ${index + 1}: ${item.title}`}
            className={active === index ? "is-active" : ""}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
}
