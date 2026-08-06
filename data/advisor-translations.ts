import type { Language } from "./types";

export type AdvisorCopy = {
  backToMarket: string;
  workspace: string;
  intro: string;
  signedInAs: string;
  noAccessTitle: string;
  noAccessBody: string;
  marketScope: string;
  allMarkets: string;
  noMarketTitle: string;
  noMarketBody: string;
  language: string;
  pending: string;
  processed: string;
  total: string;
  management: string;
  filters: Record<string, string>;
  allVisible: string;
  pendingInfo: string;
  processedInfo: string;
  noPending: string;
  noProcessed: string;
  processFailed: string;
  customer: string;
  email: string;
  contact: string;
  city: string;
  product: string;
  quantity: string;
  source: string;
  notProvided: string;
  advisorConsultation: string;
  markContacted: string;
  markQualified: string;
  markClosed: string;
  close: string;
  status: Record<string, string>;
  intentTypes: Record<string, string>;
  channels: Record<string, string>;
};

const zh: AdvisorCopy = {
  backToMarket: "← 返回商机页面",
  workspace: "顾问工作台",
  intro: "处理采购意向和咨询申请。",
  signedInAs: "登录账号",
  noAccessTitle: "没有访问权限",
  noAccessBody: "当前账号不是当地顾问或管理员账号。请先让管理员在 Supabase 的 profiles 表里把该账号 role 设置为 staff、reviewer 或 admin。",
  marketScope: "负责市场",
  allMarkets: "全部市场",
  noMarketTitle: "未绑定负责市场",
  noMarketBody: "当前顾问账号还没有设置 country_code。请管理员先在 profiles 表中设置负责市场，例如 uz 或 kg。",
  language: "界面语言",
  pending: "待处理",
  processed: "已处理",
  total: "全部意向",
  management: "意向管理",
  filters: { all: "全部", new: "待处理", contacted: "已联系", qualified: "跟进中", closed: "已结束", spam: "已关闭" },
  allVisible: "筛选结果",
  pendingInfo: "待处理信息",
  processedInfo: "已处理信息",
  noPending: "当前没有待处理意向。",
  noProcessed: "当前没有已处理记录。",
  processFailed: "处理失败，请刷新后重试。",
  customer: "客户",
  email: "注册邮箱",
  contact: "联系方式",
  city: "城市",
  product: "商品",
  quantity: "数量",
  source: "来源",
  notProvided: "未填写",
  advisorConsultation: "咨询顾问",
  markContacted: "标记已联系",
  markQualified: "标记跟进中",
  markClosed: "标记已结束",
  close: "关闭",
  status: { new: "待处理", contacted: "已联系", qualified: "跟进中", closed: "已结束", spam: "已关闭" },
  intentTypes: { callback: "咨询申请", purchase_intent: "采购意向" },
  channels: { phone: "手机", whatsapp: "WhatsApp", telegram: "Telegram" },
};

const ru: AdvisorCopy = {
  ...zh,
  backToMarket: "← Вернуться к витрине",
  workspace: "Рабочее место консультанта",
  intro: "Обработка заявок на консультацию и закупку.",
  signedInAs: "Аккаунт",
  noAccessTitle: "Нет доступа",
  noAccessBody: "Этот аккаунт не является консультантом или администратором. Попросите администратора установить role: staff, reviewer или admin в таблице profiles.",
  marketScope: "Рынок",
  allMarkets: "Все рынки",
  noMarketTitle: "Рынок не назначен",
  noMarketBody: "У аккаунта консультанта не задан country_code. Администратор должен указать рынок в profiles, например uz или kg.",
  language: "Язык интерфейса",
  pending: "Новые",
  processed: "Обработанные",
  total: "Всего",
  management: "Управление заявками",
  filters: { all: "Все", new: "Новые", contacted: "Связались", qualified: "В работе", closed: "Завершены", spam: "Закрыты" },
  allVisible: "Результаты фильтра",
  pendingInfo: "Новые заявки",
  processedInfo: "Обработанные заявки",
  noPending: "Новых заявок нет.",
  noProcessed: "Обработанных записей пока нет.",
  processFailed: "Не удалось обновить статус. Обновите страницу и попробуйте снова.",
  customer: "Клиент",
  email: "Электронная почта",
  contact: "Контакт",
  city: "Город",
  product: "Товар",
  quantity: "Количество",
  source: "Источник",
  notProvided: "Не указано",
  advisorConsultation: "Консультация",
  markContacted: "Отметить: связались",
  markQualified: "Отметить: в работе",
  markClosed: "Отметить: завершено",
  close: "Закрыть",
  status: { new: "Новая", contacted: "Связались", qualified: "В работе", closed: "Завершена", spam: "Закрыта" },
  intentTypes: { callback: "Заявка на консультацию", purchase_intent: "Заявка на закупку" },
  channels: { phone: "Телефон", whatsapp: "WhatsApp", telegram: "Telegram" },
};

const ky: AdvisorCopy = {
  ...ru,
  backToMarket: "← Базар бетине кайтуу",
  workspace: "Кеңешчинин иш тактасы",
  intro: "Сатып алуу ниеттерин жана консультация арыздарын иштетүү.",
  signedInAs: "Аккаунт",
  noAccessTitle: "Кирүү укугу жок",
  noAccessBody: "Бул аккаунт жергиликтүү кеңешчи же администратор эмес. Администратор profiles таблицасында role маанисин staff, reviewer же admin кылып коюшу керек.",
  marketScope: "Жооптуу базар",
  allMarkets: "Бардык базарлар",
  noMarketTitle: "Жооптуу базар коюлган эмес",
  noMarketBody: "Бул кеңешчи аккаунтунда country_code коюлган эмес. Администратор profiles таблицасында kg же uz сыяктуу базарды көрсөтүшү керек.",
  language: "Интерфейс тили",
  pending: "Күтүүдө",
  processed: "Иштетилди",
  total: "Бардыгы",
  management: "Өтүнмөлөрдү башкаруу",
  filters: { all: "Баары", new: "Күтүүдө", contacted: "Байланышты", qualified: "Иштөөдө", closed: "Аяктады", spam: "Жабылды" },
  allVisible: "Чыпка жыйынтыгы",
  pendingInfo: "Күтүүдөгү билдирүүлөр",
  processedInfo: "Иштетилген билдирүүлөр",
  noPending: "Азыр күтүүдөгү ниет жок.",
  noProcessed: "Азырынча иштетилген жазуу жок.",
  processFailed: "Иштетүү ишке ашкан жок. Баракты жаңыртып кайра аракет кылыңыз.",
  customer: "Кардар",
  email: "Электрондук почта",
  contact: "Байланыш",
  city: "Шаар",
  product: "Товар",
  quantity: "Саны",
  source: "Булак",
  notProvided: "Толтурулган эмес",
  advisorConsultation: "Кеңешчи консультациясы",
  markContacted: "Байланышты деп белгилөө",
  markQualified: "Иштөөдө деп белгилөө",
  markClosed: "Аяктады деп белгилөө",
  close: "Жабуу",
  status: { new: "Күтүүдө", contacted: "Байланышты", qualified: "Иштөөдө", closed: "Аяктады", spam: "Жабылды" },
  intentTypes: { callback: "Консультация арызы", purchase_intent: "Сатып алуу ниети" },
  channels: { phone: "Телефон", whatsapp: "WhatsApp", telegram: "Telegram" },
};

const uz: AdvisorCopy = {
  ...ru,
  backToMarket: "← Bozor sahifasiga qaytish",
  workspace: "Maslahatchi ish paneli",
  intro: "Xarid niyatlari va maslahat so‘rovlarini ko‘rib chiqish.",
  signedInAs: "Akkaunt",
  noAccessTitle: "Kirish huquqi yo‘q",
  noAccessBody: "Bu akkaunt mahalliy maslahatchi yoki administrator emas. Administrator profiles jadvalida role qiymatini staff, reviewer yoki admin qilib belgilashi kerak.",
  marketScope: "Mas’ul bozor",
  allMarkets: "Barcha bozorlar",
  noMarketTitle: "Mas’ul bozor belgilanmagan",
  noMarketBody: "Ushbu maslahatchi akkauntida country_code belgilanmagan. Administrator profiles jadvalida uz yoki kg kabi bozorni ko‘rsatishi kerak.",
  language: "Interfeys tili",
  pending: "Kutilmoqda",
  processed: "Ko‘rib chiqilgan",
  total: "Jami",
  management: "So‘rovlarni boshqarish",
  filters: { all: "Barchasi", new: "Kutilmoqda", contacted: "Bog‘lanildi", qualified: "Jarayonda", closed: "Yakunlandi", spam: "Yopildi" },
  allVisible: "Filtr natijalari",
  pendingInfo: "Kutilayotgan ma’lumotlar",
  processedInfo: "Ko‘rib chiqilgan ma’lumotlar",
  noPending: "Hozircha kutilayotgan niyat yo‘q.",
  noProcessed: "Hozircha ko‘rib chiqilgan yozuv yo‘q.",
  processFailed: "Amal bajarilmadi. Sahifani yangilab qayta urinib ko‘ring.",
  customer: "Mijoz",
  email: "E-pochta",
  contact: "Aloqa",
  city: "Shahar",
  product: "Mahsulot",
  quantity: "Miqdor",
  source: "Manba",
  notProvided: "Kiritilmagan",
  advisorConsultation: "Maslahatchi bilan aloqa",
  markContacted: "Bog‘lanildi deb belgilash",
  markQualified: "Jarayonda deb belgilash",
  markClosed: "Yakunlandi deb belgilash",
  close: "Yopish",
  status: { new: "Kutilmoqda", contacted: "Bog‘lanildi", qualified: "Jarayonda", closed: "Yakunlandi", spam: "Yopildi" },
  intentTypes: { callback: "Maslahat so‘rovi", purchase_intent: "Xarid niyati" },
  channels: { phone: "Telefon", whatsapp: "WhatsApp", telegram: "Telegram" },
};

const en: AdvisorCopy = {
  backToMarket: "← Back to opportunities",
  workspace: "Advisor workspace",
  intro: "Manage sourcing and consultation requests.",
  signedInAs: "Signed in as",
  noAccessTitle: "Access denied",
  noAccessBody: "This account is not an advisor or administrator. Ask an administrator to set role to staff, reviewer or admin in the profiles table.",
  marketScope: "Assigned market",
  allMarkets: "All markets",
  noMarketTitle: "No market assigned",
  noMarketBody: "This advisor account has no country_code. Ask an administrator to assign kg or uz in the profiles table.",
  language: "Interface language",
  pending: "Pending",
  processed: "Processed",
  total: "Total requests",
  management: "Request management",
  filters: { all: "All", new: "Pending", contacted: "Contacted", qualified: "In progress", closed: "Completed", spam: "Closed" },
  allVisible: "Filtered results",
  pendingInfo: "Pending requests",
  processedInfo: "Processed requests",
  noPending: "There are no pending requests.",
  noProcessed: "There are no processed records yet.",
  processFailed: "The update failed. Refresh the page and try again.",
  customer: "Customer",
  email: "Registration email",
  contact: "Contact",
  city: "City",
  product: "Product",
  quantity: "Quantity",
  source: "Source",
  notProvided: "Not provided",
  advisorConsultation: "Advisor consultation",
  markContacted: "Mark contacted",
  markQualified: "Mark in progress",
  markClosed: "Mark completed",
  close: "Close",
  status: { new: "Pending", contacted: "Contacted", qualified: "In progress", closed: "Completed", spam: "Closed" },
  intentTypes: { callback: "Consultation request", purchase_intent: "Sourcing request" },
  channels: { phone: "Phone", whatsapp: "WhatsApp", telegram: "Telegram" },
};

export const advisorTranslations: Record<Language, AdvisorCopy> = { zh, ru, ky, uz, en };
