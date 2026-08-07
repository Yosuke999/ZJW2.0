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

export const knowledgeBase: KnowledgeEntry[] = [
  {
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
  },
  {
    id: "logistics-route-kg-uz",
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
  },
];

export function knowledgeForCountry(country: CountryCode) {
  return knowledgeBase.filter((entry) => entry.meta.applicableCountries.includes("all") || entry.meta.applicableCountries.includes(country));
}
