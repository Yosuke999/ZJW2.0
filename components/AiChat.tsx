"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { countries } from "@/data/countries";
import { formatPrice, getPrice } from "@/data/prices";
import { products } from "@/data/products";
import type { CountryCode, InquiryPrefill, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";

type Message = { role: "user" | "assistant"; content: string };
type PurchaseContext = { productId: string | null; quantity: number | null; destinationCity: string };
type ChatResponse = { message?: string; error?: string; suggestions?: string[]; handoffRecommended?: boolean; purchaseContext?: PurchaseContext };

const labels: Record<Language, {
  button: string; title: string; placeholder: string; send: string; welcome: string; close: string; loading: string;
  viewing: string; quickQuestions: string[]; advisor: string; inquiry: string; retry: string; retryAction: string;
  progress: string; product: string; quantity: string; city: string; pending: string; summary: string; confirmForm: string; confirmHint: string; readyMessage: string; modify: string;
}> = {
  zh: {
    button: "AI客服", title: "AI采购客服", placeholder: "请输入你的问题", send: "发送", close: "关闭客服", loading: "正在查询…",
    welcome: "你好，我是采购顾问。你想了解商品价格、采购流程，还是运输与清关？",
    viewing: "当前浏览", quickQuestions: ["我想了解商品价格", "采购流程是什么？", "如何联系当地顾问？"],
    advisor: "联系当地顾问", inquiry: "填写需求表单", retry: "暂时无法回答，请稍后重试。", retryAction: "重新发送",
    progress: "采购需求", product: "商品", quantity: "数量", city: "送达城市", pending: "待确认", summary: "需求摘要",
    confirmForm: "确认并填写表单", confirmHint: "打开表单后仍需由你检查并主动提交。",
    readyMessage: "采购信息已整理好，请核对下方内容。", modify: "修改需求",
  },
  ru: {
    button: "AI", title: "AI-консультант", placeholder: "Введите ваш вопрос", send: "Отправить", close: "Закрыть чат", loading: "Уточняю…",
    welcome: "Здравствуйте! Я консультант по закупкам. Вас интересует цена товара, процесс закупки или доставка и таможня?",
    viewing: "Вы смотрите", quickQuestions: ["Узнать цену товара", "Как проходит закупка?", "Как связаться с консультантом?"],
    advisor: "Связаться с консультантом", inquiry: "Заполнить заявку", retry: "Сейчас не удаётся ответить. Попробуйте позже.", retryAction: "Отправить снова",
    progress: "Запрос на закупку", product: "Товар", quantity: "Количество", city: "Город доставки", pending: "Нужно уточнить", summary: "Сводка запроса",
    confirmForm: "Подтвердить и заполнить", confirmHint: "Проверьте данные в форме и отправьте её самостоятельно.",
    readyMessage: "Данные собраны. Проверьте сводку ниже.", modify: "Изменить данные",
  },
  ky: {
    button: "AI", title: "AI кеңешчи", placeholder: "Сурооңузду жазыңыз", send: "Жөнөтүү", close: "Чатты жабуу", loading: "Тактап жатам…",
    welcome: "Салам! Мен сатып алуу боюнча кеңешчимин. Товардын баасы, сатып алуу тартиби же жеткирүү жана бажы тууралуу билгиңиз келеби?",
    viewing: "Азыр көрүп жатасыз", quickQuestions: ["Товардын баасын билүү", "Сатып алуу кандай жүрөт?", "Кеңешчи менен кантип байланышам?"],
    advisor: "Жергиликтүү кеңешчи", inquiry: "Өтүнмө толтуруу", retry: "Азыр жооп берүү мүмкүн эмес. Кийинчерээк аракет кылыңыз.", retryAction: "Кайра жөнөтүү",
    progress: "Сатып алуу талабы", product: "Товар", quantity: "Саны", city: "Жеткирүү шаары", pending: "Тактоо керек", summary: "Талаптын жыйынтыгы",
    confirmForm: "Ырастап, форманы толтуруу", confirmHint: "Формадагы маалыматты текшерип, өзүңүз жөнөтөсүз.",
    readyMessage: "Маалымат даяр. Төмөнкү жыйынтыкты текшериңиз.", modify: "Маалыматты өзгөртүү",
  },
  uz: {
    button: "AI", title: "AI maslahatchi", placeholder: "Savolingizni yozing", send: "Yuborish", close: "Chatni yopish", loading: "Aniqlayapman…",
    welcome: "Salom! Men xarid bo‘yicha maslahatchiman. Mahsulot narxi, xarid jarayoni yoki yetkazib berish va bojxona haqida bilmoqchimisiz?",
    viewing: "Hozir ko‘ryapsiz", quickQuestions: ["Mahsulot narxini bilish", "Xarid jarayoni qanday?", "Maslahatchi bilan qanday bog‘lanaman?"],
    advisor: "Mahalliy maslahatchi", inquiry: "So‘rov formasini to‘ldirish", retry: "Hozir javob berib bo‘lmadi. Keyinroq urinib ko‘ring.", retryAction: "Qayta yuborish",
    progress: "Xarid talabi", product: "Mahsulot", quantity: "Miqdor", city: "Yetkazish shahri", pending: "Aniqlash kerak", summary: "Talab xulosasi",
    confirmForm: "Tasdiqlash va formani to‘ldirish", confirmHint: "Formadagi ma’lumotlarni tekshirib, o‘zingiz yuborasiz.",
    readyMessage: "Ma’lumotlar tayyor. Quyidagi xulosani tekshiring.", modify: "Talabni o‘zgartirish",
  },
  en: {
    button: "AI", title: "AI purchasing assistant", placeholder: "Type your question", send: "Send", close: "Close chat", loading: "Checking…",
    welcome: "Hello! I’m a purchasing advisor. Are you asking about a product price, the purchasing process, or shipping and customs?",
    viewing: "Currently viewing", quickQuestions: ["Check a product price", "How does purchasing work?", "How can I contact an advisor?"],
    advisor: "Contact local advisor", inquiry: "Complete inquiry form", retry: "I can’t answer right now. Please try again shortly.", retryAction: "Send again",
    progress: "Sourcing request", product: "Product", quantity: "Quantity", city: "Delivery city", pending: "To confirm", summary: "Request summary",
    confirmForm: "Confirm and complete form", confirmHint: "You will still review and submit the form yourself.",
    readyMessage: "Your request details are ready. Please review the summary below.", modify: "Edit request",
  },
};

export function AiChat({ country, language, viewedProductId, onOpenInquiry }: {
  country: CountryCode; language: Language; viewedProductId: string | null; onOpenInquiry: (prefill: InquiryPrefill) => void;
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
  const [purchaseContext, setPurchaseContext] = useState<PurchaseContext>({ productId: null, quantity: null, destinationCity: "" });
  const [lastFailedQuestion, setLastFailedQuestion] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedProduct = useMemo(() => products.find((product) => product.id === purchaseContext.productId) ?? null, [purchaseContext.productId]);
  const selectedPrice = selectedProduct ? getPrice(country, selectedProduct.id) : null;
  const hasPurchaseContext = Boolean(selectedProduct || purchaseContext.quantity || purchaseContext.destinationCity);
  const requestReady = Boolean(selectedProduct && purchaseContext.quantity && purchaseContext.destinationCity);

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
    setLastFailedQuestion("");
    setLoading(true);
    trackEvent("ai_chat_question", { country, language, viewedProductId });
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, country, language, viewedProductId, purchaseContext }),
      });
      const data = await response.json() as ChatResponse;
      const updatedContext = data.purchaseContext ?? purchaseContext;
      const completeContext = Boolean(updatedContext.productId && updatedContext.quantity && updatedContext.destinationCity);
      const rawMessage = data.message || data.error || copy.retry;
      const leakedStructuredData = /^\s*[\[{]/.test(rawMessage) && /"(?:answer|suggestedQuestions|handoffRecommended|purchaseContext)"/.test(rawMessage);
      const displayMessage = response.ok && completeContext ? copy.readyMessage : leakedStructuredData ? copy.retry : rawMessage;
      setMessages([...next, { role: "assistant", content: displayMessage }]);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : []);
      setShowHandoff(Boolean(data.handoffRecommended));
      if (data.purchaseContext) setPurchaseContext(data.purchaseContext);
      if (!response.ok || leakedStructuredData) setLastFailedQuestion(question);
    } catch {
      setMessages([...next, { role: "assistant", content: copy.retry }]);
      setSuggestions(copy.quickQuestions.slice(0, 2));
      setLastFailedQuestion(question);
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
          <button type="button" onClick={() => setOpen(false)} aria-label={copy.close}><span className="ai-chat-close-icon" aria-hidden="true" /></button>
        </div>
        {viewedProduct && <div className="ai-chat-context"><span>{copy.viewing}</span><strong>{viewedProduct.name[language]}</strong></div>}
        {hasPurchaseContext && <div className="ai-chat-progress" aria-label={copy.progress}>
          <strong>{copy.progress}</strong>
          <div>
            <span className={selectedProduct ? "is-complete" : ""}>{copy.product}<b>{selectedProduct?.name[language] ?? copy.pending}</b></span>
            <span className={purchaseContext.quantity ? "is-complete" : ""}>{copy.quantity}<b>{purchaseContext.quantity ?? copy.pending}</b></span>
            <span className={purchaseContext.destinationCity ? "is-complete" : ""}>{copy.city}<b>{purchaseContext.destinationCity || copy.pending}</b></span>
          </div>
        </div>}
        <div ref={messagesRef} className="ai-chat-messages" aria-live="polite">
          {messages.map((message, index) => <div className={`ai-chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading && <div className="ai-chat-message assistant">{copy.loading}</div>}
          {!loading && suggestions.length > 0 && <div className="ai-chat-suggestions" aria-label={copy.title}>
            {suggestions.map((question) => <button type="button" key={question} onClick={() => ask(question)}>{question}</button>)}
          </div>}
          {!loading && lastFailedQuestion && <button type="button" className="ai-chat-retry" onClick={() => ask(lastFailedQuestion)}>{copy.retryAction}</button>}
          {!loading && selectedProduct && selectedPrice && <div className="ai-chat-product-card">
            <Image src={selectedProduct.image} alt="" width={72} height={72} />
            <div><strong>{selectedProduct.name[language]}</strong><span>{selectedProduct.specification[language]}</span><b>{formatPrice(selectedPrice.chinaReferencePrice, selectedPrice.currency, language)}</b></div>
          </div>}
          {!loading && requestReady && selectedProduct && <div className="ai-chat-summary">
            <strong>{copy.summary}</strong>
            <dl><div><dt>{copy.product}</dt><dd>{selectedProduct.name[language]}</dd></div><div><dt>{copy.quantity}</dt><dd>{purchaseContext.quantity}</dd></div><div><dt>{copy.city}</dt><dd>{purchaseContext.destinationCity}</dd></div></dl>
            <div className="ai-chat-summary-actions">
              <button type="button" onClick={() => onOpenInquiry({ productId: selectedProduct.id, quantity: purchaseContext.quantity, destinationCity: purchaseContext.destinationCity })}>{copy.confirmForm}</button>
              <button type="button" className="secondary" onClick={() => inputRef.current?.focus()}>{copy.modify}</button>
            </div>
            <small>{copy.confirmHint}</small>
          </div>}
          {!loading && showHandoff && !requestReady && <div className="ai-chat-handoff">
            <div className="ai-chat-contact-links">
              <a href={countryConfig.contact.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href={countryConfig.contact.telegramUrl} target="_blank" rel="noreferrer">Telegram</a>
              <a href={`tel:${countryConfig.contact.phone.replace(/\s/g, "")}`}>{copy.advisor}</a>
            </div>
            <button type="button" className="ai-chat-inquiry" onClick={() => { trackEvent("ai_chat_handoff", { country, language, viewedProductId }); onOpenInquiry({ productId: selectedProduct?.id ?? null, quantity: purchaseContext.quantity, destinationCity: purchaseContext.destinationCity }); }}>{copy.inquiry}</button>
          </div>}
        </div>
        <form className="ai-chat-form" onSubmit={submit}>
          <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={copy.placeholder} aria-label={copy.placeholder} maxLength={1000} />
          <button type="submit" disabled={loading || !input.trim()}>{copy.send}</button>
        </form>
      </section>}
      <button type="button" className="ai-chat-launcher" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={copy.title} title={copy.title}>
        <span className="ai-chat-headset-icon" aria-hidden="true"><i /></span>
      </button>
    </>
  );
}
