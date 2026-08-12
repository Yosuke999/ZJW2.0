import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  knowledgeArticles,
  knowledgeArticleTranslations,
  knowledgeSources,
  shippingRoutes,
  shippingRouteTranslations,
} from "../db/schema";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI and hosted runtimes provide environment variables directly.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed knowledge articles");

const sql = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(sql);
const capturedAt = new Date("2026-08-11T00:00:00.000Z");

const sourceDefinitions = {
  internal: {
    title: "中吉乌铁路商贸 RAG 知识库基础稿 v0.1",
    publisher: "中吉乌商机网",
    sourceType: "internal_record" as const,
    sourceNote: "业务基础稿；涉及报价、时效、可运性和监管结论的内容仍须逐票复核。",
    accessLevel: "internal" as const,
    confidenceLevel: 3,
  },
  constructionStatus: {
    title: "中吉乌铁路建设项目登记信息",
    publisher: "吉尔吉斯共和国建设、建筑和住房公用事业部",
    sourceType: "government" as const,
    sourceUrl: "https://minstroy.gov.kg/ru/building/passport/legal/2025003876",
    sourceNote: "项目页面标记为在建；页面日期是项目登记信息，不作为运营开通承诺。",
    accessLevel: "public" as const,
    confidenceLevel: 5,
  },
  customsUpdate: {
    title: "中吉乌铁路建设物资海关保障工作会（2026-07-16）",
    publisher: "吉尔吉斯共和国国家海关署",
    sourceType: "government" as const,
    sourceUrl: "https://www.customs.gov.kg/site/ru/master/customskg/news/mbkda-kytajkyrgyzstanzbekstan-temir-zholun-kuruuda-bazhy-koshtoosu-bojuncha-maseleler-talkuulandy",
    sourceNote: "最新官方动态表明项目仍处于建设实施阶段。",
    accessLevel: "public" as const,
    confidenceLevel: 5,
  },
  routePlan: {
    title: "吉尔吉斯斯坦段隧道建设进展与线路参数（2025-12-05）",
    publisher: "吉尔吉斯共和国部长内阁",
    sourceType: "government" as const,
    sourceUrl: "https://www.gov.kg/ru/post/s/25850-minkab-toragasy-adylbek-kasymaliev-kytai-kyrgyzstan-ozbekstan-temir-zolunun-tilkesindegi-tunneldin-kurulusunun-zurusu-menen-taanysty",
    sourceNote: "用于规划线路、里程和轨距换装信息；最终运营组织以正式规则为准。",
    accessLevel: "public" as const,
    confidenceLevel: 5,
  },
  operationalCoverage: {
    title: "中吉乌通道运营服务范围确认（2026-08-12）",
    publisher: "中吉乌商机网",
    sourceType: "internal_record" as const,
    sourceNote: "由业务负责人确认：已列配送城市均可提供清关、含税及配送一条龙服务；具体价格须逐票联系确认。暂无可用于公开或训练的历史订单。",
    accessLevel: "internal" as const,
    confidenceLevel: 4,
  },
} satisfies Record<string, {
  title: string;
  publisher: string;
  sourceType: "government" | "internal_record";
  sourceUrl?: string;
  sourceNote: string;
  accessLevel: "public" | "internal";
  confidenceLevel: number;
}>;

type SourceKey = keyof typeof sourceDefinitions;
type Topic = "pricing" | "minimum_order" | "sourcing" | "inspection" | "shipping" | "customs" | "payment" | "delivery" | "warranty" | "returns" | "compliance" | "platform_process" | "railway_project";

type ArticleDraft = {
  slug: string;
  topic: Topic;
  scope?: "global" | "market";
  marketCode?: "kg" | "uz";
  priority: number;
  source: SourceKey;
  title: string;
  summary: string;
  content: string;
  questions: string[];
  keywords: string[];
};

const articles: ArticleDraft[] = [
  {
    slug: "railway-construction-status-2026-08",
    topic: "railway_project", priority: 100, source: "customsUpdate",
    title: "中吉乌铁路当前仍处于建设阶段",
    summary: "截至2026年8月，没有可供商业货物全程直达的新建中吉乌铁路服务。",
    content: "吉尔吉斯斯坦政府项目登记将工程标记为“在建”，2026年7月海关官方动态仍在讨论建设物资的通关保障。因此客服必须使用“正在建设、尚未全线运营”的表述，不得把规划线路、施工运输或历史公铁联运案例说成新铁路已经通车。具体开通日期须等待三国主管部门或项目公司正式公告。",
    questions: ["中吉乌铁路现在通车了吗？", "新铁路可以全程直达了吗？", "什么时候正式开通？"],
    keywords: ["通车", "开通", "建设状态", "中吉乌铁路", "全程直达"],
  },
  {
    slug: "railway-project-record-dates",
    topic: "railway_project", priority: 86, source: "constructionStatus",
    title: "项目登记日期不能当作商业开通承诺",
    summary: "政府项目页面中的开工、计划完工日期属于建设登记信息，不等同于正式运营日期。",
    content: "项目登记页面列有2025年4月25日开工和2031年5月30日完工信息，并将状态标记为在建。该日期可用于解释建设计划背景，但工程进度、验收、联调联试、口岸运营和商业开行均可能另有安排。对客户只能说明当前状态，不能据此承诺某日开通。",
    questions: ["2031年一定会通车吗？", "项目页面上的完工日期可靠吗？"],
    keywords: ["完工日期", "运营日期", "项目登记", "2031", "承诺"],
  },
  {
    slug: "railway-planned-main-route",
    topic: "railway_project", priority: 96, source: "routePlan",
    title: "规划中的中吉乌铁路主线",
    summary: "规划主线经喀什、吐尔尕特、阿尔帕、马克马尔、贾拉拉巴德方向接入安集延。",
    content: "规划口径可概括为：中国新疆喀什方向，经吐尔尕特进入吉尔吉斯斯坦，经过阿尔帕、科什多博、马克马尔和贾拉拉巴德方向，接入乌兹别克斯坦安集延，再利用当地既有铁路网衔接塔什干等城市。规划节点不代表目前已经具备商业运营条件。",
    questions: ["未来铁路大致经过哪里？", "中吉乌铁路经过哪些城市？"],
    keywords: ["喀什", "吐尔尕特", "阿尔帕", "马克马尔", "贾拉拉巴德", "安集延"],
  },
  {
    slug: "railway-gauge-transfer-makmal",
    topic: "railway_project", priority: 91, source: "routePlan",
    title: "马克马尔轨距转换与换装边界",
    summary: "规划线路涉及1435毫米标准轨和1520毫米宽轨衔接，预计需要换装或其他转换组织。",
    content: "中国铁路采用1435毫米标准轨，吉尔吉斯斯坦和乌兹别克斯坦既有铁路体系主要采用1520毫米宽轨。公开建设口径显示规划在马克马尔附近设置换装节点。具体采用集装箱吊装、货物换装或其他方式，要以未来正式运营规则为准；客服不得承诺“建成后完全不用换装”。",
    questions: ["铁路建成后是不是不用换装？", "为什么要在马克马尔换装？"],
    keywords: ["轨距", "1435", "1520", "换装", "马克马尔"],
  },
  {
    slug: "osh-current-node-not-planned-mainline",
    topic: "railway_project", priority: 90, source: "internal",
    title: "奥什是当前运输节点，不等于规划主线车站",
    summary: "奥什对现阶段公路和公铁联运很重要，但不能与规划铁路主线混为一谈。",
    content: "当前货物可经伊尔克什坦口岸进入吉尔吉斯斯坦并在奥什方向分拨，因此奥什是重要的现实物流节点。规划新铁路主线则主要经吐尔尕特—阿尔帕—马克马尔—贾拉拉巴德方向。回答客户时应明确区分“当前可操作通道”和“未来规划线路”。",
    questions: ["奥什是不是未来中吉乌铁路主线车站？", "为什么现在运输会经过奥什？"],
    keywords: ["奥什", "伊尔克什坦", "规划主线", "公铁联运"],
  },
  {
    slug: "current-kashgar-irkeshtam-osh-multimodal",
    topic: "shipping", scope: "market", marketCode: "kg", priority: 94, source: "internal",
    title: "当前中国至吉尔吉斯斯坦可组织的公铁联运",
    summary: "可按订单组织中国境内集货至喀什，再经伊尔克什坦进入奥什方向分拨。",
    content: "当前可操作方案通常包含：中国货源地集货或铁路运输至喀什北方向、换用公路车辆、经伊尔克什坦口岸进入吉尔吉斯斯坦、在奥什或其他节点分拨。班次、车辆、口岸、时效和费用必须逐票确认；该方案不是新建中吉乌铁路全程直达。",
    questions: ["现在货物怎么运到吉尔吉斯斯坦？", "可以走喀什和奥什吗？"],
    keywords: ["喀什北", "伊尔克什坦", "奥什", "公铁联运", "吉尔吉斯斯坦"],
  },
  {
    slug: "current-china-uzbekistan-multimodal",
    topic: "shipping", scope: "market", marketCode: "uz", priority: 94, source: "internal",
    title: "当前中国至乌兹别克斯坦可组织的公铁联运",
    summary: "可经喀什、伊尔克什坦、奥什方向，再衔接安集延或塔什干方向运输。",
    content: "现阶段可根据货物和目的城市组织中国境内集货、喀什换装、跨境公路运输，并在吉尔吉斯斯坦或乌兹别克斯坦境内衔接公路或既有铁路。历史案例只能证明通道曾被组织过，不能直接作为当前固定班期、7—10天时效或固定运价承诺。",
    questions: ["可以送到塔什干吗？", "现在能走中吉乌联运吗？"],
    keywords: ["塔什干", "安集延", "公铁联运", "乌兹别克斯坦", "历史班列"],
  },
  {
    slug: "bishkek-delivery-connection",
    topic: "delivery", scope: "market", marketCode: "kg", priority: 84, source: "internal",
    title: "比什凯克通常需要境内接续配送",
    summary: "可以评估送达比什凯克，但需要按地址设计吉尔吉斯斯坦境内接续方案。",
    content: "比什凯克不是规划中吉乌铁路新建主线的同义词。当前订单通常需要在吉尔吉斯斯坦境内通过公路或既有铁路继续运输。确认方案前必须取得商品属性、货量、收货主体和详细地址。",
    questions: ["可以送到比什凯克吗？", "比什凯克能不能门到门？"],
    keywords: ["比什凯克", "末端配送", "境内接续", "详细地址"],
  },
  {
    slug: "alternative-road-rail-air-routes",
    topic: "shipping", priority: 82, source: "internal",
    title: "公路、经哈萨克斯坦铁路与航空备选方案",
    summary: "运输方式要按货量、货值、时效、商品属性和目的地综合选择。",
    content: "公路适合零担、小批量和灵活提送；经哈萨克斯坦既有铁路适合部分大批量或集装箱订单，但可能绕行；航空适合样品、小批高货值和紧急补货。任何路线都需要核验当期班次、口岸、敏感货限制、计费方式和目的国接续条件。",
    questions: ["除了中吉乌通道还有什么路线？", "小批货适合公路还是空运？"],
    keywords: ["公路", "哈萨克斯坦", "既有铁路", "航空", "替代路线"],
  },
  {
    slug: "transit-time-calculation-boundaries",
    topic: "delivery", priority: 95, source: "internal",
    title: "运输时效必须拆分为四个阶段",
    summary: "备货、集货等待、在途、清关派送应分别估算，所有时效只给预计区间。",
    content: "正式报价应说明计时起点，并把总周期拆为备货期、集货或等班期、在途期、清关及末端派送期。山区天气、口岸拥堵、海关查验、换装、班列计划、节假日和资料缺失都可能造成延误。历史7—10天等案例不得直接变成新订单承诺。",
    questions: ["多久能到？", "为什么不能保证固定到货日？", "7到10天能到吗？"],
    keywords: ["时效", "备货", "集货", "在途", "清关", "预计区间"],
  },
  {
    slug: "accepted-product-sourcing-scope",
    topic: "sourcing", priority: 88, source: "internal",
    title: "网页之外的合法合规商品也可提交采购需求",
    summary: "平台展示商品是选品示例，不是采购范围上限。",
    content: "日用百货、家居用品、小五金、服装箱包、小家电、普通电子配件、汽摩配件、建材和机械零部件等可以先提交询价。网页未展示的商品也可提供图片、链接、样品或规格进行寻源，但“接受询价”不代表已经确认可采购、可出口、可运输或可进口。",
    questions: ["网页上没有的商品可以采购吗？", "你们能帮我找其他中国商品吗？"],
    keywords: ["代采购", "寻源", "网页没有", "小商品", "询价"],
  },
  {
    slug: "product-review-required-information",
    topic: "compliance", priority: 97, source: "internal",
    title: "不能只凭图片确认商品可运",
    summary: "判断可运性至少需要商品属性、数量、包装、重量体积和目的地信息。",
    content: "审核至少要收集：商品中文名称、用途、材质、品牌、型号、数量、单件尺寸重量、总毛重、包装方式、是否带电/带液/带磁/带粉、HS编码（如有）、目的国家和城市。资料不足时只能接收询价，不能承诺承运、清关或税费。",
    questions: ["发一张图片能判断能不能运吗？", "确认可运需要什么资料？"],
    keywords: ["商品图片", "可运性", "材质", "品牌", "HS编码", "目的地"],
  },
  {
    slug: "special-review-product-categories",
    topic: "compliance", priority: 96, source: "internal",
    title: "必须专项审核的商品类别",
    summary: "带电、液体、粉末、食品药品、品牌和受监管商品不能按普通百货处理。",
    content: "必须专项审核的范围包括：锂电池或大功率电机、液体粉末喷雾和化学品、食品保健品化妆品药品及医疗器械、儿童用品和无线设备、木制品与动植物产品、品牌或知识产权商品、二手设备、高价值易碎品，以及可能涉及出口管制、制裁或军民两用的商品。",
    questions: ["是不是什么小商品都能运输？", "哪些商品需要单独审核？"],
    keywords: ["敏感货", "液体", "粉末", "食品", "品牌", "出口管制"],
  },
  {
    slug: "battery-product-transport-review",
    topic: "compliance", priority: 98, source: "internal",
    title: "带电和锂电池商品的运输审核",
    summary: "带电商品可先询价，但必须核验电池参数、资料和具体承运渠道。",
    content: "需要提供电池类型、数量、单个电池容量或额定能量、是否内置、产品型号，以及渠道要求的UN38.3、MSDS等资料。充电宝、TWS耳机、理发器、手电筒、充电台灯和剃须刀不能直接按普通无电百货报价。最终能否承运由实际货物、包装、文件和承运渠道共同决定。",
    questions: ["带电产品能发吗？", "充电宝可以运输吗？", "需要UN38.3吗？"],
    keywords: ["带电", "锂电池", "充电宝", "UN38.3", "MSDS", "额定能量"],
  },
  {
    slug: "inquiry-required-information",
    topic: "platform_process", priority: 93, source: "internal",
    title: "完整询价所需的九项信息",
    summary: "资料齐全后才能核对货源、路线和完整费用。",
    content: "请客户提供：1.商品名称和图片或链接；2.规格型号；3.数量；4.是否带电、液体、粉末、磁性或品牌；5.单件尺寸重量或预计总体积重量；6.收货国家和城市；7.希望到货时间；8.公司还是个人收货；9.是否具备当地进口清关能力。",
    questions: ["询价需要提供什么？", "你们报价需要哪些资料？"],
    keywords: ["询价模板", "规格", "数量", "体积重量", "收货城市", "清关能力"],
  },
  {
    slug: "standard-order-service-process",
    topic: "platform_process", priority: 80, source: "internal",
    title: "从需求到签收的标准服务流程",
    summary: "标准流程包含需求、预审、寻源、报价、付款、验货、集货、申报、运输、清关交付和售后。",
    content: "标准步骤为：提交需求；商品与合规预审；匹配货源；形成分项报价；确认订单和付款条件；采购与约定验货；集货和加固包装；出口申报及发运；跨境节点跟踪；目的国清关与交付；签收和售后留证。任一步骤所需资料未满足时，应暂停对应承诺并转人工核实。",
    questions: ["采购和运输流程是什么？", "下单后有哪些步骤？"],
    keywords: ["服务流程", "寻源", "验货", "集货", "报关", "签收"],
  },
  {
    slug: "reference-price-not-landed-cost",
    topic: "pricing", priority: 99, source: "internal",
    title: "页面参考价不等于最终订单价或到货成本",
    summary: "中国参考价通常不含物流、验货包装、清关税费和末端派送。",
    content: "页面上的中国参考价和当地参考价只用于发现商机，不是正式报价。完整到货成本通常由商品采购价、中国境内物流、验货/包装/操作费、出口费用、国际运输、保险、目的国清关服务费、关税及税费、末端配送和其他实际费用组成。最终以逐票书面报价为准。",
    questions: ["页面上的中国价格包含运费和税吗？", "最终到货成本怎么算？"],
    keywords: ["参考价", "到货成本", "运费", "关税", "增值税", "派送"],
  },
  {
    slug: "formal-quotation-required-fields",
    topic: "pricing", priority: 90, source: "internal",
    title: "正式报价必须写清的责任边界",
    summary: "币种、有效期、贸易术语、费用包含项、时效和索赔责任都应写入报价。",
    content: "正式报价至少写明商品和质量等级、数量、币种、汇率基准、有效期、贸易术语及地点、各段运输和清关税费由谁承担、计费重量或体积、最低收费、备货与预计运输区间、付款节点，以及货损短少和索赔边界。资料不足时不得只报一个无法解释的总价。",
    questions: ["正式报价里应该包含什么？", "报价有效期和汇率怎么处理？"],
    keywords: ["正式报价", "贸易术语", "汇率", "有效期", "计费重量", "责任边界"],
  },
  {
    slug: "small-shipment-mode-selection",
    topic: "minimum_order", priority: 83, source: "internal",
    title: "少量货可评估零担、拼箱、公路或航空",
    summary: "小批量并非不能发，但通常不适合直接套用铁路整箱方案。",
    content: "少量货需要根据实际重量、体积、商品属性、时效和目的地比较零担、拼箱、公路或航空。采购最低起订量和运输最低收费是不同概念；正式方案必须同时核对供应商起订量和承运渠道计费门槛。",
    questions: ["少量货能发吗？", "几件货可以走铁路吗？", "最低起订量是多少？"],
    keywords: ["少量货", "零担", "拼箱", "最低收费", "起订量"],
  },
  {
    slug: "customs-tax-ddp-boundaries",
    topic: "customs", priority: 99, source: "internal",
    title: "清关、包税和到门方案必须逐票确认",
    summary: "当前已列配送城市均可安排清关、含税和配送一条龙服务，价格须逐票确认。",
    content: "平台当前列出的吉尔吉斯斯坦和乌兹别克斯坦配送城市，均可根据实际订单安排清关、含税和配送一条龙服务。由于HS编码、申报价格、原产地、用途、监管条件、货量和地址会影响税费及服务成本，不能仅凭图片或页面参考价给出固定含税价；客户须提交完整资料并联系我们取得书面报价。不接受低报、瞒报、伪报或夹带。",
    questions: ["可以包清关、包税、送到门吗？", "DDP能做吗？", "关税是多少？"],
    keywords: ["清关", "包税", "DDP", "HS编码", "进口主体", "低报"],
  },
  {
    slug: "inspection-scope-and-limitations",
    topic: "inspection", priority: 87, source: "internal",
    title: "验货标准必须在采购前书面确定",
    summary: "验货可降低风险，但不等于销量保证、适销性保证或零缺陷保证。",
    content: "采购前应约定抽样比例、外观、功能、尺寸、颜色、包装和允许误差。重要订单可固化样品或规格书，并约定不合格处理。验货只能核对约定项目，不能代替目的国认证判断，也不能保证市场销量和完全无缺陷。",
    questions: ["你们能验货吗？", "验货后是不是保证没有质量问题？"],
    keywords: ["验货", "抽样", "规格书", "允许误差", "质量"],
  },
  {
    slug: "signing-and-claims-evidence",
    topic: "returns", priority: 89, source: "internal",
    title: "签收异常和索赔所需证据",
    summary: "破损、进水、短少或封志异常应在签收时备注并立即留存影像。",
    content: "交接时应记录箱数、毛重、封志和外包装状态。收货人签收前检查包装和件数；发现异常须在运输单据备注并拍照或录像。隐蔽问题按合同期限提供连续开箱视频、批次、数量和问题证据。赔付范围、免赔额、保险责任和时限以合同及保险条款为准。",
    questions: ["收到货破损怎么办？", "短少怎么索赔？", "签收时需要拍什么？"],
    keywords: ["签收", "货损", "短少", "封志", "开箱视频", "索赔"],
  },
  {
    slug: "payment-terms-require-written-order",
    topic: "payment", priority: 78, source: "internal",
    title: "付款条件以书面订单和合同为准",
    summary: "定金、尾款节点、退款条件、币种和汇率必须在付款前确认。",
    content: "客服不能脱离具体订单承诺统一定金比例或退款结果。下单前应书面确认收款主体、币种、汇率或换算规则、定金、尾款触发节点、采购取消条件、供应商已发生费用、运输费用和退款条件。异常付款、第三方代付或受限主体应转人工合规审核。",
    questions: ["怎么付款？", "需要多少定金？", "可以退款吗？"],
    keywords: ["付款", "定金", "尾款", "退款", "汇率", "收款主体"],
  },
  {
    slug: "service-coverage-core-and-extension",
    topic: "delivery", priority: 84, source: "internal",
    title: "核心通道国家与延伸市场的区别",
    summary: "中国、吉尔吉斯斯坦、乌兹别克斯坦是核心通道；其他市场通常需要额外接续。",
    content: "核心通道国家为中国、吉尔吉斯斯坦和乌兹别克斯坦。塔吉克斯坦、土库曼斯坦、阿塞拜疆、格鲁吉亚、土耳其、伊朗及欧洲部分市场可按具体线路评估，但通常需要其他铁路、公路或跨里海运输接续，不能称为中吉乌铁路直接到达。",
    questions: ["哪些国家算中吉乌线路覆盖？", "可以继续运到欧洲吗？"],
    keywords: ["覆盖国家", "延伸市场", "塔吉克斯坦", "跨里海", "欧洲"],
  },
  {
    slug: "operational-risk-and-exceptions",
    topic: "platform_process", priority: 85, source: "internal",
    title: "常见履约风险与异常处理原则",
    summary: "供应、口岸、查验、认证、汇率、天气和支付合规都可能改变方案。",
    content: "常见风险包括供应商延期或缺货、实物与样品不一致、口岸拥堵或临时管制、换装等待、海关查验和单证不符、目的国认证不足、汇率或运价变化、极端天气以及制裁与支付合规。应通过交期缓冲、书面规格、如实申报、预先认证核验、报价有效期、替代路线和保险来降低风险。",
    questions: ["运输可能遇到哪些风险？", "口岸拥堵怎么办？", "汇率变了怎么办？"],
    keywords: ["风险", "口岸拥堵", "查验", "认证", "汇率", "天气", "制裁"],
  },
  {
    slug: "mandatory-human-handoff-rules",
    topic: "platform_process", priority: 100, source: "internal",
    title: "必须转人工审核的询问",
    summary: "价格、固定时效、具体税则、敏感货、包税、索赔和合规冲突必须由人工确认。",
    content: "以下情况必须转人工：最终价格、库存、最低起订量、固定班期或确定交期；具体HS编码、关税、认证和进口可行性；带电、带液、带粉、食品药品、医疗器械和品牌商品；包税、双清、DDP或非正规清关；货损退款索赔；制裁、出口管制、军民两用或高价值商品；不同来源出现状态、线路、价格或政策冲突。",
    questions: ["什么情况需要人工确认？", "机器人能直接确认关税和交期吗？"],
    keywords: ["转人工", "最终价格", "固定交期", "敏感货", "索赔", "来源冲突"],
  },
  {
    slug: "knowledge-answer-source-priority",
    topic: "platform_process", priority: 92, source: "internal",
    title: "知识回答的信息优先级与历史案例边界",
    summary: "最新官方文件和有效业务文件优先；历史新闻只能用于背景说明。",
    content: "回答优先使用最新三国政府、铁路主管部门、海关和项目公司文件，其次是最新合同、有效报价、班列计划和承运商书面通知，再次是带更新时间的内部运营规则。历史案例与新闻只能作为背景，不能作为当前报价、班期、时效或服务等级承诺。信息冲突时停止自动结论并转人工。",
    questions: ["为什么历史案例不能直接作为现在的承诺？", "知识来源冲突时怎么办？"],
    keywords: ["信息优先级", "官方来源", "历史案例", "有效报价", "来源冲突"],
  },
  {
    slug: "operational-delivery-cities-kyrgyzstan",
    topic: "delivery", scope: "market", marketCode: "kg", priority: 99, source: "operationalCoverage",
    title: "吉尔吉斯斯坦可配送城市",
    summary: "当前服务范围包括奥什、贾拉拉巴德、比什凯克和纳伦。",
    content: "中吉乌通道当前可承接配送的吉尔吉斯斯坦城市为：奥什、贾拉拉巴德、比什凯克、纳伦。奥什属于当前公铁联运的重要节点；贾拉拉巴德和纳伦属于规划线路相关区域；比什凯克通常需要境内接续。上述城市均可安排清关、含税和配送一条龙服务，具体路线、时效和价格须按商品、货量及详细地址联系我们确认。",
    questions: ["吉尔吉斯斯坦可以送到哪些城市？", "奥什、比什凯克、纳伦可以送货吗？"],
    keywords: ["吉尔吉斯斯坦", "奥什", "贾拉拉巴德", "比什凯克", "纳伦", "配送城市"],
  },
  {
    slug: "operational-delivery-cities-uzbekistan",
    topic: "delivery", scope: "market", marketCode: "uz", priority: 99, source: "operationalCoverage",
    title: "乌兹别克斯坦可配送城市",
    summary: "当前服务范围包括安集延、纳曼干、费尔干纳、塔什干、撒马尔罕、布哈拉、卡尔希和纳沃伊。",
    content: "中吉乌通道当前可承接配送的乌兹别克斯坦城市为：安集延、纳曼干、费尔干纳、塔什干、撒马尔罕、布哈拉、卡尔希、纳沃伊。安集延是规划铁路衔接点，塔什干是重要分拨枢纽，其余城市通常通过乌兹别克斯坦境内铁路或公路接续。上述城市均可安排清关、含税和配送一条龙服务，具体路线、时效和价格须按商品、货量及详细地址联系我们确认。",
    questions: ["乌兹别克斯坦可以送到哪些城市？", "塔什干、撒马尔罕、布哈拉可以送货吗？"],
    keywords: ["乌兹别克斯坦", "安集延", "塔什干", "撒马尔罕", "布哈拉", "配送城市"],
  },
  {
    slug: "one-stop-customs-tax-delivery-service",
    topic: "customs", priority: 100, source: "operationalCoverage",
    title: "已列配送城市支持清关含税一条龙",
    summary: "服务可覆盖跨境运输、目的国清关、税费处理和末端配送，但没有统一固定价。",
    content: "对平台当前列出的吉尔吉斯斯坦和乌兹别克斯坦配送城市，可按订单提供跨境运输、目的国清关、税费处理及末端配送的一条龙方案。价格取决于商品名称与HS编码、品牌及监管属性、数量、重量体积、货值、收货城市和详细地址等信息，必须联系我们逐票核算并以书面报价为准。",
    questions: ["所有配送城市都可以包清关含税吗？", "能提供一条龙到门服务吗？", "含税价格是多少？"],
    keywords: ["一条龙", "清关", "含税", "到门", "书面报价", "联系我们"],
  },
  {
    slug: "operational-pricing-contact-required",
    topic: "pricing", priority: 98, source: "operationalCoverage",
    title: "一条龙服务价格必须联系我们确认",
    summary: "平台不提供适用于所有城市和商品的固定清关含税价格。",
    content: "同一城市的价格也会随商品品类、申报要素、货值、重量体积、运输方式、口岸情况和末端地址变化。客服可以确认服务可受理，但不得在资料不全时承诺固定价格；应收集完整询价资料后转交人工形成有效期明确的书面报价。",
    questions: ["清关含税一条龙多少钱？", "为什么页面没有固定运费？"],
    keywords: ["价格", "联系我们", "逐票报价", "固定运费", "报价有效期"],
  },
  {
    slug: "historical-orders-not-available",
    topic: "platform_process", priority: 88, source: "operationalCoverage",
    title: "当前暂无可引用的历史订单数据",
    summary: "不得虚构成交案例、实际费用、运输天数或客户结果。",
    content: "当前没有经过整理并获准用于知识库的历史订单。客服不得编造客户名称、货量、费用、利润、运输天数或签收结果。公开新闻中的班列案例只能用于线路背景，不能冒充平台订单，也不能替代当前逐票报价和预计时效。",
    questions: ["有没有历史订单可以参考？", "以前同类货运了多少天、多少钱？"],
    keywords: ["历史订单", "案例", "费用", "运输天数", "不得编造"],
  },
];

const serviceCities = {
  kg: ["奥什", "贾拉拉巴德", "比什凯克", "纳伦"],
  uz: ["安集延", "纳曼干", "费尔干纳", "塔什干", "撒马尔罕", "布哈拉", "卡尔希", "纳沃伊"],
} as const;

async function resolveSources() {
  const ids = {} as Record<SourceKey, string>;
  for (const [key, source] of Object.entries(sourceDefinitions) as [SourceKey, typeof sourceDefinitions[SourceKey]][]) {
    const existing = (await db.select({ id: knowledgeSources.id })
      .from(knowledgeSources).where(eq(knowledgeSources.title, source.title)).limit(1))[0];
    if (existing) {
      await db.update(knowledgeSources).set({ ...source, capturedAt, updatedAt: new Date() })
        .where(eq(knowledgeSources.id, existing.id));
      ids[key] = existing.id;
    } else {
      ids[key] = (await db.insert(knowledgeSources).values({ ...source, capturedAt })
        .returning({ id: knowledgeSources.id }))[0].id;
    }
  }
  return ids;
}

async function seedKnowledgeArticles() {
  const sourceIds = await resolveSources();
  for (const item of articles) {
    const [article] = await db.insert(knowledgeArticles).values({
      slug: item.slug,
      topic: item.topic,
      scope: item.scope ?? "global",
      marketCode: item.marketCode ?? null,
      priority: item.priority,
      status: "draft",
      validFrom: capturedAt,
      sourceId: sourceIds[item.source],
    }).onConflictDoUpdate({
      target: knowledgeArticles.slug,
      set: {
        topic: item.topic,
        scope: item.scope ?? "global",
        marketCode: item.marketCode ?? null,
        priority: item.priority,
        status: "draft",
        sourceId: sourceIds[item.source],
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date(),
      },
    }).returning({ id: knowledgeArticles.id });

    await db.insert(knowledgeArticleTranslations).values({
      articleId: article.id,
      locale: "zh",
      title: item.title,
      summary: item.summary,
      content: item.content,
      sampleQuestions: item.questions,
      keywords: item.keywords,
      status: "draft",
    }).onConflictDoUpdate({
      target: [knowledgeArticleTranslations.articleId, knowledgeArticleTranslations.locale],
      set: {
        title: item.title,
        summary: item.summary,
        content: item.content,
        sampleQuestions: item.questions,
        keywords: item.keywords,
        status: "draft",
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date(),
      },
    });
  }

  for (const [marketCode, cities] of Object.entries(serviceCities) as [keyof typeof serviceCities, readonly string[]][]) {
    for (const city of cities) {
      const slug = `service-cn-${marketCode}-${city === "奥什" ? "osh" : city === "贾拉拉巴德" ? "jalal-abad" : city === "比什凯克" ? "bishkek" : city === "纳伦" ? "naryn" : city === "安集延" ? "andijan" : city === "纳曼干" ? "namangan" : city === "费尔干纳" ? "fergana" : city === "塔什干" ? "tashkent" : city === "撒马尔罕" ? "samarkand" : city === "布哈拉" ? "bukhara" : city === "卡尔希" ? "karshi" : "navoi"}`;
      const [route] = await db.insert(shippingRoutes).values({
        slug,
        originCountry: "CN",
        destinationMarketCode: marketCode,
        destinationCity: city,
        transportMode: "multimodal",
        costBasis: "quote_only",
        customsIncluded: true,
        sourceId: sourceIds.operationalCoverage,
        status: "draft",
      }).onConflictDoUpdate({
        target: shippingRoutes.slug,
        set: {
          destinationMarketCode: marketCode,
          destinationCity: city,
          transportMode: "multimodal",
          costBasis: "quote_only",
          customsIncluded: true,
          sourceId: sourceIds.operationalCoverage,
          status: "draft",
          reviewedBy: null,
          reviewedAt: null,
          updatedAt: new Date(),
        },
      }).returning({ id: shippingRoutes.id });

      await db.insert(shippingRouteTranslations).values({
        routeId: route.id,
        locale: "zh",
        name: `中国至${city}清关含税配送服务`,
        summary: `可按订单安排中国至${city}的跨境运输、目的国清关、税费处理和末端配送一条龙服务。`,
        limitations: "无统一固定价；须提供商品、数量、重量体积、货值和详细地址后联系我们逐票确认。新建中吉乌铁路尚未全线运营，实际承运路线以书面方案为准。",
        status: "draft",
      }).onConflictDoUpdate({
        target: [shippingRouteTranslations.routeId, shippingRouteTranslations.locale],
        set: {
          name: `中国至${city}清关含税配送服务`,
          summary: `可按订单安排中国至${city}的跨境运输、目的国清关、税费处理和末端配送一条龙服务。`,
          limitations: "无统一固定价；须提供商品、数量、重量体积、货值和详细地址后联系我们逐票确认。新建中吉乌铁路尚未全线运营，实际承运路线以书面方案为准。",
          status: "draft",
          reviewedBy: null,
          reviewedAt: null,
          updatedAt: new Date(),
        },
      });
    }
  }

  console.info(`Seeded ${articles.length} Chinese knowledge article drafts and ${Object.values(serviceCities).flat().length} city service drafts with ${Object.keys(sourceDefinitions).length} traceable sources.`);
}

try {
  await seedKnowledgeArticles();
} finally {
  await sql.end();
}
