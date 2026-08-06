import { NextResponse } from "next/server";
import { countries } from "@/data/countries";
import { prices } from "@/data/prices";
import { products } from "@/data/products";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildKnowledge(countryCode: CountryCode, language: Language) {
  const country = countries[countryCode];
  const countryPrices = prices[countryCode];
  const copy = translations[language];
  const productLines = products.map((product) => {
    const price = countryPrices.find((item) => item.productId === product.id);
    return `${product.name[language]} | ${product.specification[language]} | local reference: ${price?.localRetailPrice ?? "n/a"} ${price?.currency ?? ""} | China reference: ${price?.chinaReferencePrice ?? "n/a"} ${price?.currency ?? ""} | reference quantity: ${price?.referenceQuantity ?? 10}`;
  });
  const faqLines = copy.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`);
  return [
    `Country: ${country.name[language]} (${countryCode})`,
    `Currency: ${country.currency}`,
    "FAQ:",
    ...faqLines,
    "Products and reference prices:",
    ...productLines,
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { messages?: ChatMessage[]; country?: CountryCode; language?: Language };
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const countryCode: CountryCode = body.country === "uz" ? "uz" : "kg";
    const language: Language = ["zh", "ru", "ky", "uz", "en"].includes(body.language ?? "") ? body.language as Language : "zh";
    const apiKey = process.env.GEMINI_API_KEY || process.env.gemini;

    if (!apiKey) return NextResponse.json({ error: "AI 客服尚未配置，请联系人工顾问。" }, { status: 503 });
    if (!messages.length || messages.some((message) => !message?.content?.trim() || !["user", "assistant"].includes(message.role))) {
      return NextResponse.json({ error: "请输入有效的问题。" }, { status: 400 });
    }

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `You are the purchasing assistant for Central Asia Opportunity Portal. Answer only from the website information below. Never invent inventory, final prices, MOQ, delivery times, or guarantees. Page prices are demo/reference prices and exclude shipping, customs, tax, and other costs. If the user asks for a final quote or information not present, say that a human advisor must verify it and ask for product, quantity, destination, and contact details. Reply in the user's language, briefly and professionally.\n\n${buildKnowledge(countryCode, language)}` }] },
        contents: messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content.trim().slice(0, 2000) }] })),
        generationConfig: { maxOutputTokens: 500, temperature: 0.2 },
      }),
    });
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "AI 客服暂时不可用，请稍后再试。" }, { status: 502 });
    const message = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    return NextResponse.json({ message: message || "暂时没有生成有效回复，请联系人工顾问。" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") return NextResponse.json({ error: "AI 响应超时，请稍后重试。" }, { status: 504 });
    return NextResponse.json({ error: "AI 客服暂时无法连接，请稍后再试。" }, { status: 500 });
  }
}
