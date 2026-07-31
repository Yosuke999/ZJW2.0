import type { Language, TranslationStatus } from "./types";

export type Copy = {
  translationStatus: TranslationStatus;
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  localPrice: string;
  chinaPrice: string;
  priceDisclaimer: string;
  demoData: string;
  confirmedDate: string;
  popularTitle: string;
  popularTag: string;
  productCategoryAll: string;
  productCategoryLabels: Record<"electronics" | "home" | "personal" | "daily", string>;
  showMore: string;
  showLess: string;
  viewDetails: string;
  productDetails: string;
  referenceDifference: string;
  differenceDisclaimer: string;
  landedCostParts: [string, string, string];
  landedCostResult: string;
  consultProduct: string;
  priceNoteTitle: string;
  priceNote: string;
  trust: string[];
  consultOpportunity: string;
  consultHelp: string;
  contactTitle: string;
  demoContact: string;
  contactNote: string;
  contactOutcomesTitle: string;
  contactOutcomes: [string, string, string];
  serviceTitle: string;
  servicePhases: {
    label: string;
    range: string;
    steps: { title: string; description: string; duration: string; deliverable: string }[];
  }[];
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  finalTitle: string;
  localAdvisor: string;
  footerPriceNote: string;
  privacy: string;
  close: string;
  previous: string;
  next: string;
  language: string;
  contactCountry: string;
  contactProduct: string;
  selectedProduct: string;
};

const cautiousAnswerZh = "将根据商品、数量、交付地点和运输方案单独确认。";
const cautiousAnswerRu = "Условия уточняются отдельно с учётом товара, количества, места доставки и способа перевозки.";
const cautiousAnswerKy = "Шарттар товарга, санга, жеткирүү жерине жана ташуу ыкмасына жараша өзүнчө такталат.";
const cautiousAnswerUz = "Shartlar mahsulot, miqdor, yetkazish joyi va tashish usuliga qarab alohida aniqlanadi.";

export const translations: Record<Language, Copy> = {
  zh: {
    translationStatus: "draft",
    brandName: "中亚商机网",
    heroTitle: "中国拿货当地卖，看得见的价格差",
    heroSubtitle: "对比当地市场参考零售价与中国批发市场参考价",
    localPrice: "当地参考零售价",
    chinaPrice: "中国进货参考价",
    priceDisclaimer: "价格仅供选品初步参考",
    demoData: "演示数据 · 待核验",
    confirmedDate: "演示价格确认日期：2026.07.28",
    popularTitle: "更多常见热销商品",
    popularTag: "常见热销",
    productCategoryAll: "全部商品",
    productCategoryLabels: { electronics: "数码配件", home: "家居小电", personal: "个人护理", daily: "日用百货" },
    showMore: "展开更多",
    showLess: "收起商品",
    viewDetails: "查看详情",
    productDetails: "商品快速详情",
    referenceDifference: "参考价差",
    differenceDisclaimer: "参考价差不等于实际利润。",
    landedCostParts: ["中国采购参考价", "运输 · 清关 · 税费", "当地交付费用"],
    landedCostResult: "最终到货成本（需核验）",
    consultProduct: "咨询这个商品",
    priceNoteTitle: "价格口径说明",
    priceNote: "页面展示同规格商品的当地参考零售价，以及采购10件时的中国进货参考单价。演示价格不含运输、清关、税费及其他附加费用，商品价差不等于利润，实际价格以咨询后的核验结果为准。",
    trust: ["价格持续核验，显示最后确认日期", "从采购到当地交付的流程协助", "吉尔吉斯斯坦、乌兹别克斯坦当地联系人"],
    consultOpportunity: "联系我们确认到货方案",
    consultHelp: "可协助采购、验货、运输、清关、当地交付",
    contactTitle: "选择联系渠道",
    demoContact: "演示联系方式",
    contactNote: "准备好商品、数量和目标城市，即可开始核验。",
    contactOutcomesTitle: "咨询将核验以下三项",
    contactOutcomes: ["可采购的规格、数量与起订要求", "到目标城市的费用构成与参考总额", "预计运输方式与交付时间范围"],
    serviceTitle: "从看到商品到当地交付",
    servicePhases: [
      { label: "前期确认", range: "01—03", steps: [
        { title: "发现机会", description: "查看有价格差的商品", duration: "即时", deliverable: "候选商品" },
        { title: "确认需求", description: "确认商品、数量和预算", duration: "1个工作日", deliverable: "需求确认单" },
        { title: "匹配货源", description: "核验供应商并提供报价", duration: "2—3个工作日", deliverable: "报价与货源建议" },
      ] },
      { label: "履约交付", range: "04—05", steps: [
        { title: "采购与运输", description: "采购、验货、集货、运输和清关", duration: "按订单确认", deliverable: "验货与物流进度" },
        { title: "当地交付", description: "到货确认后开始销售", duration: "到货后", deliverable: "交付确认" },
      ] },
    ],
    faqTitle: "常见问题",
    faqs: [
      { question: "页面价格是否包含运输和清关费用？", answer: `不包含。${cautiousAnswerZh}` },
      { question: "如何获得具体商品的完整报价？", answer: `请通过页面中的任一联系渠道咨询。${cautiousAnswerZh}` },
      { question: "最低采购数量是多少？", answer: cautiousAnswerZh },
      { question: "从确认采购到当地收货需要多久？", answer: cautiousAnswerZh },
      { question: "可以提供哪些采购与交付服务？", answer: "可协助采购、验货、集货、运输、清关和当地交付，具体范围将在咨询后确认。" },
    ],
    finalTitle: "看中商品了？先问清价格和到货方案",
    localAdvisor: "联系当地顾问",
    footerPriceNote: "价格说明",
    privacy: "隐私政策（占位）",
    close: "关闭",
    previous: "上一个商品",
    next: "下一个商品",
    language: "语言",
    contactCountry: "当前服务国家",
    contactProduct: "我想咨询这个商品",
    selectedProduct: "已选择此商品，可在下方咨询",
  },
  ru: {
    translationStatus: "draft",
    brandName: "Портал бизнес-возможностей Центральной Азии",
    heroTitle: "Товары из Китая для продажи на местном рынке",
    heroSubtitle: "Сравните ориентировочную розничную цену и закупочную цену в Китае",
    localPrice: "Местная розничная цена",
    chinaPrice: "Закупочная цена в Китае",
    priceDisclaimer: "Цены служат только для предварительного выбора товара",
    demoData: "Демо-данные · требуют проверки",
    confirmedDate: "Дата проверки демо-цен: 28.07.2026",
    popularTitle: "Другие популярные товары",
    popularTag: "Популярный товар",
    productCategoryAll: "Все товары",
    productCategoryLabels: { electronics: "Электроника", home: "Дом и быт", personal: "Уход", daily: "Повседневные товары" },
    showMore: "Показать ещё",
    showLess: "Свернуть",
    viewDetails: "Подробнее",
    productDetails: "Кратко о товаре",
    referenceDifference: "Ориентир разницы цен",
    differenceDisclaimer: "Ориентир разницы цен не равен фактической прибыли.",
    landedCostParts: ["Закупочная цена в Китае", "перевозка · таможня · налоги", "местная доставка"],
    landedCostResult: "Итоговая стоимость доставки (требует проверки)",
    consultProduct: "Узнать об этом товаре",
    priceNoteTitle: "Как понимать цены",
    priceNote: "Показаны ориентировочная местная розничная цена и ориентировочная цена за единицу при закупке 10 штук в Китае. Демо-цены не включают перевозку, таможню, налоги и другие расходы. Разница цен не равна прибыли; фактическая цена проверяется после обращения.",
    trust: ["Цены проверяются, указана дата последней проверки", "Сопровождение от закупки до местной доставки", "Местные контакты в Кыргызстане и Узбекистане"],
    consultOpportunity: "Узнать об этом товаре",
    consultHelp: "Помощь с закупкой, проверкой, перевозкой, таможней и доставкой",
    contactTitle: "Выберите способ связи",
    demoContact: "Демонстрационный контакт",
    contactNote: "Подготовьте товар, количество и город назначения — с этого начнётся проверка.",
    contactOutcomesTitle: "При обращении проверим три пункта",
    contactOutcomes: ["Доступные характеристики, количество и минимальный заказ", "Состав расходов и ориентировочную сумму до вашего города", "Способ перевозки и ориентировочный срок доставки"],
    serviceTitle: "От выбора товара до доставки",
    servicePhases: [
      { label: "Предварительное согласование", range: "01—03", steps: [
        { title: "Найти возможность", description: "Сравнить товар с заметной разницей в ценах", duration: "Сразу", deliverable: "Список товаров" },
        { title: "Уточнить запрос", description: "Согласовать товар, количество и бюджет", duration: "1 рабочий день", deliverable: "Подтверждённый запрос" },
        { title: "Подобрать источник", description: "Проверить поставщиков и подготовить цену", duration: "2—3 рабочих дня", deliverable: "Цена и рекомендация" },
      ] },
      { label: "Исполнение и доставка", range: "04—05", steps: [
        { title: "Закупка и перевозка", description: "Закупка, проверка, сбор, перевозка и таможня", duration: "По заказу", deliverable: "Проверка и статус груза" },
        { title: "Местная передача", description: "Подтвердить получение и начать продажи", duration: "После прибытия", deliverable: "Подтверждение передачи" },
      ] },
    ],
    faqTitle: "Частые вопросы",
    faqs: [
      { question: "Включены ли перевозка и таможня?", answer: `Нет. ${cautiousAnswerRu}` },
      { question: "Как получить полное предложение?", answer: `Свяжитесь с нами любым способом на странице. ${cautiousAnswerRu}` },
      { question: "Каков минимальный заказ?", answer: cautiousAnswerRu },
      { question: "Сколько занимает доставка?", answer: cautiousAnswerRu },
      { question: "Какие услуги доступны?", answer: "Можно согласовать закупку, проверку, консолидацию, перевозку, таможню и местную доставку." },
    ],
    finalTitle: "Нашли товар? Уточните цену и доставку",
    localAdvisor: "Связаться с местным консультантом",
    footerPriceNote: "О ценах",
    privacy: "Политика конфиденциальности",
    close: "Закрыть",
    previous: "Предыдущий товар",
    next: "Следующий товар",
    language: "Язык",
    contactCountry: "Страна обслуживания",
    contactProduct: "Меня интересует товар",
    selectedProduct: "Товар выбран — задать вопрос можно ниже",
  },
  ky: {
    translationStatus: "draft",
    brandName: "Борбор Азия бизнес мүмкүнчүлүктөрү порталы",
    heroTitle: "Кытайдан алып, жергиликтүү базарда сатыңыз",
    heroSubtitle: "Жергиликтүү чекене баа менен Кытайдагы дүң бааны салыштырыңыз",
    localPrice: "Жергиликтүү чекене баа",
    chinaPrice: "Кытайдан алуу баасы",
    priceDisclaimer: "Баалар товарды алдын ала тандоо үчүн гана берилген",
    demoData: "Демо маалымат · текшерилет",
    confirmedDate: "Демо баа текшерилген күн: 28.07.2026",
    popularTitle: "Дагы кеңири сатылган товарлар",
    popularTag: "Кеңири сатылат",
    productCategoryAll: "Бардык товарлар",
    productCategoryLabels: { electronics: "Электроника", home: "Үй үчүн", personal: "Жеке кам көрүү", daily: "Күнүмдүк товарлар" },
    showMore: "Дагы көрсөтүү",
    showLess: "Жыйноо",
    viewDetails: "Толук көрүү",
    productDetails: "Товар тууралуу кыскача",
    referenceDifference: "Баа айырмасынын багыты",
    differenceDisclaimer: "Баа айырмасы чыныгы пайдага тең эмес.",
    landedCostParts: ["Кытайдан алуу баасы", "ташуу · бажы · салык", "жергиликтүү жеткирүү"],
    landedCostResult: "Акыркы жеткирүү баасы (такталат)",
    consultProduct: "Бул товарды сураңыз",
    priceNoteTitle: "Баалар тууралуу",
    priceNote: "Бул жерде бирдей мүнөздөмөдөгү товардын жергиликтүү чекене баасы жана Кытайдан 10 даана алганда бир даананын багыттоочу баасы көрсөтүлөт. Демо баага ташуу, бажы, салык жана башка чыгымдар кирбейт. Баалардын айырмасы пайдага барабар эмес; чыныгы баа кайрылуудан кийин такталат.",
    trust: ["Баалар текшерилип, акыркы күн көрсөтүлөт", "Сатып алуудан жергиликтүү жеткирүүгө чейин жардам", "Кыргызстан жана Өзбекстандагы жергиликтүү байланыш"],
    consultOpportunity: "Бул мүмкүнчүлүк тууралуу сураңыз",
    consultHelp: "Сатып алуу, текшерүү, ташуу, бажы жана жеткирүүгө жардам",
    contactTitle: "Байланыш жолун тандаңыз",
    demoContact: "Демо байланыш",
    contactNote: "Товарды, санын жана жеткирүү шаарын даярдаңыз — текшерүү ушундан башталат.",
    contactOutcomesTitle: "Кайрылууда үч нерсе такталат",
    contactOutcomes: ["Жеткиликтүү мүнөздөмө, сан жана минималдуу заказ", "Шаарга чейинки чыгымдар жана багыттоочу жалпы сумма", "Ташуу ыкмасы жана болжолдуу жеткирүү мөөнөтү"],
    serviceTitle: "Товардан жергиликтүү жеткирүүгө чейин",
    servicePhases: [
      { label: "Алдын ала тактоо", range: "01—03", steps: [
        { title: "Мүмкүнчүлүктү табуу", description: "Баасы айырмаланган товарды көрүү", duration: "Дароо", deliverable: "Тандалган товарлар" },
        { title: "Талапты тактоо", description: "Товарды, санды жана бюджетти тактоо", duration: "1 иш күнү", deliverable: "Такталган талап" },
        { title: "Булакты тандоо", description: "Жеткирүүчүлөрдү текшерип, баа берүү", duration: "2—3 иш күнү", deliverable: "Баа жана сунуш" },
      ] },
      { label: "Аткаруу жана жеткирүү", range: "04—05", steps: [
        { title: "Сатып алуу жана ташуу", description: "Сатып алуу, текшерүү, топтоо, ташуу жана бажы", duration: "Буйрутма боюнча", deliverable: "Текшерүү жана жүк абалы" },
        { title: "Жергиликтүү тапшыруу", description: "Товарды кабыл алып, сатууну баштоо", duration: "Келгенден кийин", deliverable: "Тапшыруу ырастамасы" },
      ] },
    ],
    faqTitle: "Көп берилген суроолор",
    faqs: [
      { question: "Баага ташуу жана бажы киреби?", answer: `Жок. ${cautiousAnswerKy}` },
      { question: "Толук сунушту кантип алам?", answer: `Барактагы байланыш жолдорунун бирин тандаңыз. ${cautiousAnswerKy}` },
      { question: "Минималдуу сан канча?", answer: cautiousAnswerKy },
      { question: "Жеткирүү канча убакыт алат?", answer: cautiousAnswerKy },
      { question: "Кандай кызматтар көрсөтүлөт?", answer: "Сатып алуу, текшерүү, топтоо, ташуу, бажы жана жергиликтүү жеткирүү боюнча жардам берилиши мүмкүн." },
    ],
    finalTitle: "Товар жактыбы? Баасын жана жеткирүүнү тактаңыз",
    localAdvisor: "Жергиликтүү кеңешчи менен байланышуу",
    footerPriceNote: "Баалар тууралуу",
    privacy: "Купуялык саясаты",
    close: "Жабуу",
    previous: "Мурунку товар",
    next: "Кийинки товар",
    language: "Тил",
    contactCountry: "Кызмат өлкөсү",
    contactProduct: "Бул товар боюнча маалымат алгым келет",
    selectedProduct: "Товар тандалды — төмөндө кеңеш алыңыз",
  },
  uz: {
    translationStatus: "draft",
    brandName: "Markaziy Osiyo biznes imkoniyatlari portali",
    heroTitle: "Xitoydan olib, mahalliy bozorda soting",
    heroSubtitle: "Mahalliy chakana narx va Xitoydagi ulgurji narxni solishtiring",
    localPrice: "Mahalliy chakana narx",
    chinaPrice: "Xitoydan olish narxi",
    priceDisclaimer: "Narxlar mahsulotni dastlabki tanlash uchun berilgan",
    demoData: "Demo maʼlumot · tekshiriladi",
    confirmedDate: "Demo narx tekshirilgan sana: 28.07.2026",
    popularTitle: "Yana ommabop mahsulotlar",
    popularTag: "Ommabop",
    productCategoryAll: "Barcha mahsulotlar",
    productCategoryLabels: { electronics: "Elektronika", home: "Uy uchun", personal: "Shaxsiy parvarish", daily: "Kundalik tovarlar" },
    showMore: "Koʻproq koʻrsatish",
    showLess: "Yigʻish",
    viewDetails: "Batafsil",
    productDetails: "Mahsulot tafsilotlari",
    referenceDifference: "Narxlar farqi",
    differenceDisclaimer: "Narxlar farqi haqiqiy foydaga teng emas.",
    landedCostParts: ["Xitoydagi xarid narxi", "tashish · bojxona · soliq", "mahalliy yetkazish"],
    landedCostResult: "Yakuniy yetib kelish xarajati (tekshiriladi)",
    consultProduct: "Bu mahsulotni soʻrang",
    priceNoteTitle: "Narxlar haqida",
    priceNote: "Sahifada bir xil xususiyatdagi mahsulotning mahalliy chakana narxi va Xitoydan 10 dona xarid qilingandagi bir dona uchun moʻljal narxi berilgan. Demo narxlarga tashish, bojxona, soliq va boshqa xarajatlar kirmaydi. Narxlar farqi foydaga teng emas; haqiqiy narx murojaatdan keyin tekshiriladi.",
    trust: ["Narxlar tekshiriladi va soʻnggi sana koʻrsatiladi", "Xariddan mahalliy yetkazishgacha koʻmak", "Qirgʻiziston va Oʻzbekistondagi mahalliy aloqa"],
    consultOpportunity: "Bu imkoniyat haqida soʻrang",
    consultHelp: "Xarid, tekshiruv, tashish, bojxona va yetkazishda koʻmak",
    contactTitle: "Aloqa usulini tanlang",
    demoContact: "Demo aloqa",
    contactNote: "Mahsulot, miqdor va manzil shahrini tayyorlang — tekshiruv shundan boshlanadi.",
    contactOutcomesTitle: "Murojaatda uch jihat tekshiriladi",
    contactOutcomes: ["Mavjud xususiyatlar, miqdor va eng kam buyurtma", "Shahargacha xarajatlar tarkibi va taxminiy jami", "Tashish usuli va taxminiy yetkazish muddati"],
    serviceTitle: "Mahsulotdan mahalliy yetkazishgacha",
    servicePhases: [
      { label: "Dastlabki aniqlash", range: "01—03", steps: [
        { title: "Imkoniyatni topish", description: "Narxi farq qiladigan mahsulotni koʻrish", duration: "Darhol", deliverable: "Tanlangan mahsulotlar" },
        { title: "Talabni aniqlash", description: "Mahsulot, miqdor va budjetni tasdiqlash", duration: "1 ish kuni", deliverable: "Tasdiqlangan talab" },
        { title: "Manbani tanlash", description: "Yetkazib beruvchini tekshirib, narx berish", duration: "2—3 ish kuni", deliverable: "Narx va tavsiya" },
      ] },
      { label: "Bajarish va yetkazish", range: "04—05", steps: [
        { title: "Xarid va tashish", description: "Xarid, tekshiruv, yigʻish, tashish va bojxona", duration: "Buyurtma boʻyicha", deliverable: "Tekshiruv va yuk holati" },
        { title: "Mahalliy topshirish", description: "Qabulni tasdiqlab, sotishni boshlash", duration: "Yetib kelgach", deliverable: "Topshirish tasdigʻi" },
      ] },
    ],
    faqTitle: "Koʻp soʻraladigan savollar",
    faqs: [
      { question: "Narxga tashish va bojxona kiradimi?", answer: `Yoʻq. ${cautiousAnswerUz}` },
      { question: "Toʻliq taklifni qanday olaman?", answer: `Sahifadagi aloqa usullaridan birini tanlang. ${cautiousAnswerUz}` },
      { question: "Eng kam xarid miqdori qancha?", answer: cautiousAnswerUz },
      { question: "Yetkazish qancha vaqt oladi?", answer: cautiousAnswerUz },
      { question: "Qanday xizmatlar bor?", answer: "Xarid, tekshiruv, yigʻish, tashish, bojxona va mahalliy yetkazish boʻyicha koʻmak berilishi mumkin." },
    ],
    finalTitle: "Mahsulot yoqdimi? Narx va yetkazishni aniqlang",
    localAdvisor: "Mahalliy maslahatchi bilan bogʻlanish",
    footerPriceNote: "Narxlar haqida",
    privacy: "Maxfiylik siyosati",
    close: "Yopish",
    previous: "Oldingi mahsulot",
    next: "Keyingi mahsulot",
    language: "Til",
    contactCountry: "Xizmat mamlakati",
    contactProduct: "Bu mahsulot haqida maʼlumot olmoqchiman",
    selectedProduct: "Mahsulot tanlandi — quyida maslahat oling",
  },
};
