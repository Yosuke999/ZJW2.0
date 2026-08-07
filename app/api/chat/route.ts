import { NextResponse } from "next/server";
import { countries } from "@/data/countries";
import { knowledgeByProduct, knowledgeForCountry, type KnowledgeEntry } from "@/data/knowledge-base";
import type { CountryCode, Language } from "@/data/types";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatRequest = {
  messages?: ChatMessage[];
  country?: CountryCode;
  language?: Language;
  productLegacyId?: string;
};

const supportedLanguages: Language[] = ["zh", "ru", "ky", "uz", "en"];
const humanHandoffTerms = [
  "最终报价",
  "final quote",
  "final price",
  "利润",
  "profit",
  "包税",
  "ddp",
  "清关",
  "customs",
  "付款",
  "payment",
  "投诉",
  "complaint",
  "退款",
  "refund",
  "索赔",
  "claim",
  "保证时效",
  "guarantee",
  "固定到货",
  "exact delivery",
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function latestUserQuery(messages: ChatMessage[]) {
  return messages.filter((message) => message.role === "user").slice(-4).map((message) => message.content).join(" \n");
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => normalize(text).includes(normalize(term)));
}

function shouldHandoffToHuman(query: string) {
  return includesAny(query, humanHandoffTerms);
}

function humanHandoffMessage(language: Language, countryCode: CountryCode) {
  const countryName = countries[countryCode].name[language];
  const copy: Record<Language, string> = {
    zh: `根据现有资料，我可以先说明一般规则，但最终报价、清关合规、付款和投诉必须由人工核验。请补充商品名称和规格、数量、交付城市、是否需要采购/验货/运输/清关/当地交付，以及联系方式，我会转给${countryName}顾问继续跟进。`,
    ru: `По текущим данным я могу описать только общие правила, а окончательную цену, таможенное соответствие, оплату и жалобы должен проверить человек. Пожалуйста, пришлите название и характеристики товара, количество, город доставки, нужные услуги и контакты — я передам это консультанту по рынку ${countryName}.`,
    ky: `Колумдагы маалыматка ылайык мен жалпы эрежелерди гана түшүндүрө алам, ал эми акыркы баа, бажы шайкештиги, төлөм жана даттануулар адам тарабынан текшерилиши керек. Сураныч, товардын атын жана мүнөздөмөсүн, санын, жеткирүү шаарын, керек кызматтарды жана байланыш маалыматын жибериңиз — мен муну ${countryName} боюнча кеңешчиге өткөрөм.`,
    uz: `Mavjud maʼlumotlarga ko‘ra men faqat umumiy qoidalarni tushuntira olaman, yakuniy narx, bojxona mosligi, to‘lov va shikoyatlar esa odam tomonidan tekshirilishi kerak. Iltimos, mahsulot nomi va xususiyatlari, miqdor, yetkazish shahri, kerakli xizmatlar va aloqa maʼlumotini yuboring — men buni ${countryName} maslahatchisiga uzataman.`,
    en: `Based on the current information, I can only explain the general rules, while the final quote, customs compliance, payment, and complaints must be verified by a human advisor. Please send the product name and specification, quantity, delivery city, required services, and contact details, and I will pass it to the ${countryName} advisor for follow-up.`,
  };
  return copy[language];
}

function entryScore(entry: KnowledgeEntry, query: string, productLegacyId?: string) {
  const normalizedQuery = normalize(query);
  const normalizedTitle = normalize(Object.values(entry.title).join(" "));
  const normalizedBody = normalize(Object.values(entry.body).join(" "));
  const normalizedKeywords = entry.keywords.map(normalize);
  let score = {
    quote_rule: 40,
    fulfillment_rule: 35,
    faq_policy: 30,
    contact: 25,
    logistics: 25,
    product_card: 10,
  }[entry.category];

  if (entry.category === "product_card") {
    if (productLegacyId && entry.id === `product-${entry.meta.applicableCountries[0]}-${productLegacyId}`) score += 50;
    if (normalizedQuery.includes(normalizedTitle)) score += 24;
    if (normalizedQuery.includes(normalizedBody)) score += 10;
  }

  for (const keyword of normalizedKeywords) {
    if (keyword && normalizedQuery.includes(keyword)) score += 6;
  }

  if (entry.category === "quote_rule" && includesAny(query, ["价格", "quote", "price", "利润", "profit", "运费", "freight", "税", "tax", "清关", "customs", "包税", "ddp"])) score += 18;
  if (entry.category === "fulfillment_rule" && includesAny(query, ["物流", "route", "路线", "运输", "delivery", "到货", "时效", "track", "班列", "rail"])) score += 18;
  if (entry.category === "contact" && includesAny(query, ["联系", "contact", "电话", "phone", "邮箱", "email", "whatsapp", "telegram"])) score += 18;
  if (entry.category === "faq_policy" && includesAny(query, ["MOQ", "payment", "支付", "退款", "退换", "投诉", "complaint", "认证", "certification", "品牌", "brand"])) score += 18;

  return score;
}

function retrieveKnowledge(countryCode: CountryCode, query: string, productLegacyId?: string) {
  const baseEntries = knowledgeForCountry(countryCode);
  const scored = baseEntries.map((entry) => ({ entry, score: entryScore(entry, query, productLegacyId) }));
  const selected = new Map<string, KnowledgeEntry>();

  const productEntry = productLegacyId ? knowledgeByProduct(countryCode, productLegacyId) : null;
  if (productEntry) selected.set(productEntry.id, productEntry);

  for (const category of ["quote_rule", "fulfillment_rule", "faq_policy", "contact", "logistics"] as const) {
    const best = scored.filter(({ entry }) => entry.category === category).sort((left, right) => right.score - left.score)[0]?.entry;
    if (best) selected.set(best.id, best);
  }

  scored
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .forEach(({ entry }) => selected.set(entry.id, entry));

  return [...selected.values()];
}

function buildKnowledgeContext(entries: KnowledgeEntry[], language: Language) {
  return entries.map((entry) => {
    const updated = `updatedAt=${entry.meta.updatedAt}; countries=${entry.meta.applicableCountries.join(",")}; demo=${entry.meta.isDemoData}; confidence=${entry.meta.confidence}`;
    return [`[${entry.category}] ${entry.title[language]}`, updated, entry.body[language]].join("\n");
  }).join("\n\n");
}

function buildSystemInstruction(language: Language, countryCode: CountryCode, knowledgeContext: string) {
  const countryName = countries[countryCode].name[language];
  return `You are the purchasing advisor for ${countryName}. Reply in ${language}. Use only the retrieved knowledge and the visible chat history. Never describe a reference price difference as profit. Never promise a final quote, fixed delivery time, or full-line direct transport where the knowledge says the route is still under construction. If the user asks for a final quote, customs compliance, payment, refund, or complaint handling, require a human advisor. Structure every answer as: 已知参考信息 / 仍需核验的部分 / 下一步只问一个问题. Ask at most one follow-up question and prefer this order: product → quantity → delivery city → required services → contact details.

Retrieved knowledge:
${knowledgeContext}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ChatRequest;
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const countryCode: CountryCode = body.country === "uz" ? "uz" : "kg";
    const language: Language = supportedLanguages.includes(body.language ?? "zh") ? body.language as Language : "zh";
    const productLegacyId = typeof body.productLegacyId === "string" && /^[a-z0-9-]{1,80}$/i.test(body.productLegacyId) ? body.productLegacyId : undefined;
    const apiKey = process.env.GEMINI_API_KEY || process.env.gemini;

    if (!apiKey) return NextResponse.json({ error: "AI 客服尚未配置，请联系人工顾问。" }, { status: 503 });
    if (!messages.length || messages.some((message) => !message?.content?.trim() || !["user", "assistant"].includes(message.role))) {
      return NextResponse.json({ error: "请输入有效的问题。" }, { status: 400 });
    }

    const query = latestUserQuery(messages);
    if (shouldHandoffToHuman(query)) {
      return NextResponse.json({ message: humanHandoffMessage(language, countryCode) });
    }

    const knowledgeContext = buildKnowledgeContext(retrieveKnowledge(countryCode, query, productLegacyId), language);
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemInstruction(language, countryCode, knowledgeContext) }] },
        contents: messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content.trim().slice(0, 2000) }] })),
        generationConfig: { maxOutputTokens: 1200, temperature: 0.2, thinkingConfig: { thinkingLevel: "low" } },
      }),
    });
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "AI 客服暂时不可用，请稍后再试。" }, { status: 502 });
    const message = data.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || "").join("").trim();
    return NextResponse.json({ message: message || "暂时没有生成有效回复，请联系人工顾问。" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") return NextResponse.json({ error: "AI 响应超时，请稍后重试。" }, { status: 504 });
    return NextResponse.json({ error: "AI 客服暂时无法连接，请稍后再试。" }, { status: 500 });
  }
}
