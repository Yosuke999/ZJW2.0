export type CountryCode = "kg" | "uz";
export type Language = "ky" | "uz" | "ru" | "zh" | "en";
export type Currency = "KGS" | "UZS" | "CNY" | "RUB" | "USD";
export type PriceStatus = "demo" | "pending-review" | "verified" | "stale";
export type TranslationStatus =
  | "draft"
  | "pending-review"
  | "approved"
  | "needs-review";

export type Product = {
  id: string;
  image: string;
  imageStatus: "placeholder" | "licensed" | "owned";
  category: string;
  name: Record<Language, string>;
  specification: Record<Language, string>;
};

export type CountryPrice = {
  country: CountryCode;
  productId: string;
  localRetailPrice: number;
  chinaReferencePrice: number;
  currency: Currency;
  confirmedAt: string;
  status: PriceStatus;
  referenceQuantity: 10;
};

export type InquiryPrefill = {
  productId: string | null;
  quantity: number | null;
  destinationCity: string;
};
