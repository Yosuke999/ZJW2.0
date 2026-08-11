import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { countries } from "../data/countries";
import { prices as staticPrices } from "../data/prices";
import { products as staticProducts } from "../data/products";
import { translations } from "../data/translations";
import type { Language } from "../data/types";
import {
  categories,
  categoryTranslations,
  knowledgeArticles,
  knowledgeArticleTranslations,
  knowledgeSources,
  markets,
  priceSnapshots,
  productCategories,
  products,
  productTranslations,
} from "../db/schema";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI and Vercel provide environment variables directly.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const sql = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(sql);
const languages: Language[] = ["zh", "ru", "ky", "uz", "en"];
const seededAt = new Date("2026-08-11T00:00:00.000Z");

const faqArticles = [
  { slug: "price-inclusions", topic: "pricing", priority: 100, faqIndex: 0 },
  { slug: "complete-quotation", topic: "platform_process", priority: 90, faqIndex: 1 },
  { slug: "minimum-order-quantity", topic: "minimum_order", priority: 80, faqIndex: 2 },
  { slug: "delivery-time", topic: "delivery", priority: 70, faqIndex: 3 },
  { slug: "sourcing-delivery-services", topic: "sourcing", priority: 60, faqIndex: 4 },
] as const;

const categoryNames: Record<string, Record<Language, string>> = {
  kitchen: { zh: "厨房用品", ru: "Кухня", ky: "Ашкана", uz: "Oshxona", en: "Kitchen" },
  electronics: { zh: "数码电子", ru: "Электроника", ky: "Электроника", uz: "Elektronika", en: "Electronics" },
  lighting: { zh: "照明设备", ru: "Освещение", ky: "Жарыктандыруу", uz: "Yoritish", en: "Lighting" },
  "personal-care": { zh: "个护电器", ru: "Уход за собой", ky: "Жеке кам көрүү", uz: "Shaxsiy parvarish", en: "Personal care" },
  home: { zh: "家居用品", ru: "Товары для дома", ky: "Үй буюмдары", uz: "Uy-roʻzgʻor", en: "Home" },
  auto: { zh: "汽车用品", ru: "Автотовары", ky: "Унаа буюмдары", uz: "Avtomobil buyumlari", en: "Automotive" },
  toys: { zh: "玩具", ru: "Игрушки", ky: "Оюнчуктар", uz: "Oʻyinchoqlar", en: "Toys" },
  bags: { zh: "箱包", ru: "Сумки и рюкзаки", ky: "Сумкалар", uz: "Sumkalar", en: "Bags" },
  tools: { zh: "工具", ru: "Инструменты", ky: "Куралдар", uz: "Asboblar", en: "Tools" },
};

async function seed() {
  for (const country of Object.values(countries)) {
    await db.insert(markets).values({
      code: country.code,
      currency: country.currency,
      defaultLanguage: country.defaultLanguage,
      contactPhone: country.contact.phone,
      telegramUrl: country.contact.telegramUrl,
      whatsappUrl: country.contact.whatsappUrl,
    }).onConflictDoUpdate({
      target: markets.code,
      set: {
        currency: country.currency,
        defaultLanguage: country.defaultLanguage,
        contactPhone: country.contact.phone,
        telegramUrl: country.contact.telegramUrl,
        whatsappUrl: country.contact.whatsappUrl,
        updatedAt: new Date(),
      },
    });
  }

  const categoryIds = new Map<string, string>();
  for (const [displayOrder, [slug, translations]] of Object.entries(categoryNames).entries()) {
    const [category] = await db.insert(categories).values({
      slug,
      displayOrder,
    }).onConflictDoUpdate({
      target: categories.slug,
      set: { displayOrder, status: "active", updatedAt: new Date() },
    }).returning({ id: categories.id });

    categoryIds.set(slug, category.id);
    for (const locale of languages) {
      await db.insert(categoryTranslations).values({
        categoryId: category.id,
        locale,
        name: translations[locale],
      }).onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
        set: { name: translations[locale], status: "approved", updatedAt: new Date() },
      });
    }
  }

  const productIds = new Map<string, string>();
  for (const [displayOrder, product] of staticProducts.entries()) {
    const [databaseProduct] = await db.insert(products).values({
      legacyId: product.id,
      slug: product.id,
      primaryImageUrl: product.image,
      imageStatus: product.imageStatus,
      displayOrder,
      featured: displayOrder < 5,
      unitCode: "piece",
      originCountry: "CN",
      knowledgeUpdatedAt: seededAt,
    }).onConflictDoUpdate({
      target: products.legacyId,
      set: {
        slug: product.id,
        primaryImageUrl: product.image,
        imageStatus: product.imageStatus,
        displayOrder,
        featured: displayOrder < 5,
        unitCode: "piece",
        originCountry: "CN",
        knowledgeUpdatedAt: seededAt,
        status: "active",
        updatedAt: new Date(),
      },
    }).returning({ id: products.id });

    productIds.set(product.id, databaseProduct.id);
    for (const locale of languages) {
      await db.insert(productTranslations).values({
        productId: databaseProduct.id,
        locale,
        name: product.name[locale],
        specification: product.specification[locale],
        shortDescription: product.specification[locale],
        aliases: [product.name[locale]],
      }).onConflictDoUpdate({
        target: [productTranslations.productId, productTranslations.locale],
        set: {
          name: product.name[locale],
          specification: product.specification[locale],
          shortDescription: product.specification[locale],
          aliases: [product.name[locale]],
          status: "approved",
          updatedAt: new Date(),
        },
      });
    }

    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Missing category mapping for ${product.category}`);
    await db.insert(productCategories).values({
      productId: databaseProduct.id,
      categoryId,
      primary: true,
    }).onConflictDoUpdate({
      target: [productCategories.productId, productCategories.categoryId],
      set: { primary: true },
    });
  }

  for (const marketPrices of Object.values(staticPrices)) {
    for (const price of marketPrices) {
      const productId = productIds.get(price.productId);
      if (!productId) throw new Error(`Missing product mapping for ${price.productId}`);

      const existing = await db.select({ id: priceSnapshots.id }).from(priceSnapshots).where(and(
        eq(priceSnapshots.productId, productId),
        eq(priceSnapshots.marketCode, price.country),
        eq(priceSnapshots.confirmedAt, price.confirmedAt),
        eq(priceSnapshots.sourceNote, "initial-static-seed"),
      )).limit(1);

      if (existing.length === 0) {
        const status = price.status === "pending-review" ? "pending_review" : price.status;

        await db.insert(priceSnapshots).values({
          productId,
          marketCode: price.country,
          localRetailPrice: String(price.localRetailPrice),
          chinaReferencePrice: String(price.chinaReferencePrice),
          localPriceMin: String(price.localRetailPrice),
          localPriceMax: String(price.localRetailPrice),
          chinaPriceMin: String(price.chinaReferencePrice),
          chinaPriceMax: String(price.chinaReferencePrice),
          currency: price.currency,
          referenceQuantity: price.referenceQuantity,
          quantityMin: price.referenceQuantity,
          priceUnit: "piece",
          freightIncluded: false,
          customsIncluded: false,
          taxIncluded: false,
          confirmedAt: price.confirmedAt,
          status,
          sourceNote: "initial-static-seed",
        });
      }
    }
  }

  const existingFaqSource = (await db.select({ id: knowledgeSources.id })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.title, "Central Asia Opportunity Portal customer-service policy"))
    .limit(1))[0];

  const sourceId = existingFaqSource?.id ?? (await db.insert(knowledgeSources).values({
    title: "Central Asia Opportunity Portal customer-service policy",
    publisher: "Central Asia Opportunity Portal",
    sourceType: "platform_policy",
    sourceUrl: "https://central-asia-opportunity.vercel.app",
    sourceNote: "Seeded from the reviewed multilingual FAQ in data/translations.ts",
    accessLevel: "public",
    confidenceLevel: 4,
    capturedAt: seededAt,
  }).returning({ id: knowledgeSources.id }))[0]?.id;

  if (!sourceId) throw new Error("Unable to resolve the seeded FAQ knowledge source");

  for (const item of faqArticles) {
    const [article] = await db.insert(knowledgeArticles).values({
      slug: item.slug,
      topic: item.topic,
      scope: "global",
      priority: item.priority,
      status: "approved",
      validFrom: seededAt,
      sourceId,
      reviewedAt: seededAt,
    }).onConflictDoUpdate({
      target: knowledgeArticles.slug,
      set: {
        topic: item.topic,
        scope: "global",
        priority: item.priority,
        status: "approved",
        sourceId,
        reviewedAt: seededAt,
        updatedAt: new Date(),
      },
    }).returning({ id: knowledgeArticles.id });

    for (const locale of languages) {
      const faq = translations[locale].faqs[item.faqIndex];
      await db.insert(knowledgeArticleTranslations).values({
        articleId: article.id,
        locale,
        title: faq.question,
        summary: faq.answer,
        content: faq.answer,
        sampleQuestions: [faq.question],
        keywords: [],
        status: "approved",
        reviewedAt: seededAt,
      }).onConflictDoUpdate({
        target: [knowledgeArticleTranslations.articleId, knowledgeArticleTranslations.locale],
        set: {
          title: faq.question,
          summary: faq.answer,
          content: faq.answer,
          sampleQuestions: [faq.question],
          status: "approved",
          reviewedAt: seededAt,
          updatedAt: new Date(),
        },
      });
    }
  }
}

try {
  await seed();
  console.info(`Seeded ${staticProducts.length} products, ${Object.values(staticPrices).flat().length} price snapshots, and ${faqArticles.length} knowledge articles.`);
} finally {
  await sql.end();
}
