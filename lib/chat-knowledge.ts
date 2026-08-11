import "server-only";

import { and, asc, desc, eq, gt, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { countries } from "@/data/countries";
import { prices as staticPrices } from "@/data/prices";
import { products as staticProducts } from "@/data/products";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { getDatabase } from "@/db/client";
import {
  exchangeRateSnapshots,
  knowledgeArticles,
  knowledgeArticleTranslations,
  priceSnapshots,
  productMarketFacts,
  productMarketFactTranslations,
  products,
  productTranslations,
  shippingRoutes,
  shippingRouteTranslations,
} from "@/db/schema";

type PurchaseContext = { productId: string | null; quantity: number | null; destinationCity: string };

type KnowledgeRequest = {
  countryCode: CountryCode;
  language: Language;
  viewedProductId?: string;
  purchaseContext: PurchaseContext;
  latestUserMessage: string;
};

type ProductKnowledge = {
  databaseId: string;
  legacyId: string;
  name: string;
  specification: string;
  description: string | null;
  shortDescription: string | null;
  aliases: string[];
  unitCode: string;
  attributes: Record<string, string | number | boolean | null>;
  complianceNotes: string | null;
  localPriceMin: string | null;
  localPriceMax: string | null;
  chinaPriceMin: string | null;
  chinaPriceMax: string | null;
  localRetailPrice: string | null;
  chinaReferencePrice: string | null;
  currency: string | null;
  quantityMin: number | null;
  quantityMax: number | null;
  referenceQuantity: number | null;
  priceUnit: string | null;
  incoterm: string | null;
  freightIncluded: boolean | null;
  customsIncluded: boolean | null;
  taxIncluded: boolean | null;
  confirmedAt: string | null;
  validUntil: string | null;
  marketFact?: ProductMarketKnowledge;
};

type ProductMarketKnowledge = {
  productId: string;
  availability: string;
  minimumOrderQuantity: number | null;
  maximumOrderQuantity: number | null;
  sampleAvailable: boolean | null;
  productionDaysMin: number | null;
  productionDaysMax: number | null;
  availabilityNote: string | null;
  warrantyNote: string | null;
  returnNote: string | null;
  complianceNote: string | null;
  confirmedAt: Date | null;
};

type ShippingRouteKnowledge = {
  slug: string;
  name: string;
  summary: string;
  limitations: string | null;
  originCountry: string;
  originCity: string | null;
  destinationCity: string | null;
  transportMode: string;
  transitDaysMin: number | null;
  transitDaysMax: number | null;
  costBasis: string;
  costMin: string | null;
  costMax: string | null;
  currency: string | null;
  freightUnit: string | null;
  customsIncluded: boolean | null;
  confirmedAt: Date | null;
  validUntil: Date | null;
};

type ExchangeRateKnowledge = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  capturedAt: Date;
  validUntil: Date | null;
};

type ArticleKnowledge = {
  topic: string;
  title: string;
  content: string;
  sampleQuestions: string[];
  keywords: string[];
  priority: number;
};

type DatabaseKnowledge = {
  products: ProductKnowledge[];
  articles: ArticleKnowledge[];
  shippingRoutes: ShippingRouteKnowledge[];
  exchangeRates: ExchangeRateKnowledge[];
};

const topicHints: Record<string, string[]> = {
  pricing: ["price", "cost", "多少钱", "价格", "报价", "цена", "стоим", "баа", "narx"],
  minimum_order: ["minimum", "moq", "起订", "最低", "最少", "миним", "минимал", "эң аз", "eng kam"],
  delivery: ["delivery", "arrival", "多久", "到货", "交期", "достав", "срок", "жеткир", "yetkaz"],
  shipping: ["shipping", "freight", "运输", "运费", "物流", "перевоз", "достав", "ташуу", "yetkaz"],
  sourcing: ["source", "purchase", "supplier", "采购", "货源", "供应商", "закуп", "постав", "сатып", "xarid"],
  platform_process: ["quotation", "quote", "process", "完整报价", "怎么购买", "流程", "предлож", "процесс", "сунуш", "jarayon"],
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }).catch(() => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

function normalizedTerms(values: Array<string | null | undefined>) {
  return values.flatMap((value) => value?.toLocaleLowerCase().trim() ? [value.toLocaleLowerCase().trim()] : []);
}

function matchesProduct(product: ProductKnowledge, request: KnowledgeRequest) {
  if (product.legacyId === request.viewedProductId || product.legacyId === request.purchaseContext.productId) return true;
  const question = request.latestUserMessage.toLocaleLowerCase();
  return normalizedTerms([product.legacyId, product.name, ...product.aliases])
    .some((term) => term.length >= 2 && question.includes(term));
}

function relevantArticles(articles: ArticleKnowledge[], question: string) {
  const normalizedQuestion = question.toLocaleLowerCase();
  const scored = articles.map((article) => {
    const directTerms = normalizedTerms([article.title, ...article.sampleQuestions, ...article.keywords]);
    const hintTerms = topicHints[article.topic] ?? [];
    const direct = directTerms.some((term) => term.length >= 3 && normalizedQuestion.includes(term));
    const hinted = hintTerms.some((term) => normalizedQuestion.includes(term));
    return { article, score: direct ? 3 : hinted ? 2 : 0 };
  });
  const matched = scored.filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.article.priority - a.article.priority)
    .map((item) => item.article);
  return (matched.length ? matched : articles).slice(0, 5);
}

function formatPriceRange(min: string | null, max: string | null, fallback: string | null) {
  if (min && max && min !== max) return `${min}-${max}`;
  return min ?? max ?? fallback ?? "n/a";
}

function formatDatabaseKnowledge(data: DatabaseKnowledge, request: KnowledgeRequest) {
  const country = countries[request.countryCode];
  const contextProduct = data.products.find((product) => product.legacyId === request.viewedProductId);
  const detailedProducts = data.products.filter((product) => matchesProduct(product, request)).slice(0, 3);
  const articles = relevantArticles(data.articles, request.latestUserMessage);
  const catalogLines = data.products.map((product) => `${product.legacyId} | ${product.name}`);
  const productLines = detailedProducts.map((product) => {
    const chinaPrice = formatPriceRange(product.chinaPriceMin, product.chinaPriceMax, product.chinaReferencePrice);
    const localPrice = formatPriceRange(product.localPriceMin, product.localPriceMax, product.localRetailPrice);
    const quantity = product.quantityMin ?? product.referenceQuantity ?? "n/a";
    const conditions = [
      `price unit: ${product.priceUnit ?? product.unitCode}`,
      `reference quantity: ${quantity}`,
      `freight included: ${product.freightIncluded === true ? "yes" : "no"}`,
      `customs included: ${product.customsIncluded === true ? "yes" : "no"}`,
      `tax included: ${product.taxIncluded === true ? "yes" : "no"}`,
      `confirmed: ${product.confirmedAt ?? "n/a"}`,
      `valid until: ${product.validUntil ?? "not specified"}`,
    ].join(" | ");
    const structured = Object.keys(product.attributes).length ? ` | attributes: ${JSON.stringify(product.attributes)}` : "";
    const compliance = product.complianceNotes ? ` | compliance: ${product.complianceNotes}` : "";
    const marketFact = product.marketFact ? [
      `market availability: ${product.marketFact.availability}`,
      `MOQ: ${product.marketFact.minimumOrderQuantity ?? "not verified"}`,
      `sample available: ${product.marketFact.sampleAvailable === null ? "not verified" : product.marketFact.sampleAvailable ? "yes" : "no"}`,
      `production days: ${product.marketFact.productionDaysMin ?? "n/a"}-${product.marketFact.productionDaysMax ?? "n/a"}`,
      product.marketFact.availabilityNote,
      product.marketFact.complianceNote,
      product.marketFact.warrantyNote,
      product.marketFact.returnNote,
    ].filter(Boolean).join(" | ") : "market terms: not verified";
    return `${product.legacyId} | ${product.name} | ${product.shortDescription ?? product.specification} | China reference: ${chinaPrice} ${product.currency ?? ""} | local retail reference: ${localPrice} ${product.currency ?? ""} | ${conditions} | ${marketFact}${structured}${compliance}`;
  });
  const articleLines = articles.map((article) => `Topic: ${article.topic}\nQ: ${article.title}\nA: ${article.content}`);
  const routeLines = data.shippingRoutes.slice(0, 5).map((route) => {
    const transit = route.transitDaysMin === null && route.transitDaysMax === null
      ? "not verified"
      : `${route.transitDaysMin ?? "n/a"}-${route.transitDaysMax ?? "n/a"} days`;
    const cost = route.costMin === null && route.costMax === null
      ? "quote required"
      : `${route.costMin ?? "n/a"}-${route.costMax ?? "n/a"} ${route.currency ?? ""} ${route.freightUnit ?? ""}`.trim();
    return `${route.slug} | ${route.name} | ${route.summary} | mode: ${route.transportMode} | transit: ${transit} | cost: ${cost} | customs included: ${route.customsIncluded === null ? "not verified" : route.customsIncluded ? "yes" : "no"} | limitations: ${route.limitations ?? "none recorded"}`;
  });
  const exchangeRateLines = data.exchangeRates.slice(0, 10).map((rate) => (
    `${rate.baseCurrency}/${rate.quoteCurrency}: ${rate.rate} | captured: ${rate.capturedAt.toISOString()} | valid until: ${rate.validUntil?.toISOString() ?? "not specified"}`
  ));

  return [
    `Country: ${country.name[request.language]} (${request.countryCode})`,
    `Reply language: ${request.language}`,
    "Knowledge source: reviewed database records. Treat missing or expired facts as unknown.",
    `Page context product: ${contextProduct ? `${contextProduct.name} (${contextProduct.legacyId})` : "none"}`,
    "The page context is only a hint. If the user says 'this product' without naming it, ask them to confirm the product instead of assuming.",
    "Relevant approved knowledge:",
    ...articleLines,
    "Catalog index (names only; do not list it unless the user explicitly asks):",
    ...catalogLines,
    "Relevant product details:",
    ...(productLines.length ? productLines : ["No product has been confirmed. Ask the user which product they mean."]),
    "Approved shipping routes for this market:",
    ...(routeLines.length ? routeLines : ["No current route terms have been approved. A human advisor must confirm route, timing and cost."]),
    "Verified exchange-rate snapshots:",
    ...(exchangeRateLines.length ? exchangeRateLines : ["No current exchange rate has been verified. Do not perform currency conversion."]),
  ].join("\n");
}

async function loadDatabaseKnowledge(request: KnowledgeRequest): Promise<DatabaseKnowledge> {
  const db = getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const productRows = await db.select({
    databaseId: products.id,
    legacyId: products.legacyId,
    name: productTranslations.name,
    specification: productTranslations.specification,
    description: productTranslations.description,
    shortDescription: productTranslations.shortDescription,
    aliases: productTranslations.aliases,
    unitCode: products.unitCode,
    attributes: products.attributes,
    complianceNotes: products.complianceNotes,
    localPriceMin: priceSnapshots.localPriceMin,
    localPriceMax: priceSnapshots.localPriceMax,
    chinaPriceMin: priceSnapshots.chinaPriceMin,
    chinaPriceMax: priceSnapshots.chinaPriceMax,
    localRetailPrice: priceSnapshots.localRetailPrice,
    chinaReferencePrice: priceSnapshots.chinaReferencePrice,
    currency: priceSnapshots.currency,
    quantityMin: priceSnapshots.quantityMin,
    quantityMax: priceSnapshots.quantityMax,
    referenceQuantity: priceSnapshots.referenceQuantity,
    priceUnit: priceSnapshots.priceUnit,
    incoterm: priceSnapshots.incoterm,
    freightIncluded: priceSnapshots.freightIncluded,
    customsIncluded: priceSnapshots.customsIncluded,
    taxIncluded: priceSnapshots.taxIncluded,
    confirmedAt: priceSnapshots.confirmedAt,
    validUntil: priceSnapshots.validUntil,
  }).from(products)
    .innerJoin(productTranslations, and(
      eq(productTranslations.productId, products.id),
      eq(productTranslations.locale, request.language),
      eq(productTranslations.status, "approved"),
    ))
    .leftJoin(priceSnapshots, and(
      eq(priceSnapshots.productId, products.id),
      eq(priceSnapshots.marketCode, request.countryCode),
      inArray(priceSnapshots.status, ["demo", "verified"]),
      or(isNull(priceSnapshots.validUntil), gte(priceSnapshots.validUntil, today)),
    ))
    .where(eq(products.status, "active"))
    .orderBy(asc(products.displayOrder), desc(priceSnapshots.confirmedAt));

  const productMap = new Map<string, ProductKnowledge>();
  for (const row of productRows) if (!productMap.has(row.legacyId)) productMap.set(row.legacyId, row);
  const marketFactRows = await db.select({
    productId: productMarketFacts.productId,
    availability: productMarketFacts.availability,
    minimumOrderQuantity: productMarketFacts.minimumOrderQuantity,
    maximumOrderQuantity: productMarketFacts.maximumOrderQuantity,
    sampleAvailable: productMarketFacts.sampleAvailable,
    productionDaysMin: productMarketFacts.productionDaysMin,
    productionDaysMax: productMarketFacts.productionDaysMax,
    availabilityNote: productMarketFactTranslations.availabilityNote,
    warrantyNote: productMarketFactTranslations.warrantyNote,
    returnNote: productMarketFactTranslations.returnNote,
    complianceNote: productMarketFactTranslations.complianceNote,
    confirmedAt: productMarketFacts.confirmedAt,
  }).from(productMarketFacts)
    .innerJoin(productMarketFactTranslations, and(
      eq(productMarketFactTranslations.factId, productMarketFacts.id),
      eq(productMarketFactTranslations.locale, request.language),
      eq(productMarketFactTranslations.status, "approved"),
    ))
    .where(and(
      eq(productMarketFacts.marketCode, request.countryCode),
      eq(productMarketFacts.status, "approved"),
      or(isNull(productMarketFacts.validUntil), gt(productMarketFacts.validUntil, now)),
    ))
    .orderBy(desc(productMarketFacts.confirmedAt));
  const marketFactMap = new Map<string, ProductMarketKnowledge>();
  for (const row of marketFactRows) if (!marketFactMap.has(row.productId)) marketFactMap.set(row.productId, row);
  for (const product of productMap.values()) product.marketFact = marketFactMap.get(product.databaseId);

  const currentProduct = request.viewedProductId ? productMap.get(request.viewedProductId) : undefined;
  const articleScope = or(
    eq(knowledgeArticles.scope, "global"),
    and(eq(knowledgeArticles.scope, "market"), eq(knowledgeArticles.marketCode, request.countryCode)),
    ...(currentProduct ? [and(eq(knowledgeArticles.scope, "product"), eq(knowledgeArticles.productId, currentProduct.databaseId))] : []),
  );
  const articleRows = await db.select({
    topic: knowledgeArticles.topic,
    title: knowledgeArticleTranslations.title,
    content: knowledgeArticleTranslations.content,
    sampleQuestions: knowledgeArticleTranslations.sampleQuestions,
    keywords: knowledgeArticleTranslations.keywords,
    priority: knowledgeArticles.priority,
  }).from(knowledgeArticles)
    .innerJoin(knowledgeArticleTranslations, and(
      eq(knowledgeArticleTranslations.articleId, knowledgeArticles.id),
      eq(knowledgeArticleTranslations.locale, request.language),
      eq(knowledgeArticleTranslations.status, "approved"),
    ))
    .where(and(
      eq(knowledgeArticles.status, "approved"),
      lte(knowledgeArticles.validFrom, now),
      or(isNull(knowledgeArticles.validUntil), gt(knowledgeArticles.validUntil, now)),
      articleScope,
    ))
    .orderBy(desc(knowledgeArticles.priority))
    .limit(20);

  const routeRows = await db.select({
    slug: shippingRoutes.slug,
    name: shippingRouteTranslations.name,
    summary: shippingRouteTranslations.summary,
    limitations: shippingRouteTranslations.limitations,
    originCountry: shippingRoutes.originCountry,
    originCity: shippingRoutes.originCity,
    destinationCity: shippingRoutes.destinationCity,
    transportMode: shippingRoutes.transportMode,
    transitDaysMin: shippingRoutes.transitDaysMin,
    transitDaysMax: shippingRoutes.transitDaysMax,
    costBasis: shippingRoutes.costBasis,
    costMin: shippingRoutes.costMin,
    costMax: shippingRoutes.costMax,
    currency: shippingRoutes.currency,
    freightUnit: shippingRoutes.freightUnit,
    customsIncluded: shippingRoutes.customsIncluded,
    confirmedAt: shippingRoutes.confirmedAt,
    validUntil: shippingRoutes.validUntil,
  }).from(shippingRoutes)
    .innerJoin(shippingRouteTranslations, and(
      eq(shippingRouteTranslations.routeId, shippingRoutes.id),
      eq(shippingRouteTranslations.locale, request.language),
      eq(shippingRouteTranslations.status, "approved"),
    ))
    .where(and(
      eq(shippingRoutes.destinationMarketCode, request.countryCode),
      eq(shippingRoutes.status, "approved"),
      or(isNull(shippingRoutes.validUntil), gt(shippingRoutes.validUntil, now)),
    ))
    .orderBy(desc(shippingRoutes.confirmedAt))
    .limit(20);

  const marketCurrency = countries[request.countryCode].currency;
  const rateRows = await db.select({
    baseCurrency: exchangeRateSnapshots.baseCurrency,
    quoteCurrency: exchangeRateSnapshots.quoteCurrency,
    rate: exchangeRateSnapshots.rate,
    capturedAt: exchangeRateSnapshots.capturedAt,
    validUntil: exchangeRateSnapshots.validUntil,
  }).from(exchangeRateSnapshots)
    .where(and(
      eq(exchangeRateSnapshots.status, "verified"),
      or(isNull(exchangeRateSnapshots.validUntil), gt(exchangeRateSnapshots.validUntil, now)),
      or(
        inArray(exchangeRateSnapshots.baseCurrency, ["CNY", "USD", marketCurrency]),
        inArray(exchangeRateSnapshots.quoteCurrency, ["CNY", "USD", marketCurrency]),
      ),
    ))
    .orderBy(desc(exchangeRateSnapshots.capturedAt))
    .limit(20);

  if (!productMap.size) throw new Error("No approved product knowledge is available");
  return { products: [...productMap.values()], articles: articleRows, shippingRoutes: routeRows, exchangeRates: rateRows };
}

function buildStaticFallback(request: KnowledgeRequest) {
  const country = countries[request.countryCode];
  const countryPrices = staticPrices[request.countryCode];
  const copy = translations[request.language];
  const viewedProduct = request.viewedProductId ? staticProducts.find((product) => product.id === request.viewedProductId) : undefined;
  const question = request.latestUserMessage.toLocaleLowerCase();
  const selectedProducts = staticProducts.filter((product) => (
    product.id === request.viewedProductId
    || product.id === request.purchaseContext.productId
    || normalizedTerms([product.id, product.name[request.language]]).some((term) => question.includes(term))
  )).slice(0, 3);
  const catalogLines = staticProducts.map((product) => `${product.id} | ${product.name[request.language]}`);
  const productLines = selectedProducts.map((product) => {
    const price = countryPrices.find((item) => item.productId === product.id);
    return `${product.id} | ${product.name[request.language]} | ${product.specification[request.language]} | local retail reference: ${price?.localRetailPrice ?? "n/a"} ${price?.currency ?? ""} | China purchase reference: ${price?.chinaReferencePrice ?? "n/a"} ${price?.currency ?? ""}`;
  });
  const faqLines = copy.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`);
  return [
    `Country: ${country.name[request.language]} (${request.countryCode})`,
    `Reply language: ${request.language}`,
    "Knowledge source: static fallback. Treat unavailable facts as unknown.",
    `Page context product: ${viewedProduct ? `${viewedProduct.name[request.language]} (${viewedProduct.id})` : "none"}`,
    "The page context is only a hint. If the user says 'this product' without naming it, ask them to confirm the product instead of assuming.",
    "FAQ:",
    ...faqLines,
    "Catalog index (names only; do not list it unless the user explicitly asks):",
    ...catalogLines,
    "Relevant product details:",
    ...(productLines.length ? productLines : ["No product has been confirmed. Ask the user which product they mean."]),
  ].join("\n");
}

export async function buildChatKnowledge(request: KnowledgeRequest) {
  if (process.env.DATABASE_URL) {
    const databaseKnowledge = await withTimeout(loadDatabaseKnowledge(request), 3_000);
    if (databaseKnowledge) return formatDatabaseKnowledge(databaseKnowledge, request);
  }
  return buildStaticFallback(request);
}
