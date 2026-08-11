import { NextResponse } from "next/server";
import { countries } from "@/data/countries";
import { prices } from "@/data/prices";
import { products } from "@/data/products";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";

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

const errorCopy: Record<Language, { unavailable: string; invalid: string; timeout: string }> = {
  zh: { unavailable: "AI客服暂时不可用，请稍后重试或联系当地顾问。", invalid: "请输入一个有效的问题。", timeout: "响应时间较长，请稍后重试。" },
  ru: { unavailable: "AI-консультант временно недоступен. Попробуйте позже или свяжитесь с местным консультантом.", invalid: "Введите корректный вопрос.", timeout: "Ответ занимает слишком много времени. Попробуйте позже." },
  ky: { unavailable: "AI кеңешчи убактылуу жеткиликсиз. Кийинчерээк аракет кылыңыз же жергиликтүү кеңешчиге кайрылыңыз.", invalid: "Туура суроо жазыңыз.", timeout: "Жооп узакка созулду. Кийинчерээк аракет кылыңыз." },
  uz: { unavailable: "AI maslahatchi hozircha ishlamayapti. Keyinroq urinib ko‘ring yoki mahalliy maslahatchi bilan bog‘laning.", invalid: "To‘g‘ri savol kiriting.", timeout: "Javob uzoq vaqt olyapti. Keyinroq urinib ko‘ring." },
  en: { unavailable: "The AI assistant is temporarily unavailable. Please try again or contact a local advisor.", invalid: "Please enter a valid question.", timeout: "The response took too long. Please try again." },
};

function buildKnowledge(countryCode: CountryCode, language: Language, viewedProductId?: string) {
  const country = countries[countryCode];
  const countryPrices = prices[countryCode];
  const copy = translations[language];
  const viewedProduct = viewedProductId ? products.find((product) => product.id === viewedProductId) : undefined;
  const productLines = products.map((product) => {
    const price = countryPrices.find((item) => item.productId === product.id);
    return `${product.id} | ${product.name[language]} | ${product.specification[language]} | local retail reference: ${price?.localRetailPrice ?? "n/a"} ${price?.currency ?? ""} | China purchase reference: ${price?.chinaReferencePrice ?? "n/a"} ${price?.currency ?? ""}`;
  });
  const faqLines = copy.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`);
  return [
    `Country: ${country.name[language]} (${countryCode})`,
    `Reply language: ${language}`,
    `Page context product: ${viewedProduct ? `${viewedProduct.name[language]} (${viewedProduct.id})` : "none"}`,
    "The page context is only a hint. If the user says 'this product' without naming it, ask them to confirm the product instead of assuming.",
    "FAQ:",
    ...faqLines,
    "Products and reference prices:",
    ...productLines,
  ].join("\n");
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

function buildSystemInstruction(countryCode: CountryCode, language: Language, viewedProductId: string | undefined, purchaseContext: PurchaseContext) {
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
- When product, quantity and destination city are all known, briefly summarize them and ask the user to confirm before opening the inquiry form.

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
${buildKnowledge(countryCode, language, viewedProductId)}`;
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

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemInstruction(countryCode, language, viewedProductId, purchaseContext) }] },
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
    let parsed: ModelAnswer = {};
    try { parsed = JSON.parse(raw) as ModelAnswer; } catch { parsed = { answer: raw }; }
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
