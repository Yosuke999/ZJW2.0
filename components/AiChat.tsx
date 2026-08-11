"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { countries } from "@/data/countries";
import { products } from "@/data/products";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";

type Message = { role: "user" | "assistant"; content: string };
type ChatResponse = { message?: string; error?: string; suggestions?: string[]; handoffRecommended?: boolean };

const labels: Record<Language, {
  button: string; title: string; placeholder: string; send: string; welcome: string; close: string; loading: string;
  viewing: string; quickQuestions: string[]; advisor: string; inquiry: string; retry: string;
}> = {
  zh: {
    button: "AI客服", title: "AI采购客服", placeholder: "请输入你的问题", send: "发送", close: "关闭客服", loading: "正在查询…",
    welcome: "你好，我是采购顾问。你想了解商品价格、采购流程，还是运输与清关？",
    viewing: "当前浏览", quickQuestions: ["我想了解商品价格", "采购流程是什么？", "如何联系当地顾问？"],
    advisor: "联系当地顾问", inquiry: "填写需求表单", retry: "暂时无法回答，请稍后重试。",
  },
  ru: {
    button: "AI", title: "AI-консультант", placeholder: "Введите ваш вопрос", send: "Отправить", close: "Закрыть чат", loading: "Уточняю…",
    welcome: "Здравствуйте! Я консультант по закупкам. Вас интересует цена товара, процесс закупки или доставка и таможня?",
    viewing: "Вы смотрите", quickQuestions: ["Узнать цену товара", "Как проходит закупка?", "Как связаться с консультантом?"],
    advisor: "Связаться с консультантом", inquiry: "Заполнить заявку", retry: "Сейчас не удаётся ответить. Попробуйте позже.",
  },
  ky: {
    button: "AI", title: "AI кеңешчи", placeholder: "Сурооңузду жазыңыз", send: "Жөнөтүү", close: "Чатты жабуу", loading: "Тактап жатам…",
    welcome: "Салам! Мен сатып алуу боюнча кеңешчимин. Товардын баасы, сатып алуу тартиби же жеткирүү жана бажы тууралуу билгиңиз келеби?",
    viewing: "Азыр көрүп жатасыз", quickQuestions: ["Товардын баасын билүү", "Сатып алуу кандай жүрөт?", "Кеңешчи менен кантип байланышам?"],
    advisor: "Жергиликтүү кеңешчи", inquiry: "Өтүнмө толтуруу", retry: "Азыр жооп берүү мүмкүн эмес. Кийинчерээк аракет кылыңыз.",
  },
  uz: {
    button: "AI", title: "AI maslahatchi", placeholder: "Savolingizni yozing", send: "Yuborish", close: "Chatni yopish", loading: "Aniqlayapman…",
    welcome: "Salom! Men xarid bo‘yicha maslahatchiman. Mahsulot narxi, xarid jarayoni yoki yetkazib berish va bojxona haqida bilmoqchimisiz?",
    viewing: "Hozir ko‘ryapsiz", quickQuestions: ["Mahsulot narxini bilish", "Xarid jarayoni qanday?", "Maslahatchi bilan qanday bog‘lanaman?"],
    advisor: "Mahalliy maslahatchi", inquiry: "So‘rov formasini to‘ldirish", retry: "Hozir javob berib bo‘lmadi. Keyinroq urinib ko‘ring.",
  },
  en: {
    button: "AI", title: "AI purchasing assistant", placeholder: "Type your question", send: "Send", close: "Close chat", loading: "Checking…",
    welcome: "Hello! I’m a purchasing advisor. Are you asking about a product price, the purchasing process, or shipping and customs?",
    viewing: "Currently viewing", quickQuestions: ["Check a product price", "How does purchasing work?", "How can I contact an advisor?"],
    advisor: "Contact local advisor", inquiry: "Complete inquiry form", retry: "I can’t answer right now. Please try again shortly.",
  },
};

export function AiChat({ country, language, viewedProductId, onOpenInquiry }: {
  country: CountryCode; language: Language; viewedProductId: string | null; onOpenInquiry: () => void;
}) {
  const copy = labels[language];
  const countryConfig = countries[country];
  const viewedProduct = useMemo(() => products.find((product) => product.id === viewedProductId) ?? null, [viewedProductId]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: copy.welcome }]);
  const [suggestions, setSuggestions] = useState(copy.quickQuestions);
  const [showHandoff, setShowHandoff] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesRef.current) messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open, showHandoff]);

  async function ask(content: string) {
    const question = content.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setSuggestions([]);
    setShowHandoff(false);
    setLoading(true);
    trackEvent("ai_chat_question", { country, language, viewedProductId });
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, country, language, viewedProductId }),
      });
      const data = await response.json() as ChatResponse;
      setMessages([...next, { role: "assistant", content: data.message || data.error || copy.retry }]);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : []);
      setShowHandoff(Boolean(data.handoffRecommended));
    } catch {
      setMessages([...next, { role: "assistant", content: copy.retry }]);
      setSuggestions(copy.quickQuestions.slice(0, 2));
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ask(input);
  }

  return (
    <>
      {open && <section className="ai-chat-panel" aria-label={copy.title}>
        <div className="ai-chat-head">
          <strong>{copy.title}</strong>
          <button type="button" onClick={() => setOpen(false)} aria-label={copy.close}>×</button>
        </div>
        {viewedProduct && <div className="ai-chat-context"><span>{copy.viewing}</span><strong>{viewedProduct.name[language]}</strong></div>}
        <div ref={messagesRef} className="ai-chat-messages" aria-live="polite">
          {messages.map((message, index) => <div className={`ai-chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading && <div className="ai-chat-message assistant">{copy.loading}</div>}
          {!loading && suggestions.length > 0 && <div className="ai-chat-suggestions" aria-label={copy.title}>
            {suggestions.map((question) => <button type="button" key={question} onClick={() => ask(question)}>{question}</button>)}
          </div>}
          {!loading && showHandoff && <div className="ai-chat-handoff">
            <div className="ai-chat-contact-links">
              <a href={countryConfig.contact.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href={countryConfig.contact.telegramUrl} target="_blank" rel="noreferrer">Telegram</a>
              <a href={`tel:${countryConfig.contact.phone.replace(/\s/g, "")}`}>{copy.advisor}</a>
            </div>
            <button type="button" className="ai-chat-inquiry" onClick={() => { trackEvent("ai_chat_handoff", { country, language, viewedProductId }); onOpenInquiry(); }}>{copy.inquiry}</button>
          </div>}
        </div>
        <form className="ai-chat-form" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={copy.placeholder} aria-label={copy.placeholder} maxLength={1000} />
          <button type="submit" disabled={loading || !input.trim()}>{copy.send}</button>
        </form>
      </section>}
      <button type="button" className="ai-chat-launcher" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={copy.title} title={copy.title}>
        <span className="ai-chat-headset-icon" aria-hidden="true"><i /></span>
      </button>
    </>
  );
}
