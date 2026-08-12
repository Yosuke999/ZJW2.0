import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const recordStatus = pgEnum("record_status", ["active", "inactive", "archived"]);
export const reviewStatus = pgEnum("review_status", ["draft", "pending_review", "approved", "needs_review"]);
export const priceStatus = pgEnum("price_status", ["demo", "pending_review", "verified", "stale"]);
export const userRole = pgEnum("user_role", ["customer", "staff", "reviewer", "admin"]);
export const inquiryStatus = pgEnum("inquiry_status", ["new", "contacted", "qualified", "closed", "spam"]);
export const inquiryIntentType = pgEnum("inquiry_intent_type", ["callback", "purchase_intent"]);
export const knowledgeTopic = pgEnum("knowledge_topic", [
  "pricing",
  "minimum_order",
  "sourcing",
  "inspection",
  "shipping",
  "customs",
  "payment",
  "delivery",
  "warranty",
  "returns",
  "compliance",
  "platform_process",
  "railway_project",
]);
export const knowledgeScope = pgEnum("knowledge_scope", ["global", "market", "category", "product"]);
export const knowledgeAccessLevel = pgEnum("knowledge_access_level", ["public", "internal", "restricted"]);
export const knowledgeSourceType = pgEnum("knowledge_source_type", [
  "government",
  "carrier",
  "supplier",
  "market_research",
  "platform_policy",
  "internal_record",
]);
export const availabilityStatus = pgEnum("availability_status", ["unknown", "available_on_request", "limited", "unavailable"]);
export const transportMode = pgEnum("transport_mode", ["road", "rail", "multimodal", "air"]);
export const freightCostBasis = pgEnum("freight_cost_basis", ["per_kg", "per_cubic_meter", "per_shipment", "quote_only"]);
export const applicationStatus = pgEnum("application_status", [
  "draft",
  "submitted",
  "in_review",
  "need_more_information",
  "quoted",
  "approved",
  "rejected",
  "completed",
  "cancelled",
]);

export const markets = pgTable("markets", {
  code: varchar("code", { length: 2 }).primaryKey(),
  currency: varchar("currency", { length: 3 }).notNull(),
  defaultLanguage: varchar("default_language", { length: 5 }).notNull(),
  contactPhone: text("contact_phone"),
  telegramUrl: text("telegram_url"),
  whatsappUrl: text("whatsapp_url"),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").default(0).notNull(),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
}, (table) => [index("categories_parent_idx").on(table.parentId, table.displayOrder)]);

export const categoryTranslations = pgTable("category_translations", {
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: reviewStatus("status").default("approved").notNull(),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.categoryId, table.locale] }),
  index("category_translations_locale_idx").on(table.locale),
]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  legacyId: text("legacy_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  primaryImageUrl: text("primary_image_url").notNull(),
  imageStatus: varchar("image_status", { length: 20 }).default("placeholder").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  unitCode: varchar("unit_code", { length: 20 }).default("piece").notNull(),
  originCountry: varchar("origin_country", { length: 2 }).default("CN").notNull(),
  hsCode: varchar("hs_code", { length: 16 }),
  attributes: jsonb("attributes").$type<Record<string, string | number | boolean | null>>().default({}).notNull(),
  packaging: jsonb("packaging").$type<Record<string, string | number | boolean | null>>().default({}).notNull(),
  complianceNotes: text("compliance_notes"),
  knowledgeUpdatedAt: timestamp("knowledge_updated_at", { withTimezone: true }),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
}, (table) => [index("products_listing_idx").on(table.status, table.featured, table.displayOrder)]);

export const productTranslations = pgTable("product_translations", {
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  name: text("name").notNull(),
  specification: text("specification").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  sellingPoints: jsonb("selling_points").$type<string[]>().default([]).notNull(),
  usageNotes: text("usage_notes"),
  aliases: jsonb("aliases").$type<string[]>().default([]).notNull(),
  translatedBy: varchar("translated_by", { length: 30 }),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  status: reviewStatus("status").default("approved").notNull(),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.productId, table.locale] }),
  index("product_translations_locale_idx").on(table.locale),
]);

export const productCategories = pgTable("product_categories", {
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  primary: boolean("primary").default(false).notNull(),
}, (table) => [
  primaryKey({ columns: [table.productId, table.categoryId] }),
  index("product_categories_category_idx").on(table.categoryId, table.productId),
]);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  altText: text("alt_text"),
  displayOrder: integer("display_order").default(0).notNull(),
  owned: boolean("owned").default(false).notNull(),
  ...timestamps,
}, (table) => [index("product_images_product_idx").on(table.productId, table.displayOrder)]);

export const priceSnapshots = pgTable("price_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  marketCode: varchar("market_code", { length: 2 }).notNull().references(() => markets.code),
  localRetailPrice: numeric("local_retail_price", { precision: 18, scale: 2 }).notNull(),
  chinaReferencePrice: numeric("china_reference_price", { precision: 18, scale: 2 }).notNull(),
  chinaPriceMin: numeric("china_price_min", { precision: 18, scale: 2 }),
  chinaPriceMax: numeric("china_price_max", { precision: 18, scale: 2 }),
  localPriceMin: numeric("local_price_min", { precision: 18, scale: 2 }),
  localPriceMax: numeric("local_price_max", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull(),
  referenceQuantity: integer("reference_quantity").notNull(),
  quantityMin: integer("quantity_min"),
  quantityMax: integer("quantity_max"),
  priceUnit: varchar("price_unit", { length: 20 }).default("piece").notNull(),
  incoterm: varchar("incoterm", { length: 10 }),
  freightIncluded: boolean("freight_included").default(false).notNull(),
  customsIncluded: boolean("customs_included").default(false).notNull(),
  taxIncluded: boolean("tax_included").default(false).notNull(),
  confirmedAt: date("confirmed_at", { mode: "string" }).notNull(),
  validUntil: date("valid_until", { mode: "string" }),
  status: priceStatus("status").default("pending_review").notNull(),
  sourceNote: text("source_note"),
  sourceId: uuid("source_id"),
  createdBy: uuid("created_by"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("price_snapshots_latest_idx").on(table.productId, table.marketCode, table.status, table.confirmedAt),
]);

export const sourcingReferences = pgTable("sourcing_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplierName: text("supplier_name"),
  sourceUrl: text("source_url"),
  sourceSku: text("source_sku"),
  minimumOrderQuantity: integer("minimum_order_quantity"),
  purchasePriceMin: numeric("purchase_price_min", { precision: 18, scale: 2 }),
  purchasePriceMax: numeric("purchase_price_max", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  priceUnit: varchar("price_unit", { length: 20 }).default("piece").notNull(),
  marketCode: varchar("market_code", { length: 2 }).references(() => markets.code),
  status: reviewStatus("status").default("pending_review").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  sourceId: uuid("source_id"),
  note: text("note"),
  createdBy: uuid("created_by"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("sourcing_references_product_idx").on(table.productId, table.capturedAt)]);

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  publisher: text("publisher"),
  sourceType: knowledgeSourceType("source_type").notNull(),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  accessLevel: knowledgeAccessLevel("access_level").default("internal").notNull(),
  confidenceLevel: integer("confidence_level").default(3).notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdBy: uuid("created_by"),
  ...timestamps,
}, (table) => [
  check("knowledge_sources_confidence_check", sql`${table.confidenceLevel} BETWEEN 1 AND 5`),
  index("knowledge_sources_access_idx").on(table.accessLevel, table.validUntil),
]);

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  topic: knowledgeTopic("topic").notNull(),
  scope: knowledgeScope("scope").default("global").notNull(),
  marketCode: varchar("market_code", { length: 2 }).references(() => markets.code),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }),
  priority: integer("priority").default(0).notNull(),
  status: reviewStatus("status").default("draft").notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "set null" }),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  check("knowledge_articles_scope_check", sql`
    (${table.scope} = 'global' AND ${table.marketCode} IS NULL AND ${table.productId} IS NULL AND ${table.categoryId} IS NULL)
    OR (${table.scope} = 'market' AND ${table.marketCode} IS NOT NULL AND ${table.productId} IS NULL AND ${table.categoryId} IS NULL)
    OR (${table.scope} = 'product' AND ${table.productId} IS NOT NULL)
    OR (${table.scope} = 'category' AND ${table.categoryId} IS NOT NULL)
  `),
  index("knowledge_articles_lookup_idx").on(table.status, table.topic, table.scope, table.marketCode, table.priority),
]);

export const knowledgeArticleTranslations = pgTable("knowledge_article_translations", {
  articleId: uuid("article_id").notNull().references(() => knowledgeArticles.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  sampleQuestions: jsonb("sample_questions").$type<string[]>().default([]).notNull(),
  keywords: jsonb("keywords").$type<string[]>().default([]).notNull(),
  status: reviewStatus("status").default("draft").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.articleId, table.locale] }),
  index("knowledge_article_translations_lookup_idx").on(table.locale, table.status),
]);

export const productMarketFacts = pgTable("product_market_facts", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  marketCode: varchar("market_code", { length: 2 }).notNull().references(() => markets.code),
  availability: availabilityStatus("availability").default("unknown").notNull(),
  minimumOrderQuantity: integer("minimum_order_quantity"),
  maximumOrderQuantity: integer("maximum_order_quantity"),
  sampleAvailable: boolean("sample_available"),
  productionDaysMin: integer("production_days_min"),
  productionDaysMax: integer("production_days_max"),
  sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  status: reviewStatus("status").default("draft").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  check("product_market_facts_quantity_check", sql`
    (${table.minimumOrderQuantity} IS NULL OR ${table.minimumOrderQuantity} > 0)
    AND (${table.maximumOrderQuantity} IS NULL OR ${table.maximumOrderQuantity} > 0)
    AND (${table.minimumOrderQuantity} IS NULL OR ${table.maximumOrderQuantity} IS NULL OR ${table.minimumOrderQuantity} <= ${table.maximumOrderQuantity})
  `),
  check("product_market_facts_production_days_check", sql`
    (${table.productionDaysMin} IS NULL OR ${table.productionDaysMin} >= 0)
    AND (${table.productionDaysMax} IS NULL OR ${table.productionDaysMax} >= 0)
    AND (${table.productionDaysMin} IS NULL OR ${table.productionDaysMax} IS NULL OR ${table.productionDaysMin} <= ${table.productionDaysMax})
  `),
  index("product_market_facts_lookup_idx").on(table.productId, table.marketCode, table.status, table.confirmedAt),
]);

export const productMarketFactTranslations = pgTable("product_market_fact_translations", {
  factId: uuid("fact_id").notNull().references(() => productMarketFacts.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  availabilityNote: text("availability_note"),
  warrantyNote: text("warranty_note"),
  returnNote: text("return_note"),
  complianceNote: text("compliance_note"),
  status: reviewStatus("status").default("draft").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.factId, table.locale] }),
  index("product_market_fact_translations_lookup_idx").on(table.locale, table.status),
]);

export const shippingRoutes = pgTable("shipping_routes", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  originCountry: varchar("origin_country", { length: 2 }).notNull(),
  originCity: text("origin_city"),
  destinationMarketCode: varchar("destination_market_code", { length: 2 }).notNull().references(() => markets.code),
  destinationCity: text("destination_city"),
  transportMode: transportMode("transport_mode").notNull(),
  transitDaysMin: integer("transit_days_min"),
  transitDaysMax: integer("transit_days_max"),
  costBasis: freightCostBasis("cost_basis").default("quote_only").notNull(),
  costMin: numeric("cost_min", { precision: 18, scale: 4 }),
  costMax: numeric("cost_max", { precision: 18, scale: 4 }),
  currency: varchar("currency", { length: 3 }),
  freightUnit: varchar("freight_unit", { length: 20 }),
  customsIncluded: boolean("customs_included"),
  sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  status: reviewStatus("status").default("draft").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  check("shipping_routes_transit_days_check", sql`
    (${table.transitDaysMin} IS NULL OR ${table.transitDaysMin} >= 0)
    AND (${table.transitDaysMax} IS NULL OR ${table.transitDaysMax} >= 0)
    AND (${table.transitDaysMin} IS NULL OR ${table.transitDaysMax} IS NULL OR ${table.transitDaysMin} <= ${table.transitDaysMax})
  `),
  check("shipping_routes_cost_check", sql`
    (${table.costMin} IS NULL OR ${table.costMin} >= 0)
    AND (${table.costMax} IS NULL OR ${table.costMax} >= 0)
    AND (${table.costMin} IS NULL OR ${table.costMax} IS NULL OR ${table.costMin} <= ${table.costMax})
  `),
  index("shipping_routes_lookup_idx").on(table.destinationMarketCode, table.transportMode, table.status, table.confirmedAt),
]);

export const shippingRouteTranslations = pgTable("shipping_route_translations", {
  routeId: uuid("route_id").notNull().references(() => shippingRoutes.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  limitations: text("limitations"),
  status: reviewStatus("status").default("draft").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.routeId, table.locale] }),
  index("shipping_route_translations_lookup_idx").on(table.locale, table.status),
]);

export const exchangeRateSnapshots = pgTable("exchange_rate_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  quoteCurrency: varchar("quote_currency", { length: 3 }).notNull(),
  rate: numeric("rate", { precision: 24, scale: 10 }).notNull(),
  sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "set null" }),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  status: priceStatus("status").default("pending_review").notNull(),
  createdBy: uuid("created_by"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("exchange_rate_snapshots_rate_check", sql`${table.rate} > 0 AND ${table.baseCurrency} <> ${table.quoteCurrency}`),
  index("exchange_rate_snapshots_lookup_idx").on(table.baseCurrency, table.quoteCurrency, table.status, table.capturedAt),
]);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name"),
  countryCode: varchar("country_code", { length: 2 }).references(() => markets.code),
  preferredLanguage: varchar("preferred_language", { length: 5 }),
  phone: text("phone"),
  telegram: text("telegram"),
  whatsapp: text("whatsapp"),
  city: text("city"),
  contactPreference: varchar("contact_preference", { length: 20 }),
  contactConsentAt: timestamp("contact_consent_at", { withTimezone: true }),
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),
  role: userRole("role").default("customer").notNull(),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
}, (table) => [
  check("profiles_contact_preference_check", sql`${table.contactPreference} IS NULL OR ${table.contactPreference} IN ('phone', 'whatsapp', 'telegram')`),
]);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  intentType: inquiryIntentType("intent_type").default("callback").notNull(),
  deliveryCity: text("delivery_city"),
  customProductName: text("custom_product_name"),
  marketCode: varchar("market_code", { length: 2 }).references(() => markets.code),
  language: varchar("language", { length: 5 }).notNull(),
  name: text("name"),
  email: text("email"),
  contact: text("contact").notNull(),
  channel: varchar("channel", { length: 30 }).notNull(),
  quantity: integer("quantity"),
  budget: numeric("budget", { precision: 18, scale: 2 }),
  message: text("message"),
  source: text("source"),
  status: inquiryStatus("status").default("new").notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  assignedTo: uuid("assigned_to"),
  ...timestamps,
}, (table) => [
  index("inquiries_queue_idx").on(table.status, table.createdAt),
  index("inquiries_user_idx").on(table.userId, table.createdAt),
]);

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitorId: varchar("visitor_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  userId: uuid("user_id"),
  eventName: varchar("event_name", { length: 40 }).notNull(),
  productLegacyId: varchar("product_legacy_id", { length: 80 }),
  marketCode: varchar("market_code", { length: 2 }).notNull().references(() => markets.code),
  language: varchar("language", { length: 5 }).notNull(),
  source: varchar("source", { length: 120 }),
  path: varchar("path", { length: 240 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("analytics_events_name_check", sql`${table.eventName} IN ('page_view', 'product_view', 'consult_open', 'registration', 'inquiry_submit')`),
  index("analytics_events_time_idx").on(table.createdAt),
  index("analytics_events_market_time_idx").on(table.marketCode, table.createdAt),
  index("analytics_events_product_time_idx").on(table.productLegacyId, table.createdAt),
  index("analytics_events_visitor_time_idx").on(table.visitorId, table.createdAt),
]);

export const designApplications = pgTable("design_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationNumber: text("application_number").notNull().unique(),
  userId: uuid("user_id").notNull(),
  marketCode: varchar("market_code", { length: 2 }).references(() => markets.code),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  applicationType: varchar("application_type", { length: 40 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetQuantity: integer("target_quantity"),
  budgetMin: numeric("budget_min", { precision: 18, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  deadline: date("deadline", { mode: "string" }),
  requirements: jsonb("requirements").$type<Record<string, unknown>>().default({}).notNull(),
  status: applicationStatus("status").default("draft").notNull(),
  assignedTo: uuid("assigned_to"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("design_applications_user_idx").on(table.userId, table.createdAt),
  index("design_applications_queue_idx").on(table.status, table.createdAt),
]);

export const applicationAttachments = pgTable("application_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => designApplications.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: uuid("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("application_attachments_application_idx").on(table.applicationId, table.createdAt)]);

export const applicationStatusHistory = pgTable("application_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => designApplications.id, { onDelete: "cascade" }),
  fromStatus: applicationStatus("from_status"),
  toStatus: applicationStatus("to_status").notNull(),
  changedBy: uuid("changed_by").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("application_status_history_idx").on(table.applicationId, table.createdAt)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  beforeData: jsonb("before_data").$type<Record<string, unknown>>(),
  afterData: jsonb("after_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt)]);
