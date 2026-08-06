import type { CountryCode, CountryPrice, Currency, Language } from "./types";
import { products } from "./products";

const kgsLocal = [2250, 1850, 260, 1650, 2100, 820, 380, 1450, 2400, 1250, 980, 1900, 3100, 1350, 2350, 1250, 950, 2800, 1150, 1750];
const kgsChina = [980, 760, 105, 690, 920, 340, 145, 610, 1020, 520, 390, 760, 1380, 550, 980, 480, 390, 1180, 470, 720];
const uzsLocal = [329000, 269000, 39000, 239000, 305000, 119000, 55000, 209000, 349000, 179000, 139000, 279000, 449000, 199000, 339000, 179000, 139000, 399000, 169000, 249000];
const uzsChina = [143000, 110000, 15000, 99000, 132000, 49000, 21000, 88000, 146000, 75000, 56000, 109000, 198000, 79000, 141000, 69000, 56000, 169000, 68000, 103000];

const buildPrices = (
  country: CountryCode,
  currency: Currency,
  local: number[],
  china: number[],
): CountryPrice[] =>
  products.map((product, index) => ({
    country,
    productId: product.id,
    localRetailPrice: local[index],
    chinaReferencePrice: china[index],
    currency,
    confirmedAt: "2026-07-28",
    status: "demo",
    referenceQuantity: 10,
  }));

export const prices: Record<CountryCode, CountryPrice[]> = {
  kg: buildPrices("kg", "KGS", kgsLocal, kgsChina),
  uz: buildPrices("uz", "UZS", uzsLocal, uzsChina),
};

export function getPrice(country: CountryCode, productId: string) {
  return prices[country].find((price) => price.productId === productId)!;
}

export const languageCurrency: Record<Language, Currency> = {
  zh: "CNY",
  uz: "UZS",
  ky: "KGS",
  ru: "RUB",
  en: "USD",
};

// Demo conversion baseline. Source market prices remain stored in KGS or UZS;
// only their presentation currency changes with the selected interface language.
const usdPerUnit: Record<Currency, number> = {
  KGS: 1 / 87.5,
  UZS: 1 / 12_500,
  CNY: 1 / 7.2,
  RUB: 1 / 90,
  USD: 1,
};

export function convertPrice(value: number, sourceCurrency: Currency, targetCurrency: Currency) {
  if (sourceCurrency === targetCurrency) return value;
  return value * usdPerUnit[sourceCurrency] / usdPerUnit[targetCurrency];
}

export function formatPrice(value: number, sourceCurrency: Currency, language: Language) {
  const currency = languageCurrency[language];
  const converted = convertPrice(value, sourceCurrency, currency);
  const fractionDigits = currency === "USD" ? 2 : 0;
  const amount = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(converted).replace(/\u202f/g, " ");

  if (currency === "CNY") return `¥${amount}`;
  if (currency === "USD") return `$${amount}`;
  if (currency === "RUB") return `${amount} ₽`;
  if (currency === "KGS") return `${amount} сом`;
  return `${amount} soʻm`;
}
