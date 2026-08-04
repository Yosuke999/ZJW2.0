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
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
}, (table) => [index("products_listing_idx").on(table.status, table.featured, table.displayOrder)]);

export const productTranslations = pgTable("product_translations", {
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  name: text("name").notNull(),
  specification: text("specification").notNull(),
  description: text("description"),
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
  currency: varchar("currency", { length: 3 }).notNull(),
  referenceQuantity: integer("reference_quantity").notNull(),
  confirmedAt: date("confirmed_at", { mode: "string" }).notNull(),
  status: priceStatus("status").default("pending_review").notNull(),
  sourceNote: text("source_note"),
  createdBy: uuid("created_by"),
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
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  note: text("note"),
  createdBy: uuid("created_by"),
  ...timestamps,
}, (table) => [index("sourcing_references_product_idx").on(table.productId, table.capturedAt)]);

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
