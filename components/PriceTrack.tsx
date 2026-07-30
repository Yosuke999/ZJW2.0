import { formatPrice, getPrice } from "@/data/prices";
import { getTrackShift } from "@/data/carousel.mjs";
import type { CountryCode, Product } from "@/data/types";

export function PriceTrack({ label, products, country, tone, direction }: { label: string; products: Product[]; country: CountryCode; tone: "local" | "china"; direction: 1 | -1 | null }) {
  const shift = direction ? getTrackShift(direction, tone) : 0;

  return (
    <div className={`price-track ${tone}`}>
      <span className="track-label">{label}</span>
      <div className="track-viewport">
        <div className="track-strip price-strip" data-shift={shift} data-track={tone}>
          {products.map((product, slot) => {
            const price = getPrice(country, product.id);
            const value = tone === "local" ? price.localRetailPrice : price.chinaReferencePrice;
            return (
              <span className={`track-item price-item ${slot === 2 ? "current" : "side"}`} key={`${tone}-${product.id}`} data-product-id={product.id}>
                {formatPrice(value, price.currency)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
