import type { CountryCode, CountryPrice, Currency } from "./types";
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

export function formatPrice(value: number, currency: Currency) {
  const amount = new Intl.NumberFormat("fr-FR").format(value).replace(/\u202f/g, " ");
  return `${amount} ${currency === "KGS" ? "сом" : "soʻm"}`;
}
