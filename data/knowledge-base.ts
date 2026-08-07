import { countries } from "./countries";
import { prices, getPrice } from "./prices";
import { products } from "./products";
import { translations } from "./translations";
import type { CountryCode, Language } from "./types";

export type KnowledgeCategory = "product_card" | "quote_rule" | "fulfillment_rule" | "faq_policy" | "contact" | "logistics";
export type KnowledgeConfidence = "draft" | "demo" | "reviewed" | "verified";
export type KnowledgeScope = CountryCode | "all";

export type KnowledgeMeta = {
  applicableCountries: KnowledgeScope[];
  updatedAt: string;
  isDemoData: boolean;
  confidence: KnowledgeConfidence;
};

export type KnowledgeEntry = {
  id: string;
  category: KnowledgeCategory;
  title: Record<Language, string>;
  body: Record<Language, string>;
  keywords: string[];
  meta: KnowledgeMeta;
};

const languageRecord = <T,>(factory: (language: Language) => T): Record<Language, T> => ({
  zh: factory("zh"),
  ky: factory("ky"),
  ru: factory("ru"),
  uz: factory("uz"),
  en: factory("en"),
});

const productTerms = {
  zh: { product: "商品", spec: "规格", country: "适用国家", sourcePrice: "参考采购价", retailPrice: "当地参考零售价", quantity: "参考数量", note: "注意", risk: "参考价差不等于利润，不含运输、清关、税费和末端交付" },
  ky: { product: "Товар", spec: "Мүнөздөмө", country: "Ылайыктуу өлкө", sourcePrice: "Болжолдуу сатып алуу баасы", retailPrice: "Жергиликтүү чекене баа", quantity: "Сунушталган саны", note: "Эскертүү", risk: "Баа айырмасы пайда эмес; ташуу, бажы, салык жана акыркы жеткирүү кирбейт" },
  ru: { product: "Товар", spec: "Характеристики", country: "Подходит для", sourcePrice: "Ориентировочная закупочная цена", retailPrice: "Ориентировочная местная розничная цена", quantity: "Ориентировочное количество", note: "Примечание", risk: "Разница цен не равна прибыли; перевозка, таможня, налоги и конечная доставка не включены" },
  uz: { product: "Mahsulot", spec: "Xususiyat", country: "Mos mamlakat", sourcePrice: "Taxminiy xarid narxi", retailPrice: "Mahalliy taxminiy chakana narx", quantity: "Tavsiya etilgan miqdor", note: "Izoh", risk: "Narxlar farqi foyda emas; tashish, bojxona, soliq va yakuniy yetkazish kirmaydi" },
  en: { product: "Product", spec: "Specification", country: "Applicable country", sourcePrice: "Reference sourcing price", retailPrice: "Reference local retail price", quantity: "Reference quantity", note: "Note", risk: "The price gap is not profit; freight, customs, taxes, and last-mile delivery are not included" },
} as const;

const quoteTerms = {
  zh: "页面价格只用于发现商机，不是最终报价；不包含运输、清关、税费、保险和末端派送；不能把参考价差说成利润；正式报价前必须补齐商品、数量、交付城市、服务范围和联系方式。",
  ky: "Барактагы баалар мүмкүнчүлүктү табуу үчүн гана берилет, акыркы баа эмес; ташуу, бажы, салык, камсыздандыруу жана акыркы жеткирүү кирбейт; баа айырмасын пайда деп айтууга болбойт; расмий баа үчүн товар, саны, жеткирүү шаары, кызмат көлөмү жана байланыш маалыматы керек.",
  ru: "Цены на странице служат только для поиска возможностей, а не для окончательного расчёта; они не включают перевозку, таможню, налоги, страхование и последнюю доставку; разницу в цене нельзя выдавать за прибыль; для формального предложения нужны товар, количество, город доставки, объём услуг и контакты.",
  uz: "Sahifadagi narxlar faqat imkoniyatni topish uchun berilgan, yakuniy taklif emas; tashish, bojxona, soliq, sugʻurta va yakuniy yetkazish kirmaydi; narx farqini foyda deb aytib boʻlmaydi; rasmiy taklif uchun mahsulot, miqdor, yetkazish shahri, xizmat doirasi va aloqa maʼlumoti kerak.",
  en: "Page prices are only for opportunity discovery, not a final quote; they do not include freight, customs, taxes, insurance, or last-mile delivery; the reference spread must not be described as profit; a formal quote requires the product, quantity, delivery city, service scope, and contact details.",
} as const;

const fulfillmentTerms = {
  zh: "标准流程是：采购 → 验货 → 集货 → 运输 → 清关 → 交付。时效只能给预计区间，不能承诺固定到货日。中吉乌铁路仍在建设中，当前不能按全线直达承诺；可根据货物和目的地选择中吉乌公铁联运、全程公路，或经哈萨克斯坦的既有铁路通道。",
  ky: "Стандарттык процесс: сатып алуу → текшерүү → топтоо → ташуу → бажы → тапшыруу. Мөөнөт дайыма болжолдуу аралык менен гана айтылат, так келүү күнү убада кылынбайт. Кытай–Кыргызстан–Өзбекстан темир жолу дагы курулуп жатат, ошондуктан толук түз жеткирүүнү убада кылууга болбойт; жүк жана багытка жараша аралаш темир жол–авто, толук авто же Казакстан аркылуу темир жол колдонулат.",
  ru: "Стандартный процесс: закупка → проверка → консолидация → перевозка → таможня → передача. Сроки можно давать только как ориентировочный диапазон, а не как фиксированную дату прибытия. Железная дорога Китай–Кыргызстан–Узбекистан ещё строится, поэтому нельзя обещать доставку по всей линии; для груза можно выбрать мультимодальную схему, полный автотранспорт или существующий железнодорожный коридор через Казахстан.",
  uz: "Standart jarayon: xarid → tekshiruv → yigʻish → tashish → bojxona → topshirish. Muddat faqat taxminiy oraliq bilan aytiladi, aniq yetib kelish kuni va’da qilinmaydi. Xitoy–Qirgʻiziston–Oʻzbekiston temir yoʻli hali qurilmoqda, shuning uchun butun yoʻnalish bo‘ylab yetkazishni va’da qilib bo‘lmaydi; yuk va manzilga qarab multimodal temir yoʻl–avto, toʻliq avtomobil yoki Qozogʻiston orqali mavjud temir yoʻl tanlanadi.",
  en: "The standard flow is: sourcing → inspection → consolidation → transport → customs → handover. Timelines must be given as an estimate range, not a fixed arrival date. The China–Kyrgyzstan–Uzbekistan railway is still under construction, so full-line direct delivery cannot be promised; depending on cargo and destination, use intermodal rail-road transport, full road transport, or the existing rail corridor via Kazakhstan.",
} as const;

const policyTerms = {
  zh: "MOQ、支付、退换、禁运、认证、品牌授权和清关责任都要按商品、国家和渠道单独核验。涉及带电、液体、粉末、食品、化妆品、药品、医疗器械、品牌商品或税费、清关、包税、DDP 的问题，必须先转人工。",
  ky: "MOQ, төлөм, кайтаруу, тыюу салынган жүк, сертификат, бренд уруксаты жана бажы жоопкерчилиги ар бир товар, өлкө жана канал боюнча өзүнчө текшерилет. Электр, суюктук, порошок, азык-түлүк, косметика, дары-дармек, медициналык жабдуу, бренд товар же салык, бажы, DDP жөнүндө суроолор болсо, адегенде адамга өткөрүңүз.",
  ru: "MOQ, оплата, возврат, запрещённые товары, сертификаты, права на бренд и ответственность за таможню проверяются отдельно для каждого товара, страны и канала. Вопросы о товарах с батареями, жидкостями, порошками, продуктами, косметикой, лекарствами, медизделиями, брендами, а также о налогах, таможне, DDP и «под ключ» нужно сразу передавать человеку.",
  uz: "MOQ, toʻlov, qaytarish, taqiqlangan tovarlar, sertifikat, brend ruxsati va bojxona javobgarligi har bir mahsulot, mamlakat va kanal boʻyicha alohida tekshiriladi. Elektr, suyuqlik, kukun, oziq-ovqat, kosmetika, dori-darmon, tibbiy buyum, brend mahsulot yoki soliq, bojxona, DDP bo‘yicha savollar bo‘lsa, avval odamga oʻtkazing.",
  en: "MOQ, payment, returns, prohibited goods, certification, brand authorization, and customs responsibility must be checked separately for each product, country, and channel. Questions about battery-powered goods, liquids, powders, food, cosmetics, medicines, medical devices, branded goods, or taxes, customs, DDP, and all-inclusive delivery should be handed to a human advisor first.",
} as const;

function makeProductCard(country: CountryCode, productId: string): KnowledgeEntry {
  const countryName = countries[country].name;
  const product = products.find((item) => item.id === productId)!;
  const price = getPrice(country, product.id);
  return {
    id: `product-${country}-${product.id}`,
    category: "product_card" as const,
    title: languageRecord((language) => `${product.name[language]}（${countryName[language]}）`),
    body: languageRecord((language) => {
      const terms = productTerms[language];
      return `${terms.product}：${product.name[language]}。${terms.spec}：${product.specification[language]}。${terms.country}：${countryName[language]}。${terms.sourcePrice}：${price.chinaReferencePrice} ${price.currency}。${terms.retailPrice}：${price.localRetailPrice} ${price.currency}。${terms.quantity}：${price.referenceQuantity}。${terms.note}：${terms.risk}。`;
    }),
    keywords: [product.id, product.category, product.name.zh, product.name.ru, product.name.ky, product.name.uz, product.name.en, country, countryName.zh, countryName.ru, countryName.ky, countryName.uz, countryName.en],
    meta: {
      applicableCountries: [country],
      updatedAt: price.confirmedAt,
      isDemoData: price.status === "demo",
      confidence: (price.status === "verified" ? "verified" : "demo") as KnowledgeConfidence,
    },
  };
}

function makeContactEntry(): KnowledgeEntry {
  return {
    id: "contact-channels",
    category: "contact",
    title: {
      zh: "联系我们",
      ky: "Биз менен байланышуу",
      ru: "Связаться с нами",
      uz: "Biz bilan bogʻlanish",
      en: "Contact us",
    },
    body: {
      zh: "电话：13009449950；邮箱：2231862009@qq.com。客服可通过电话或邮件联系，后续会根据商品、数量和目的地继续核验采购与履约方案。",
      ky: "Телефон: 13009449950; электрондук почта: 2231862009@qq.com. Кардарларды телефон же email аркылуу байланышууга болот; андан кийин товар, сан жана багыт боюнча текшерүү жүргүзүлөт.",
      ru: "Телефон: 13009449950; e-mail: 2231862009@qq.com. Связь возможна по телефону или почте; далее проверяются товар, количество и пункт назначения.",
      uz: "Telefon: 13009449950; email: 2231862009@qq.com. Muloqot telefon yoki elektron pochta orqali amalga oshiriladi; keyin mahsulot, miqdor va manzil bo‘yicha tekshiruv qilinadi.",
      en: "Phone: 13009449950; email: 2231862009@qq.com. Customers can contact us by phone or email, and we then verify the product, quantity, and destination before quoting or arranging fulfilment.",
    },
    keywords: ["电话", "邮箱", "contact", "phone", "email", "whatsapp", "telegram"],
    meta: {
      applicableCountries: ["all"],
      updatedAt: "2026-08-07",
      isDemoData: false,
      confidence: "reviewed",
    },
  };
}

function makeLogisticsEntry(): KnowledgeEntry {
  return {
    id: "logistics-routes",
    category: "logistics",
    title: {
      zh: "物流路线说明",
      ky: "Жеткирүү багыты",
      ru: "Маршруты доставки",
      uz: "Logistika yoʻnalishlari",
      en: "Logistics routes",
    },
    body: {
      zh: "中吉乌铁路仍在建设中，当前不能按全线直达对客户承诺运输。现阶段可根据货物、数量和目的地选择中吉乌公铁联运、全程公路或经哈萨克斯坦的既有铁路通道；常见组织方式包括中国货源地铁路集货到喀什北站，再公路换装，经伊尔克什坦口岸到奥什，继续到安集延或塔什干方向分拨。未来铁路主线规划为中国新疆喀什→吐尔尕特→阿尔帕→马克马尔换装站→贾拉拉巴德→安集延→乌兹别克斯坦铁路网。",
      ky: "Кытай–Кыргызстан–Өзбекстан темир жолу азыр курулуп жатат, ошондуктан биз толук түз жеткирүүнү убада кыла албайбыз. Азыркы этапта жүк, сан жана багытка жараша аралаш темир жол–автоунаа ташуу, толук автотранспорт же Казакстан аркылуу болгон темир жол жолу колдонулат; көп колдонулган схема — Кытайдагы булагынан жүк жыйнап, Кашкарга, андан соң Иле-Кыштам аркылуу Ошко, кийин Анжиян же Ташкент багытына таратуу.",
      ru: "Железная дорога Китай–Кыргызстан–Узбекистан пока строится, поэтому мы не обещаем прямую доставку по всей линии. Сейчас можно выбирать мультимодальную схему, автоперевозку или существующий железнодорожный коридор через Казахстан; типовой маршрут — сбор груза в Кашгаре, перегрузка на авто, проход через Иркештам до Оша и дальнейшее распределение на Андижан или Ташкент. Будущая магистраль планируется как Кашгар → Торугарт → Арпа → перевалочный узел Макмал → Джалал-Абад → Андижан → железнодорожная сеть Узбекистана.",
      uz: "Xitoy–Qirgʻiziston–Oʻzbekiston temir yoʻli hali qurilmoqda, shuning uchun biz butun yoʻnalish bo‘ylab toʻgʻridan-toʻgʻri yetkazishni va’da qila olmaymiz. Hozirgi bosqichda yuk, miqdor va manzilga qarab multimodal temir yoʻl–avto, toʻliq avtomobil yoki Qozogʻiston orqali mavjud temir yoʻl yoʻnalishi tanlanadi; odatiy sxema — Xitoydagi manbadan yukni Qashgarga yigʻish, keyin avtomobilga oʻtkazib, Irkeshtom orqali Oʻshga olib oʻtish va Andijon yoki Toshkent yoʻnalishida tarqatish. Kelajakdagi magistral Qashqar → Toʻrgʻart → Arpa → Makmal yuk tushirish punkti → Jalolobod → Andijon → Oʻzbekiston temir yoʻl tarmogʻi sifatida rejalashtirilgan.",
      en: "The China–Kyrgyzstan–Uzbekistan railway is still under construction, so we cannot promise full-line direct delivery yet. For now, shipments can use a China–Kyrgyzstan–Uzbekistan intermodal route, full road transport, or the existing rail corridor via Kazakhstan; a common flow is cargo consolidation from China to Kashgar, road transshipment through Irkeshtam to Osh, and onward distribution toward Andijan or Tashkent. The future main line is planned as Kashgar → Torugart → Arpa → Makmal transshipment hub → Jalal-Abad → Andijan → Uzbekistan rail network.",
    },
    keywords: ["物流", "路线", "运输", "铁路", "中吉乌", "喀什", "奥什", "安集延", "塔什干", "伊尔克什坦", "吐尔尕特"],
    meta: {
      applicableCountries: ["kg", "uz"],
      updatedAt: "2026-08-07",
      isDemoData: false,
      confidence: "reviewed",
    },
  };
}

function makeQuoteRuleEntry(): KnowledgeEntry {
  return {
    id: "quote-rules",
    category: "quote_rule",
    title: {
      zh: "报价规则",
      ky: "Баалоо эрежелери",
      ru: "Правила расчёта цены",
      uz: "Narx berish qoidalari",
      en: "Quote rules",
    },
    body: {
      zh: quoteTerms.zh,
      ky: quoteTerms.ky,
      ru: quoteTerms.ru,
      uz: quoteTerms.uz,
      en: quoteTerms.en,
    },
    keywords: ["报价", "价格", "参考价", "利润", "运费", "清关", "税费", "DDP", "包税"],
    meta: {
      applicableCountries: ["all"],
      updatedAt: "2026-08-07",
      isDemoData: true,
      confidence: "reviewed",
    },
  };
}

function makeFulfillmentRuleEntry(): KnowledgeEntry {
  return {
    id: "fulfillment-rules",
    category: "fulfillment_rule",
    title: {
      zh: "履约规则",
      ky: "Аткаруу эрежелери",
      ru: "Правила исполнения заказа",
      uz: "Bajarish qoidalari",
      en: "Fulfilment rules",
    },
    body: {
      zh: fulfillmentTerms.zh,
      ky: fulfillmentTerms.ky,
      ru: fulfillmentTerms.ru,
      uz: fulfillmentTerms.uz,
      en: fulfillmentTerms.en,
    },
    keywords: ["采购", "验货", "集货", "运输", "清关", "交付", "时效", "中吉乌铁路", "公铁联运", "公路"],
    meta: {
      applicableCountries: ["kg", "uz"],
      updatedAt: "2026-08-07",
      isDemoData: false,
      confidence: "reviewed",
    },
  };
}

function makeFaqPolicyEntry(): KnowledgeEntry {
  return {
    id: "faq-policy",
    category: "faq_policy",
    title: {
      zh: "FAQ 与政策",
      ky: "Көп берилген суроолор жана саясат",
      ru: "FAQ и политика",
      uz: "FAQ va siyosat",
      en: "FAQ and policy",
    },
    body: {
      zh: policyTerms.zh,
      ky: policyTerms.ky,
      ru: policyTerms.ru,
      uz: policyTerms.uz,
      en: policyTerms.en,
    },
    keywords: ["MOQ", "支付", "退换", "禁运", "认证", "品牌", "售后", "投诉", "合规"],
    meta: {
      applicableCountries: ["all"],
      updatedAt: "2026-08-07",
      isDemoData: false,
      confidence: "reviewed",
    },
  };
}

export const knowledgeBase: KnowledgeEntry[] = [
  makeContactEntry(),
  makeLogisticsEntry(),
  makeQuoteRuleEntry(),
  makeFulfillmentRuleEntry(),
  makeFaqPolicyEntry(),
  ...(["kg", "uz"] as CountryCode[]).flatMap((country) => products.map((product) => makeProductCard(country, product.id))),
];

export function knowledgeForCountry(country: CountryCode) {
  return knowledgeBase.filter((entry) => entry.meta.applicableCountries.includes("all") || entry.meta.applicableCountries.includes(country));
}

export function knowledgeByCategory(category: KnowledgeCategory) {
  return knowledgeBase.filter((entry) => entry.category === category);
}

export function knowledgeByProduct(country: CountryCode, productId: string) {
  return knowledgeBase.find((entry) => entry.category === "product_card" && entry.id === `product-${country}-${productId}`) ?? null;
}

export function knowledgeForSiteState() {
  return {
    countries,
    prices,
    translations,
    totalEntries: knowledgeBase.length,
  };
}
