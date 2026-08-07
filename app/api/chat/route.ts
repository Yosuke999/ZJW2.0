import { NextResponse } from "next/server";
import { countries } from "@/data/countries";
import { knowledgeByProduct, knowledgeForCountry, type KnowledgeEntry } from "@/data/knowledge-base";
import { products } from "@/data/products";
import type { CountryCode, Language } from "@/data/types";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatRequest = {
  messages?: ChatMessage[];
  country?: CountryCode;
  language?: Language;
  productLegacyId?: string;
};

type QuoteDraft = {
  productName: string;
  quantity: string;
  deliveryCity: string;
  services: string[];
  contact: string;
  country: CountryCode;
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
const paymentTerms = ["付款", "payment", "pay", "支付", "怎么付", "如何付款", "付款方式", "收款"];
const quoteIntentTerms = ["报价", "quote", "询价", "咨询", "多少钱", "成本", "到货", "运费", "采购", "下单", "服务"];
const cityTerms = [
  "比什凯克", "奥什", "贾拉拉巴德", "纳伦", "安集延", "塔什干", "撒马尔罕", "布哈拉", "卡尔希", "纳沃伊",
  "bishkek", "osh", "jalal-abad", "naryn", "andijan", "tashkent", "samarkand", "bukhara", "karsi", "navoi",
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

function isPaymentQuestion(query: string) {
  return includesAny(query, paymentTerms);
}

function shouldCollectQuoteFields(query: string) {
  return includesAny(query, quoteIntentTerms) || includesAny(query, paymentTerms);
}

function humanHandoffMessage(language: Language, countryCode: CountryCode) {
  const countryName = countries[countryCode].name[language];
  const copy: Record<Language, string> = {
    zh: `根据现有资料，我可以先说明一般规则，但最终报价、清关合规、投诉和索赔必须由人工核验。请补充商品名称和规格、数量、交付城市、是否需要采购/验货/运输/清关/当地交付，以及联系方式，我会转给${countryName}顾问继续跟进。`,
    ru: `По текущим данным я могу описать только общие правила, а окончательную цену, таможенное соответствие, жалобы и претензии должен проверить человек. Пожалуйста, пришлите название и характеристики товара, количество, город доставки, нужные услуги и контакты — я передам это консультанту по рынку ${countryName}.`,
    ky: `Колумдагы маалыматка ылайык мен жалпы эрежелерди гана түшүндүрө алам, ал эми акыркы баа, бажы шайкештиги, даттануулар жана доолор адам тарабынан текшерилиши керек. Сураныч, товардын атын жана мүнөздөмөсүн, санын, жеткирүү шаарын, керек кызматтарды жана байланыш маалыматын жибериңиз — мен муну ${countryName} боюнча кеңешчиге өткөрөм.`,
    uz: `Mavjud maʼlumotlarga ko‘ra men faqat umumiy qoidalarni tushuntira olaman, yakuniy narx, bojxona mosligi, shikoyatlar va da’volar esa odam tomonidan tekshirilishi kerak. Iltimos, mahsulot nomi va xususiyatlari, miqdor, yetkazish shahri, kerakli xizmatlar va aloqa maʼlumotini yuboring — men buni ${countryName} maslahatchisiga uzataman.`,
    en: `Based on the current information, I can only explain the general rules, while the final quote, customs compliance, complaints, and claims must be verified by a human advisor. Please send the product name and specification, quantity, delivery city, required services, and contact details, and I will pass it to the ${countryName} advisor for follow-up.`,
  };
  return copy[language];
}

function paymentExplanationMessage(language: Language) {
  const copy: Record<Language, string> = {
    zh: "付款说明：我们可以解释付款方式和注意事项，但网站暂时不提供在线收款链接或站内支付入口。具体付款方式会在确认商品、数量、交付城市和服务范围后，由人工顾问单独说明。",
    ru: "Пояснение по оплате: мы можем объяснить способы оплаты и важные условия, но на сайте пока нет онлайн-платежа или ссылки для оплаты. Конкретный способ оплаты консультант объяснит после подтверждения товара, количества, города доставки и объёма услуг.",
    ky: "Төлөм жөнүндө: биз төлөм ыкмаларын жана маанилүү шарттарды түшүндүрө алабыз, бирок сайтта азырынча онлайн төлөм шилтемеси же ички төлөм киргизүү жок. Так төлөм ыкмасы товар, сан, жеткирүү шаары жана кызмат көлөмү такталгандан кийин адам тарабынан түшүндүрүлөт.",
    uz: "Toʻlov haqida: biz toʻlov usullari va muhim shartlarni tushuntira olamiz, lekin saytimizda hozircha onlayn toʻlov havolasi yoki ichki toʻlov yoʻq. Aniq toʻlov usuli mahsulot, miqdor, yetkazish shahri va xizmat doirasi tasdiqlangandan keyin maslahatchi tomonidan tushuntiriladi.",
    en: "Payment note: we can explain payment methods and key conditions, but the site does not yet offer an online payment link or in-site payment flow. The exact payment method will be explained by a human advisor after the product, quantity, delivery city, and service scope are confirmed.",
  };
  return copy[language];
}

function findProductInQuery(countryCode: CountryCode, query: string) {
  const normalizedQuery = normalize(query);
  const countryProducts = products.filter((product) => knowledgeByProduct(countryCode, product.id));
  return countryProducts.find((product) => normalizedQuery.includes(normalize(product.name.zh)) || normalizedQuery.includes(normalize(product.name.ru)) || normalizedQuery.includes(normalize(product.name.ky)) || normalizedQuery.includes(normalize(product.name.uz)) || normalizedQuery.includes(normalize(product.name.en)));
}

function extractQuantity(query: string) {
  const match = query.match(/(?:^|\D)(\d{1,6})(?:\s*(?:台|件|个|套|箱|pcs|units|pieces|шт|д|даана|dona))?/i);
  return match?.[1] ?? null;
}

function extractDeliveryCity(query: string) {
  return cityTerms.find((city) => normalize(query).includes(normalize(city))) ?? null;
}

function extractServices(query: string) {
  const services = new Set<string>();
  if (includesAny(query, ["采购", "sourcing", "buy"])) services.add("采购");
  if (includesAny(query, ["验货", "inspection", "check"])) services.add("验货");
  if (includesAny(query, ["运输", "shipping", "freight", "cargo"])) services.add("运输");
  if (includesAny(query, ["清关", "customs", "clearance"])) services.add("清关");
  if (includesAny(query, ["交付", "delivery", "last mile", "派送"])) services.add("当地交付");
  return [...services];
}

function extractContact(query: string) {
  const email = query.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) return email;
  const phone = query.match(/(?:\+?\d[\d\s-]{6,}\d)/)?.[0];
  return phone?.trim() ?? null;
}

function inferQuoteDraft(countryCode: CountryCode, query: string, productLegacyId?: string): QuoteDraft | null {
  const product = productLegacyId ? products.find((item) => item.id === productLegacyId) ?? null : findProductInQuery(countryCode, query) ?? null;
  if (!product) return null;
  const quantity = extractQuantity(query);
  const deliveryCity = extractDeliveryCity(query);
  const services = extractServices(query);
  const contact = extractContact(query);
  if (!quantity || !deliveryCity || !services.length || !contact) return null;
  return {
    productName: product.name.zh,
    quantity,
    deliveryCity,
    services,
    contact,
    country: countryCode,
  };
}

function nextMissingField(language: Language, state: { productKnown: boolean; quantity: string | null; deliveryCity: string | null; services: string[]; contact: string | null }) {
  const copy: Record<Language, Record<string, string>> = {
    zh: { product: "请先告诉我您要咨询哪一个商品。", quantity: "您预计采购多少台/件？", deliveryCity: "您希望送到哪个城市？", services: "您需要哪些服务：采购、验货、运输、清关、当地交付？", contact: "请留下电话或邮箱，我把报价需求单转给当地顾问。" },
    ru: { product: "Сначала напишите, какой товар вы хотите обсудить.", quantity: "Какое количество вы планируете?", deliveryCity: "В какой город нужно доставить?", services: "Какие услуги нужны: закупка, проверка, перевозка, таможня, местная доставка?", contact: "Оставьте телефон или e-mail, и я передам запрос консультанту." },
    ky: { product: "Адегенде кайсы товар боюнча сүйлөшүп жатканыңызды жазыңыз.", quantity: "Канча даана/бирдик сатып алууну пландап жатасыз?", deliveryCity: "Кайсы шаарга жеткирели?", services: "Кайсы кызматтар керек: сатып алуу, текшерүү, ташуу, бажы, жергиликтүү жеткирүү?", contact: "Телефон же email калтырыңыз, мен сурооңузду кеңешчиге өткөрөм." },
    uz: { product: "Avval qaysi mahsulotni so‘rayotganingizni yozing.", quantity: "Necha dona olishni rejalashtiryapsiz?", deliveryCity: "Qaysi shaharga yetkazamiz?", services: "Qaysi xizmatlar kerak: xarid, tekshiruv, tashish, bojxona, mahalliy yetkazish?", contact: "Telefon yoki email qoldiring, so‘rovni maslahatchiga uzataman." },
    en: { product: "First tell me which product you want to discuss.", quantity: "How many units do you plan to buy?", deliveryCity: "Which city should it be delivered to?", services: "Which services do you need: sourcing, inspection, transport, customs, local delivery?", contact: "Please leave a phone number or email so I can pass the request to an advisor." },
  };

  if (!state.productKnown) return copy[language].product;
  if (!state.quantity) return copy[language].quantity;
  if (!state.deliveryCity) return copy[language].deliveryCity;
  if (!state.services.length) return copy[language].services;
  if (!state.contact) return copy[language].contact;
  return null;
}

function buildQuoteDraftMessage(language: Language, draft: QuoteDraft) {
  const services = draft.services.join("、");
  const copy: Record<Language, string> = {
    zh: `我已整理报价需求单：商品是 ${draft.productName}，数量 ${draft.quantity}，交付城市 ${draft.deliveryCity}，需要 ${services}，联系方式 ${draft.contact}。我会转给当地顾问继续核验价格、路线和履约细节。`,
    ru: `Я собрал запрос на расчёт: товар — ${draft.productName}, количество — ${draft.quantity}, город доставки — ${draft.deliveryCity}, нужны услуги: ${services}, контакт — ${draft.contact}. Я передам это местному консультанту для проверки цены, маршрута и деталей исполнения.`,
    ky: `Мен баа суроосу боюнча маалыматты топтодум: товар ${draft.productName}, саны ${draft.quantity}, жеткирүү шаары ${draft.deliveryCity}, керек кызматтар ${services}, байланыш ${draft.contact}. Муну жергиликтүү кеңешчиге баа, багыт жана аткаруу шарттарын текшерүү үчүн өткөрөм.`,
    uz: `Men narx so‘rovi bo‘yicha maʼlumotni tayyorladim: mahsulot ${draft.productName}, miqdor ${draft.quantity}, yetkazish shahri ${draft.deliveryCity}, kerakli xizmatlar ${services}, aloqa ${draft.contact}. Buni mahalliy maslahatchiga narx, yoʻnalish va bajarish tafsilotlarini tekshirish uchun uzataman.`,
    en: `I have prepared a quote request: product ${draft.productName}, quantity ${draft.quantity}, delivery city ${draft.deliveryCity}, needed services ${services}, contact ${draft.contact}. I will pass it to a local advisor to verify the price, route, and fulfilment details.`,
  };
  return copy[language];
}

function buildFieldState(countryCode: CountryCode, query: string, productLegacyId?: string) {
  const product = productLegacyId ? products.find((item) => item.id === productLegacyId) ?? null : findProductInQuery(countryCode, query) ?? null;
  const quantity = extractQuantity(query);
  const deliveryCity = extractDeliveryCity(query);
  const services = extractServices(query);
  const contact = extractContact(query);
  return { productKnown: Boolean(product), quantity, deliveryCity, services, contact };
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
  return `You are the purchasing advisor for ${countryName}. Reply in ${language}. Use only the retrieved knowledge and the visible chat history. Never describe a reference price difference as profit. Never promise a final quote, fixed delivery time, or full-line direct transport where the knowledge says the route is still under construction. If the user asks for payment methods, explain that the site does not offer an online payment link and payment is confirmed by a human advisor later. If the user asks for a final quote, customs compliance, complaints, or claims, require a human advisor. Structure every answer as: 已知参考信息 / 仍需核验的部分 / 下一步只问一个问题. Ask at most one follow-up question and prefer this order: product → quantity → delivery city → required services → contact details.

Retrieved knowledge:
${knowledgeContext}`;
}

function latestUserContext(messages: ChatMessage[]) {
  return messages.filter((message) => message.role === "user").slice(-1)[0]?.content ?? "";
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
      return NextResponse.json({ message: humanHandoffMessage(language, countryCode), intent: "handoff" });
    }

    if (isPaymentQuestion(query)) {
      const paymentMessage = paymentExplanationMessage(language);
      const nextField = nextMissingField(language, buildFieldState(countryCode, latestUserContext(messages), productLegacyId));
      return NextResponse.json({ message: nextField ? `${paymentMessage}\n\n${nextField}` : paymentMessage, intent: "payment_info" });
    }

    if (shouldCollectQuoteFields(query)) {
      const draft = inferQuoteDraft(countryCode, query, productLegacyId);
      if (draft) {
        return NextResponse.json({ message: buildQuoteDraftMessage(language, draft), intent: "quote_draft", quoteDraft: draft });
      }
      const nextField = nextMissingField(language, buildFieldState(countryCode, query, productLegacyId));
      if (nextField) {
        const intro: Record<Language, string> = {
          zh: "已知参考信息：我可以先帮您整理报价需求。\n仍需核验的部分：",
          ru: "Известно: я могу сначала собрать запрос на расчёт.\nТребует проверки:",
          ky: "Белгилүү маалымат: мен адегенде баа суроосун иреттей алам.\nТекшериле турган бөлүк:",
          uz: "Maʼlum maʼlumot: men avval narx soʻrovini tayyorlay olaman.\nTekshirilishi kerak boʻlgan qism:",
          en: "Known info: I can first organize the quote request.\nNeeds verification:",
        };
        return NextResponse.json({ message: `${intro[language]} ${nextField}`, intent: "clarify" });
      }
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
