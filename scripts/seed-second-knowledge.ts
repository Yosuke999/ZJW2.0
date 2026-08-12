import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  knowledgeSources,
  productMarketFacts,
  productMarketFactTranslations,
  products,
  shippingRoutes,
  shippingRouteTranslations,
} from "../db/schema";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI and hosted runtimes provide environment variables directly.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed the second knowledge batch");

const sql = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(sql);
const capturedAt = new Date("2026-08-07T00:00:00.000Z");

const complianceNotes: Record<string, string> = {
  "glass-kettle": "核验额定电压、插头标准、玻璃防碎包装和目的国电器认证。",
  "power-bank": "核验电芯容量、额定能量、UN38.3、MSDS及承运渠道限制，不得按普通无电百货直接报价。",
  "led-bulb": "核验电压、色温、寿命标称、灯头标准和易碎防压包装。",
  "tws-earbuds": "核验内置锂电池、蓝牙或无线认证、品牌风险和电池资料。",
  "hair-dryer": "核验功率、电压、插头、过热保护和目的国认证要求。",
  "pd-charger": "核验快充协议、功率标称、插头、安规认证和品牌风险。",
  "type-c-cable": "核验线芯、实际承载功率、接口品质和品牌标识。",
  "power-strip": "核验插座制式、线径、额定电流、阻燃材料和安规认证。",
  "hair-clipper": "核验电池容量、刀头包装、充电规格和个人护理电器认证。",
  flashlight: "核验电池资料、流明标称、强光产品渠道限制和防压包装。",
  "car-holder": "核验适配车型、夹持尺寸和塑料件防压要求。",
  "thermal-jug": "核验内胆材质、食品接触材料要求、密封和防凹包装。",
  "steam-iron": "核验功率、电压、插头、水箱防漏并在运输前排空。",
  "desk-lamp": "核验电池资料、照明参数、开关防误触和防压包装。",
  shaver: "核验电池资料、刀头防护、充电规格和个人护理电器认证。",
  "kitchen-scale": "核验电池类型、计量精度和目的国计量要求。",
  "toy-car": "核验年龄标识、尖角和小零件、涂层、玩具安全认证及知识产权风险。",
  backpack: "核验面料、拉链、容量、缝制质量和商标风险。",
  umbrella: "核验伞骨材质、开合安全、包装长度和防锈要求。",
  "screwdriver-set": "核验批头材质、规格组合、尖锐部件申报和包装固定。",
};

const routeDrafts = [
  {
    slug: "cn-kashgar-kg-osh-multimodal",
    marketCode: "kg",
    destinationCity: "奥什",
    mode: "multimodal",
    name: "中国—喀什—奥什公铁联运",
    summary: "中国货源可先集运至喀什，再经公路口岸进入吉尔吉斯斯坦并在奥什方向分拨。",
    limitations: "班次、口岸、箱源和时效必须按订单重新确认；不得表述为中吉乌新铁路已经全线通车。",
  },
  {
    slug: "cn-kashgar-uz-andijan-multimodal",
    marketCode: "uz",
    destinationCity: "安集延",
    mode: "multimodal",
    name: "中国—喀什—奥什—安集延公铁联运",
    summary: "当前可按货物条件组织中国境内集货、跨境公路和乌兹别克斯坦境内铁路或公路分拨。",
    limitations: "不承诺固定班期、固定时效或固定运价，最终方案取决于货物属性、数量和目的城市。",
  },
  {
    slug: "cn-kazakhstan-uz-rail",
    marketCode: "uz",
    destinationCity: null,
    mode: "rail",
    name: "经哈萨克斯坦进入乌兹别克斯坦的既有铁路通道",
    summary: "货物可经阿拉山口或霍尔果斯进入哈萨克斯坦铁路网，再衔接乌兹别克斯坦。",
    limitations: "适合大批量和集装箱运输，但对中国南部或喀什周边货源可能绕行，需逐票比较。",
  },
  {
    slug: "cn-kg-road",
    marketCode: "kg",
    destinationCity: null,
    mode: "road",
    name: "中国至吉尔吉斯斯坦公路运输",
    summary: "适合零担、小批量、需要灵活提送货或目的地远离铁路站的订单。",
    limitations: "单位成本、冬季天气、边境排队和车辆接力具有不确定性，需按订单询价。",
  },
  {
    slug: "cn-uz-air",
    marketCode: "uz",
    destinationCity: null,
    mode: "air",
    name: "中国至乌兹别克斯坦航空运输",
    summary: "适合样品、小批高货值和紧急补货。",
    limitations: "计费重量和敏感货限制需单独核验，不得直接套用陆运报价。",
  },
] as const;

async function resolveSourceId() {
  const title = "中吉乌铁路商贸 RAG 知识库基础稿 v0.1";
  const existing = (await db.select({ id: knowledgeSources.id })
    .from(knowledgeSources).where(eq(knowledgeSources.title, title)).limit(1))[0];
  if (existing) return existing.id;
  return (await db.insert(knowledgeSources).values({
    title,
    publisher: "中吉乌商机网",
    sourceType: "internal_record",
    sourceNote: "第二批知识草稿，运输线路和商品核验重点须经业务人员及当地顾问审核后才能公开。",
    accessLevel: "internal",
    confidenceLevel: 3,
    capturedAt,
  }).returning({ id: knowledgeSources.id }))[0].id;
}

async function seedSecondKnowledge() {
  const sourceId = await resolveSourceId();
  const databaseProducts = await db.select({ id: products.id, legacyId: products.legacyId }).from(products);
  let factCount = 0;

  for (const product of databaseProducts) {
    const complianceNote = complianceNotes[product.legacyId];
    if (!complianceNote) continue;
    for (const marketCode of ["kg", "uz"] as const) {
      const existing = (await db.select({ id: productMarketFacts.id }).from(productMarketFacts).where(and(
        eq(productMarketFacts.productId, product.id),
        eq(productMarketFacts.marketCode, marketCode),
        eq(productMarketFacts.sourceId, sourceId),
        eq(productMarketFacts.status, "draft"),
      )).limit(1))[0];
      const factId = existing?.id ?? (await db.insert(productMarketFacts).values({
        productId: product.id,
        marketCode,
        availability: "unknown",
        sourceId,
        status: "draft",
      }).returning({ id: productMarketFacts.id }))[0].id;

      await db.insert(productMarketFactTranslations).values({
        factId,
        locale: "zh",
        availabilityNote: "可提交询价；是否可采购、运输和进口必须按实际规格及目的国要求审核。",
        complianceNote,
        status: "draft",
      }).onConflictDoUpdate({
        target: [productMarketFactTranslations.factId, productMarketFactTranslations.locale],
        set: {
          availabilityNote: "可提交询价；是否可采购、运输和进口必须按实际规格及目的国要求审核。",
          complianceNote,
          status: "draft",
          updatedAt: new Date(),
        },
      });
      factCount += 1;
    }
  }

  for (const route of routeDrafts) {
    const [databaseRoute] = await db.insert(shippingRoutes).values({
      slug: route.slug,
      originCountry: "CN",
      originCity: route.slug.includes("kashgar") ? "喀什" : null,
      destinationMarketCode: route.marketCode,
      destinationCity: route.destinationCity,
      transportMode: route.mode,
      costBasis: "quote_only",
      customsIncluded: null,
      sourceId,
      status: "draft",
    }).onConflictDoUpdate({
      target: shippingRoutes.slug,
      set: {
        destinationMarketCode: route.marketCode,
        destinationCity: route.destinationCity,
        transportMode: route.mode,
        costBasis: "quote_only",
        customsIncluded: null,
        sourceId,
        status: "draft",
        updatedAt: new Date(),
      },
    }).returning({ id: shippingRoutes.id });

    await db.insert(shippingRouteTranslations).values({
      routeId: databaseRoute.id,
      locale: "zh",
      name: route.name,
      summary: route.summary,
      limitations: route.limitations,
      status: "draft",
    }).onConflictDoUpdate({
      target: [shippingRouteTranslations.routeId, shippingRouteTranslations.locale],
      set: {
        name: route.name,
        summary: route.summary,
        limitations: route.limitations,
        status: "draft",
        updatedAt: new Date(),
      },
    });
  }

  console.info(`Seeded ${factCount} draft product-market facts and ${routeDrafts.length} draft shipping routes. No exchange rates were invented.`);
}

try {
  await seedSecondKnowledge();
} finally {
  await sql.end();
}
