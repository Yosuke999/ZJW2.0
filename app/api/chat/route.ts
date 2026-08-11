import { NextResponse } from "next/server";
import { products } from "@/data/products";
import type { CountryCode, Language } from "@/data/types";
import { buildChatKnowledge } from "@/lib/chat-knowledge";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ModelAnswer = {
  answer?: string;
  suggestedQuestions?: string[];
  handoffRecommended?: boolean;
  missingInformation?: string[];
  purchaseContext?: {
    productId?: string;
    quantity?: number;
    destinationCity?: string;
  };
};

type PurchaseContext = { productId: string | null; quantity: number | null; destinationCity: string };

const errorCopy: Record<Language, { unavailable: string; invalid: string; timeout: string; malformed: string }> = {
  zh: { unavailable: "AI客服暂时不可用，请稍后重试或联系当地顾问。", invalid: "请输入一个有效的问题。", timeout: "响应时间较长，请稍后重试。", malformed: "这次回复没有正确生成，请重新发送。" },
  ru: { unavailable: "AI-консультант временно недоступен. Попробуйте позже или свяжитесь с местным консультантом.", invalid: "Введите корректный вопрос.", timeout: "Ответ занимает слишком много времени. Попробуйте позже.", malformed: "Ответ сформирован некорректно. Отправьте вопрос ещё раз." },
  ky: { unavailable: "AI кеңешчи убактылуу жеткиликсиз. Кийинчерээк аракет кылыңыз же жергиликтүү кеңешчиге кайрылыңыз.", invalid: "Туура суроо жазыңыз.", timeout: "Жооп узакка созулду. Кийинчерээк аракет кылыңыз.", malformed: "Жооп туура түзүлгөн жок. Суроону кайра жөнөтүңүз." },
  uz: { unavailable: "AI maslahatchi hozircha ishlamayapti. Keyinroq urinib ko‘ring yoki mahalliy maslahatchi bilan bog‘laning.", invalid: "To‘g‘ri savol kiriting.", timeout: "Javob uzoq vaqt olyapti. Keyinroq urinib ko‘ring.", malformed: "Javob to‘g‘ri shakllanmadi. Savolni qayta yuboring." },
  en: { unavailable: "The AI assistant is temporarily unavailable. Please try again or contact a local advisor.", invalid: "Please enter a valid question.", timeout: "The response took too long. Please try again.", malformed: "The response was not generated correctly. Please send the question again." },
};

function parseModelAnswer(raw: string): ModelAnswer | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const candidates = [cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (typeof parsed === "string") {
        const nested = JSON.parse(parsed) as unknown;
        if (nested && typeof nested === "object") return nested as ModelAnswer;
      }
      if (parsed && typeof parsed === "object") return parsed as ModelAnswer;
    } catch { /* Try the next safe candidate. */ }
  }
  return null;
}

function sanitizePurchaseContext(value: unknown, fallback: PurchaseContext): PurchaseContext {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Record<string, unknown>;
  const productId = typeof candidate.productId === "string" && products.some((product) => product.id === candidate.productId)
    ? candidate.productId
    : fallback.productId;
  const quantity = typeof candidate.quantity === "number" && Number.isInteger(candidate.quantity) && candidate.quantity > 0 && candidate.quantity <= 100_000_000
    ? candidate.quantity
    : fallback.quantity;
  const destinationCity = typeof candidate.destinationCity === "string" && candidate.destinationCity.trim().length >= 2
    ? candidate.destinationCity.trim().slice(0, 120)
    : fallback.destinationCity;
  return { productId, quantity, destinationCity };
}

function buildSystemInstruction(language: Language, purchaseContext: PurchaseContext, knowledge: string) {
  return `# Role
You are a professional and patient purchasing advisor for the Central Asia Opportunity Portal.

# Communication style
- Always reply in the requested language: ${language}.
- Be concise, natural and practical. Avoid AI-style introductions, repetition and long disclaimers.
- Answer only the user's current question. Never dump the full catalog, all prices, or unrelated information.
- Prefer 1-3 short sentences. Ask at most one follow-up question at a time.

# Product and price rules
- If the requested product is unclear, ask which product they want to know about. Do not list every product or price.
- If the user says "this product", use the page context only to ask a confirmation such as "Do you mean [product]?" Do not assume it is confirmed.
- Once the product is clear, give the China purchase reference price first. Give the local retail reference only if the user asks for it or asks for a comparison.
- Clearly call prices reference prices. Never invent stock, MOQ, final landed price, delivery time, profit, or guarantees.
- For a final quote, collect information gradually in this order: product, quantity, destination city. Ask only for the next missing item.
- Preserve already confirmed purchase details shown in Current purchase context. Update a field only when the user clearly provides or corrects it.
- Use the exact product ID from the website knowledge. Use an empty string or 0 when a value is unknown.
- When product, quantity and destination city are all known, say only that the details are ready for review below. Do not repeat the summary in the answer because the interface renders it separately.

# Human handoff
- Recommend human handoff when the user asks for a final quote, asks to contact an advisor, wants to submit a purchase request, or needs facts unavailable in the knowledge.
- When recommending handoff, briefly say they may contact a local advisor directly or complete the inquiry form and wait for a callback.

# Output
Return structured JSON only. "answer" is the concise reply. "suggestedQuestions" contains 0-3 short, relevant follow-ups in the user's language. "handoffRecommended" controls whether contact and inquiry actions are shown. "missingInformation" lists only information still needed for a quote. "purchaseContext" returns the full updated productId, quantity and destinationCity after this turn.

# Examples
User: How much is this?
Assistant: {"answer":"Which product would you like to check?","suggestedQuestions":[],"handoffRecommended":false,"missingInformation":["product"],"purchaseContext":{"productId":"","quantity":0,"destinationCity":""}}

User: What is the China price for the glass electric kettle?
Assistant: {"answer":"The China purchase reference price is the price shown in the knowledge for the kettle. How many units are you considering?","suggestedQuestions":["Does this include shipping?"],"handoffRecommended":false,"missingInformation":["quantity","destination city"],"purchaseContext":{"productId":"glass-kettle","quantity":0,"destinationCity":""}}

User: I need a final delivered quote.
Assistant: {"answer":"I can help prepare the request. Which product do you need?","suggestedQuestions":[],"handoffRecommended":true,"missingInformation":["product","quantity","destination city"],"purchaseContext":{"productId":"","quantity":0,"destinationCity":""}}

# Current purchase context
${JSON.stringify(purchaseContext)}

# Website knowledge
${knowledge}`;
}

export async function POST(request: Request) {
  let language: Language = "zh";
  try {
    const body = await request.json() as { messages?: ChatMessage[]; country?: CountryCode; language?: Language; viewedProductId?: string | null; purchaseContext?: unknown };
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const countryCode: CountryCode = body.country === "uz" ? "uz" : "kg";
    language = ["zh", "ru", "ky", "uz", "en"].includes(body.language ?? "") ? body.language as Language : "zh";
    const apiKey = process.env.GEMINI_API_KEY || process.env.gemini;
    const viewedProductId = products.some((product) => product.id === body.viewedProductId) ? body.viewedProductId ?? undefined : undefined;
    const purchaseContext = sanitizePurchaseContext(body.purchaseContext, { productId: null, quantity: null, destinationCity: "" });

    if (!apiKey) return NextResponse.json({ error: errorCopy[language].unavailable, handoffRecommended: true }, { status: 503 });
    if (!messages.length || messages.some((message) => !message?.content?.trim() || !["user", "assistant"].includes(message.role))) {
      return NextResponse.json({ error: errorCopy[language].invalid }, { status: 400 });
    }

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const knowledge = await buildChatKnowledge({
      countryCode,
      language,
      viewedProductId,
      purchaseContext,
      latestUserMessage,
    });

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemInstruction(language, purchaseContext, knowledge) }] },
        contents: messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content.trim().slice(0, 2000) }] })),
        generationConfig: {
          maxOutputTokens: 800,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              answer: { type: "STRING" },
              suggestedQuestions: { type: "ARRAY", items: { type: "STRING" } },
              handoffRecommended: { type: "BOOLEAN" },
              missingInformation: { type: "ARRAY", items: { type: "STRING" } },
              purchaseContext: {
                type: "OBJECT",
                properties: {
                  productId: { type: "STRING" },
                  quantity: { type: "INTEGER" },
                  destinationCity: { type: "STRING" },
                },
                required: ["productId", "quantity", "destinationCity"],
              },
            },
            required: ["answer", "suggestedQuestions", "handoffRecommended", "missingInformation", "purchaseContext"],
          },
        },
      }),
    });
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: data.error?.message || errorCopy[language].unavailable, handoffRecommended: true }, { status: 502 });
    const raw = data.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || "").join("").trim() ?? "";
    const parsed = parseModelAnswer(raw);
    if (!parsed || typeof parsed.answer !== "string") {
      return NextResponse.json({ error: errorCopy[language].malformed, suggestions: [], handoffRecommended: false, purchaseContext }, { status: 502 });
    }
    const updatedContext = sanitizePurchaseContext(parsed.purchaseContext, purchaseContext);
    return NextResponse.json({
      message: parsed.answer?.trim() || errorCopy[language].unavailable,
      suggestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions.filter((item) => typeof item === "string" && item.trim()).slice(0, 3) : [],
      handoffRecommended: Boolean(parsed.handoffRecommended),
      purchaseContext: updatedContext,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") return NextResponse.json({ error: errorCopy[language].timeout }, { status: 504 });
    return NextResponse.json({ error: errorCopy[language].unavailable, handoffRecommended: true }, { status: 500 });
  }
}
