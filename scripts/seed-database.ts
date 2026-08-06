import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { countries } from "../data/countries";
import { prices as staticPrices } from "../data/prices";
import { products as staticProducts } from "../data/products";
import type { Language } from "../data/types";
import {
  categories,
  categoryTranslations,
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
    }).onConflictDoUpdate({
      target: products.legacyId,
      set: {
        slug: product.id,
        primaryImageUrl: product.image,
        imageStatus: product.imageStatus,
        displayOrder,
        featured: displayOrder < 5,
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
      }).onConflictDoUpdate({
        target: [productTranslations.productId, productTranslations.locale],
        set: {
          name: product.name[locale],
          specification: product.specification[locale],
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
          currency: price.currency,
          referenceQuantity: price.referenceQuantity,
          confirmedAt: price.confirmedAt,
          status,
          sourceNote: "initial-static-seed",
        });
      }
    }
  }
}

try {
  await seed();
  console.info(`Seeded ${staticProducts.length} products and ${Object.values(staticPrices).flat().length} price snapshots.`);
} finally {
  await sql.end();
}
