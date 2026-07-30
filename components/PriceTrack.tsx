import { formatPrice, getPrice } from "@/data/prices";
import type { CountryCode, Product } from "@/data/types";

export function PriceTrack({ label, product, country, tone }: { label: string; product: Product; country: CountryCode; tone: "local" | "china" }) {
  const price = getPrice(country, product.id);
  const value = tone === "local" ? price.localRetailPrice : price.chinaReferencePrice;

  return (
    <div className={`price-card ${tone}`} data-product-id={product.id}>
      <span>{label}</span>
      <strong>{formatPrice(value, price.currency)}</strong>
    </div>
  );
}
