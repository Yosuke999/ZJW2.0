import type { Language } from "./types";

export type IntentCopy = {
  account: string; signIn: string; signUp: string; signOut: string;
  email: string; password: string; displayName: string; country: string; city: string;
  phone: string; whatsapp: string; telegram: string; preferredContact: string;
  consent: string; authIntro: string; loginTab: string; registerTab: string;
  submitLogin: string; submitRegister: string; checkEmail: string; authError: string;
  loginSuccess: string;
  callback: string; callbackHint: string; purchaseIntent: string; purchaseHint: string;
  signInRequired: string; signInToContinue: string; quantity: string; note: string;
  deliveryCity: string; customProduct: string; submitIntent: string; submitting: string;
  intentSuccess: string; profileIncomplete: string; externalContact: string;
  myProfile: string; saveProfile: string; myIntents: string; noIntents: string; backToMarket: string;
  status: Record<string, string>; intentTypes: Record<string, string>;
};

const zh: IntentCopy = {
  account: "账户", signIn: "登录", signUp: "注册", signOut: "退出登录",
  email: "邮箱", password: "密码", displayName: "姓名", country: "服务市场", city: "所在/收货城市",
  phone: "手机号", whatsapp: "WhatsApp", telegram: "Telegram", preferredContact: "优先联系方式",
  consent: "我同意服务方使用以上联系方式跟进本次及后续采购意向。", authIntro: "注册后可提交采购意向，并在账户中查看处理状态。", loginTab: "已有账户", registerTab: "创建账户",
  submitLogin: "登录", submitRegister: "注册并继续", checkEmail: "注册成功，请先到邮箱完成确认后再登录。", authError: "操作未完成，请检查信息后重试。",
  loginSuccess: "\u767b\u5f55\u6210\u529f\uff0c\u4ee5\u4e0b\u662f\u4f60\u5df2\u4fdd\u5b58\u7684\u8d26\u6237\u8d44\u6599\u3002",
  callback: "请顾问联系我", callbackHint: "无需填长表，顾问会按你的优先联系方式联系。", purchaseIntent: "提交采购意向", purchaseHint: "只需填写大致数量、城市和简单说明。",
  signInRequired: "登录后提交", signInToContinue: "登录或注册后，我们会带你回到当前商品。", quantity: "大致数量（可选）", note: "补充说明（可选）",
  deliveryCity: "收货城市", customProduct: "想采购的商品", submitIntent: "提交意向", submitting: "提交中…",
  intentSuccess: "已收到，我们会通过你的优先联系方式跟进。", profileIncomplete: "请先在账户中补全姓名、城市和至少一种联系方式。", externalContact: "也可以直接联系",
  myProfile: "我的资料", saveProfile: "保存", myIntents: "我的意向", noIntents: "还没有提交过意向。", backToMarket: "返回商机页面",
  status: { new: "待联系", contacted: "已联系", qualified: "跟进中", closed: "已结束", spam: "已关闭" },
  intentTypes: { callback: "联系意向", purchase_intent: "采购意向" },
};

const ru: IntentCopy = {
  ...zh, account: "Аккаунт", signIn: "Войти", signUp: "Регистрация", signOut: "Выйти", email: "Эл. почта", password: "Пароль", displayName: "Имя", country: "Рынок", city: "Город",
  phone: "Телефон", preferredContact: "Предпочтительный канал", consent: "Я согласен(на) на использование этих контактов для связи по моему запросу.", authIntro: "После регистрации можно отправлять запросы и отслеживать их статус.", loginTab: "Вход", registerTab: "Регистрация", submitLogin: "Войти", submitRegister: "Зарегистрироваться", checkEmail: "Проверьте почту и подтвердите регистрацию.", authError: "Не удалось выполнить действие. Проверьте данные и попробуйте снова.",
  callback: "Свяжитесь со мной", callbackHint: "Консультант свяжется с вами удобным способом.", purchaseIntent: "Запрос на закупку", purchaseHint: "Укажите примерное количество, город и короткий комментарий.", signInRequired: "Войти для отправки", signInToContinue: "После входа вы вернетесь к выбранному товару.", quantity: "Примерное количество", note: "Комментарий", deliveryCity: "Город доставки", customProduct: "Нужный товар", submitIntent: "Отправить", submitting: "Отправка…", intentSuccess: "Запрос получен. Мы свяжемся с вами.", profileIncomplete: "Заполните имя, город и хотя бы один контакт в аккаунте.", externalContact: "Или свяжитесь напрямую", myProfile: "Мой профиль", saveProfile: "Сохранить", myIntents: "Мои запросы", noIntents: "Запросов пока нет.", backToMarket: "Вернуться к товарам",
  loginSuccess: "Вы вошли. Ниже показаны сохраненные данные аккаунта.",
  status: { new: "Ожидает связи", contacted: "Связались", qualified: "В работе", closed: "Завершён", spam: "Закрыт" },
  intentTypes: { callback: "Запрос на связь", purchase_intent: "Запрос на закупку" },
};

const ky: IntentCopy = {
  account: "Жеке кабинет", signIn: "Кирүү", signUp: "Катталуу", signOut: "Чыгуу",
  email: "Электрондук почта", password: "Сырсөз", displayName: "Аты-жөнү", country: "Базар", city: "Шаар",
  phone: "Телефон", whatsapp: "WhatsApp", telegram: "Telegram", preferredContact: "Ыңгайлуу байланыш жолу",
  consent: "Бул жана кийинки сатып алуу өтүнмөлөрүм боюнча байланышуу үчүн жогорудагы байланыш маалыматтарын колдонууга макулмун.",
  authIntro: "Катталгандан кийин сатып алуу өтүнмөлөрүн жөнөтүп, алардын абалын жеке кабинеттен көрө аласыз.",
  loginTab: "Аккаунтум бар", registerTab: "Аккаунт түзүү", submitLogin: "Кирүү", submitRegister: "Катталып, улантуу",
  checkEmail: "Каттоо аяктады. Электрондук почтаңызды текшерип, аккаунтуңузду ырастаңыз.",
  authError: "Аракет аткарылган жок. Маалыматтарды текшерип, кайра аракет кылыңыз.",
  loginSuccess: "Кирүү ийгиликтүү болду. Төмөндө сакталган аккаунт маалыматыңыз көрсөтүлдү.",
  callback: "Кеңешчи мага байланышсын", callbackHint: "Узун форма толтуруунун кереги жок. Кеңешчи сиз тандаган байланыш жолу аркылуу байланышат.",
  purchaseIntent: "Сатып алуу өтүнмөсүн жөнөтүү", purchaseHint: "Болжолдуу санын, шаарды жана кыскача түшүндүрмөнү жазыңыз.",
  signInRequired: "Кирип жөнөтүү", signInToContinue: "Киргенден же катталгандан кийин ушул товарга кайра келесиз.",
  quantity: "Болжолдуу саны (милдеттүү эмес)", note: "Кошумча маалымат (милдеттүү эмес)", deliveryCity: "Жеткирүү шаары",
  customProduct: "Сатып алгыңыз келген товар", submitIntent: "Өтүнмөнү жөнөтүү", submitting: "Жөнөтүлүүдө…",
  intentSuccess: "Өтүнмө кабыл алынды. Сиз тандаган байланыш жолу менен байланышабыз.",
  profileIncomplete: "Жеке кабинетте аты-жөнүңүздү, шаарды жана жок дегенде бир байланыш жолун толтуруңуз.",
  externalContact: "Же түз байланышсаңыз болот", myProfile: "Менин маалыматтарым", saveProfile: "Сактоо",
  myIntents: "Менин өтүнмөлөрүм", noIntents: "Азырынча өтүнмө жөнөтө элексиз.", backToMarket: "Товарлар барагына кайтуу",
  status: { new: "Байланыш күтүлүүдө", contacted: "Байланышты", qualified: "Иштелүүдө", closed: "Аяктады", spam: "Жабылды" },
  intentTypes: { callback: "Байланыш өтүнмөсү", purchase_intent: "Сатып алуу өтүнмөсү" },
};

const uz: IntentCopy = {
  account: "Shaxsiy kabinet", signIn: "Kirish", signUp: "Ro‘yxatdan o‘tish", signOut: "Chiqish",
  email: "E-pochta", password: "Parol", displayName: "Ism", country: "Bozor", city: "Shahar",
  phone: "Telefon", whatsapp: "WhatsApp", telegram: "Telegram", preferredContact: "Qulay aloqa usuli",
  consent: "Ushbu va keyingi xarid so‘rovlarim bo‘yicha bog‘lanish uchun yuqoridagi aloqa ma’lumotlaridan foydalanishga roziman.",
  authIntro: "Ro‘yxatdan o‘tgach, xarid so‘rovlarini yuborishingiz va ularning holatini shaxsiy kabinetda kuzatishingiz mumkin.",
  loginTab: "Akkauntim bor", registerTab: "Akkaunt yaratish", submitLogin: "Kirish", submitRegister: "Ro‘yxatdan o‘tib davom etish",
  checkEmail: "Ro‘yxatdan o‘tish yakunlandi. E-pochtangizni tekshirib, akkauntingizni tasdiqlang.",
  authError: "Amal bajarilmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.",
  loginSuccess: "Kirish muvaffaqiyatli. Quyida saqlangan akkaunt ma’lumotlaringiz ko‘rsatilgan.",
  callback: "Maslahatchi men bilan bog‘lansin", callbackHint: "Uzun shaklni to‘ldirish shart emas. Maslahatchi siz tanlagan aloqa usuli orqali bog‘lanadi.",
  purchaseIntent: "Xarid so‘rovini yuborish", purchaseHint: "Taxminiy miqdor, shahar va qisqa izohni kiriting.",
  signInRequired: "Kirish va yuborish", signInToContinue: "Kirganingizdan yoki ro‘yxatdan o‘tganingizdan so‘ng ushbu mahsulotga qaytasiz.",
  quantity: "Taxminiy miqdor (ixtiyoriy)", note: "Qo‘shimcha izoh (ixtiyoriy)", deliveryCity: "Yetkazib berish shahri",
  customProduct: "Xarid qilmoqchi bo‘lgan mahsulot", submitIntent: "So‘rovni yuborish", submitting: "Yuborilmoqda…",
  intentSuccess: "So‘rov qabul qilindi. Siz tanlagan aloqa usuli orqali bog‘lanamiz.",
  profileIncomplete: "Shaxsiy kabinetda ismingiz, shaharingiz va kamida bitta aloqa usulini kiriting.",
  externalContact: "Yoki to‘g‘ridan-to‘g‘ri bog‘laning", myProfile: "Mening ma’lumotlarim", saveProfile: "Saqlash",
  myIntents: "Mening so‘rovlarim", noIntents: "Hozircha so‘rov yubormagansiz.", backToMarket: "Mahsulotlar sahifasiga qaytish",
  status: { new: "Aloqa kutilmoqda", contacted: "Bog‘lanildi", qualified: "Jarayonda", closed: "Yakunlandi", spam: "Yopildi" },
  intentTypes: { callback: "Bog‘lanish so‘rovi", purchase_intent: "Xarid so‘rovi" },
};

export const intentTranslations: Record<Language, IntentCopy> = { zh, ru, ky, uz };
