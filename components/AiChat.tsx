"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { CountryCode, Language } from "@/data/types";

type Message = { role: "user" | "assistant"; content: string };

const labels: Record<Language, { button: string; title: string; placeholder: string; send: string; welcome: string; close: string; loading: string }> = {
  zh: { button: "AI客服", title: "AI采购客服", placeholder: "例如：这个商品怎么采购？", send: "发送", welcome: "你好，我可以帮你了解商品、参考价格和采购流程。", close: "关闭客服", loading: "正在思考…" },
  ru: { button: "AI", title: "AI-консультант", placeholder: "Напишите ваш вопрос", send: "Отправить", welcome: "Здравствуйте! Помогу с товарами, ценами и закупкой.", close: "Закрыть чат", loading: "Думаю…" },
  ky: { button: "AI", title: "AI кеңешчи", placeholder: "Сурооңузду жазыңыз", send: "Жөнөтүү", welcome: "Салам! Товарлар, баалар жана сатып алуу боюнча жардам берем.", close: "Чатты жабуу", loading: "Ойлонуп жатам…" },
  uz: { button: "AI", title: "AI maslahatchi", placeholder: "Savolingizni yozing", send: "Yuborish", welcome: "Salom! Mahsulotlar, narxlar va xarid bo‘yicha yordam beraman.", close: "Chatni yopish", loading: "O‘ylayapman…" },
  en: { button: "AI", title: "AI purchasing assistant", placeholder: "Ask about products or purchasing", send: "Send", welcome: "Hello! I can help with products, reference prices, and purchasing.", close: "Close chat", loading: "Thinking…" },
};

export function AiChat({ country, language, productId }: { country: CountryCode; language: Language; productId?: string | null }) {
  const copy = labels[language];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: copy.welcome }]);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesRef.current) messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, country, language, productLegacyId: productId ?? undefined }),
      });
      const data = await response.json() as { message?: string; error?: string };
      setMessages([...next, { role: "assistant", content: data.message || data.error || "Sorry, I could not answer right now." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "AI 客服响应超时或暂时不可用，请稍后重试。" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && <section className="ai-chat-panel" aria-label={copy.title}>
        <div className="ai-chat-head">
          <strong>{copy.title}</strong>
          <button type="button" onClick={() => setOpen(false)} aria-label={copy.close}>×</button>
        </div>
        <div ref={messagesRef} className="ai-chat-messages" aria-live="polite">
          {messages.map((message, index) => <div className={`ai-chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading && <div className="ai-chat-message assistant">{copy.loading}</div>}
        </div>
        <form className="ai-chat-form" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={copy.placeholder} aria-label={copy.placeholder} maxLength={1000} />
          <button type="submit" disabled={loading || !input.trim()}>{copy.send}</button>
        </form>
      </section>}
      <button type="button" className="ai-chat-launcher" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span aria-hidden="true">✦</span>{copy.button}
      </button>
    </>
  );
}
