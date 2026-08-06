import type { Language, Product } from "./types";

const localized = (
  zh: string,
  ru: string,
  ky: string,
  uz: string,
  en: string,
): Record<Language, string> => ({ zh, ru, ky, uz, en });

const rows = [
  ["glass-kettle", "♨", "kitchen", "玻璃电热水壶", "Стеклянный электрочайник", "Айнек электр чайнек", "Shisha elektr choynak", "1.7L · 1500–2200W · 欧规插头", "1,7 л · 1500–2200 Вт · евровилка", "1,7 л · 1500–2200 Вт · евро сайгыч", "1,7 l · 1500–2200 Vt · Yevropa vilkasi"],
  ["power-bank", "▣", "electronics", "充电宝", "Внешний аккумулятор", "Тышкы аккумулятор", "Powerbank", "10000mAh · 22.5W · 数显", "10000 мАч · 22,5 Вт · дисплей", "10000 мАч · 22,5 Вт · дисплей", "10000 mA·soat · 22,5 Vt · displey"],
  ["led-bulb", "◉", "lighting", "LED 灯泡", "Светодиодная лампа", "LED лампа", "LED chiroq", "12W · E27 · 白光", "12 Вт · E27 · белый свет", "12 Вт · E27 · ак жарык", "12 Vt · E27 · oq yorugʻlik"],
  ["tws-earbuds", "◖◗", "electronics", "TWS 真无线耳机", "Беспроводные наушники TWS", "TWS зымсыз кулакчын", "TWS simsiz quloqchin", "蓝牙 5.3 · Type-C 充电", "Bluetooth 5.3 · зарядка Type-C", "Bluetooth 5.3 · Type-C кубаттоо", "Bluetooth 5.3 · Type-C quvvatlash"],
  ["hair-dryer", "≋", "personal-care", "家用电吹风", "Домашний фен", "Үй фени", "Uy soch quritgichi", "1800W · 欧规插头 · 冷热风", "1800 Вт · евровилка · холод/тепло", "1800 Вт · евро сайгыч · муздак/ысык", "1800 Vt · Yevropa vilkasi · sovuq/issiq"],
  ["pd-charger", "▰", "electronics", "快充充电头", "Быстрое зарядное устройство", "Тез кубаттагыч", "Tez quvvatlagich", "20W · USB-C PD · 欧规插头", "20 Вт · USB-C PD · евровилка", "20 Вт · USB-C PD · евро сайгыч", "20 Vt · USB-C PD · Yevropa vilkasi"],
  ["type-c-cable", "⌁", "electronics", "Type-C 数据线", "Кабель Type-C", "Type-C кабели", "Type-C kabeli", "1m · 60W · 编织线", "1 м · 60 Вт · оплётка", "1 м · 60 Вт · өрүлгөн", "1 m · 60 Vt · oʻrama"],
  ["power-strip", "▭", "home", "插线板", "Сетевой фильтр", "Узарткыч", "Uzatma rozetka", "3 位五孔 · 2m · 总控开关", "3 розетки · 2 м · общий выключатель", "3 розетка · 2 м · жалпы өчүргүч", "3 rozetka · 2 m · umumiy kalit"],
  ["hair-clipper", "▥", "personal-care", "充电式理发器", "Аккумуляторная машинка", "Кубатталуучу чач алгыч", "Quvvatlanuvchi soch olgich", "锂电 · Type-C · 配限位梳", "литий · Type-C · насадки", "литий · Type-C · тарактар", "litiy · Type-C · nasadkalar"],
  ["flashlight", "◒", "lighting", "充电式手电筒", "Аккумуляторный фонарь", "Кубатталуучу кол чырак", "Quvvatlanuvchi fonar", "锂电 · Type-C · 500–1000 流明", "литий · Type-C · 500–1000 лм", "литий · Type-C · 500–1000 лм", "litiy · Type-C · 500–1000 lyumen"],
  ["car-holder", "⌑", "auto", "车载手机支架", "Автомобильный держатель", "Унаа телефон кармагыч", "Avtomobil telefon tutqichi", "重力夹持 · 出风口款", "зажим · на дефлектор", "кыскыч · аба тешигине", "qisqich · havo panjarasiga"],
  ["thermal-jug", "♨", "kitchen", "不锈钢保温壶", "Термос из нержавеющей стали", "Дат баспас термос", "Zanglamas termos", "1L · 双层真空", "1 л · двойной вакуум", "1 л · кош вакуум", "1 l · ikki qavat vakuum"],
  ["steam-iron", "⌂", "home", "蒸汽电熨斗", "Паровой утюг", "Буу үтүк", "Bugʻli dazmol", "约 2000W · 欧规插头", "около 2000 Вт · евровилка", "2000 Вт чамасында · евро сайгыч", "taxminan 2000 Vt · Yevropa vilkasi"],
  ["desk-lamp", "◜", "lighting", "充电式 LED 台灯", "Аккумуляторная LED-лампа", "Кубатталуучу LED чырак", "Quvvatlanuvchi LED stol chirogʻi", "锂电 · Type-C · 三档亮度", "литий · Type-C · 3 уровня", "литий · Type-C · 3 деңгээл", "litiy · Type-C · 3 daraja"],
  ["shaver", "▦", "personal-care", "电动剃须刀", "Электробритва", "Электр устара", "Elektr soqol olgich", "锂电 · Type-C · 三刀头", "литий · Type-C · 3 головки", "литий · Type-C · 3 баш", "litiy · Type-C · 3 bosh"],
  ["kitchen-scale", "▱", "kitchen", "电子厨房秤", "Кухонные весы", "Ашкана таразасы", "Oshxona tarozisi", "5kg/1g · LCD 显示", "5 кг/1 г · LCD", "5 кг/1 г · LCD", "5 kg/1 g · LCD"],
  ["toy-car", "▰", "toys", "儿童合金回力玩具汽车", "Инерционная машинка", "Инерциялуу оюнчук унаа", "Inersiyali oʻyinchoq mashina", "约 1:32 · 无遥控", "около 1:32 · без пульта", "1:32 чамасында · пультсуз", "taxminan 1:32 · pultsiz"],
  ["backpack", "▩", "bags", "双肩背包", "Рюкзак", "Рюкзак", "Ryukzak", "约 20–25L · 防泼水 · 通勤款", "20–25 л · водоотталкивающий", "20–25 л · суу өткөрбөс", "20–25 l · suv qaytargich"],
  ["umbrella", "☂", "home", "折叠雨伞", "Складной зонт", "Бүктөлмө кол чатыр", "Buklama soyabon", "自动开合 · 约 105cm · 8 骨", "автомат · около 105 см · 8 спиц", "автомат · 105 см · 8 сөөк", "avtomat · 105 sm · 8 sim"],
  ["screwdriver-set", "✣", "tools", "多功能螺丝刀套装", "Набор отвёрток", "Бурагычтар топтому", "Otvyortkalar toʻplami", "常用批头 · 带收纳盒", "основные биты · футляр", "негизги учтар · куту", "asosiy uchlar · quti"],
] as const;

const englishNames: Record<string, string> = {
  "glass-kettle": "Glass electric kettle",
  "power-bank": "Power bank",
  "led-bulb": "LED light bulb",
  "tws-earbuds": "TWS wireless earbuds",
  "hair-dryer": "Hair dryer",
  "pd-charger": "Fast charger",
  "type-c-cable": "Type-C cable",
  "power-strip": "Power strip",
  "hair-clipper": "Rechargeable hair clipper",
  flashlight: "Rechargeable flashlight",
  "car-holder": "Car phone holder",
  "thermal-jug": "Stainless steel thermal jug",
  "steam-iron": "Steam iron",
  "desk-lamp": "Rechargeable LED desk lamp",
  shaver: "Electric shaver",
  "kitchen-scale": "Digital kitchen scale",
  "toy-car": "Pull-back toy car",
  backpack: "Backpack",
  umbrella: "Folding umbrella",
  "screwdriver-set": "Multi-purpose screwdriver set",
};

const englishSpecifications: Record<string, string> = {
  "glass-kettle": "1.7 L · 1500–2200 W · EU plug",
  "power-bank": "10,000 mAh · 22.5 W · digital display",
  "led-bulb": "12 W · E27 · white light",
  "tws-earbuds": "Bluetooth 5.3 · Type-C charging",
  "hair-dryer": "1800 W · EU plug · hot/cold air",
  "pd-charger": "20 W · USB-C PD · EU plug",
  "type-c-cable": "1 m · 60 W · braided cable",
  "power-strip": "3 outlets · 2 m · master switch",
  "hair-clipper": "Lithium battery · Type-C · guide combs",
  flashlight: "Lithium battery · Type-C · 500–1000 lm",
  "car-holder": "Gravity clamp · air-vent mount",
  "thermal-jug": "1 L · double-wall vacuum",
  "steam-iron": "Approx. 2000 W · EU plug",
  "desk-lamp": "Lithium battery · Type-C · 3 brightness levels",
  shaver: "Lithium battery · Type-C · 3 heads",
  "kitchen-scale": "5 kg / 1 g · LCD display",
  "toy-car": "Approx. 1:32 · no remote control",
  backpack: "Approx. 20–25 L · water-repellent",
  umbrella: "Automatic · approx. 105 cm · 8 ribs",
  "screwdriver-set": "Common bits · storage case",
};

export const products: Product[] = rows.map((row) => ({
  id: row[0],
  category: row[2],
  image: `/products/${row[0]}.webp`,
  imageStatus: "placeholder",
  name: localized(row[3], row[4], row[5], row[6], englishNames[row[0]]),
  specification: localized(row[7], row[8], row[9], row[10], englishSpecifications[row[0]]),
}));

export const heroProducts = products.slice(0, 5);
