"use client";

import { useState } from "react";
import Image from "next/image";
import { products } from "@/data/products";
import { getPrice, formatPrice } from "@/data/prices";
import type { Copy } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";

export function ProductGrid({ country, language, copy, selectedProductId, onSelect }: { country: CountryCode; language: Language; copy: Copy; selectedProductId: string; onSelect: (productId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? products.slice(5) : products.slice(5, 13);
  return (
    <section className="products-section shell" aria-labelledby="products-title">
      <div className="section-heading">
        <div><span className="eyebrow">{copy.demoData}</span><h2 id="products-title">{copy.popularTitle}</h2></div>
        <p>{copy.confirmedDate}</p>
      </div>
      <div className="product-grid">
        {items.map((product) => {
          const price = getPrice(country, product.id);
          const selected = selectedProductId === product.id;
          return (
            <button className={`product-card ${selected ? "is-selected" : ""}`} key={product.id} onClick={() => { trackEvent("product_select", { country, language, productId: product.id }); onSelect(product.id); }} aria-pressed={selected} aria-label={product.name[language]}>
              <span className="card-visual"><Image src={product.image} alt={product.name[language]} width={480} height={480} /></span>
              <span className="tag">{selected ? copy.selectedProduct : copy.popularTag}</span>
              <strong>{product.name[language]}</strong>
              <small>{product.specification[language]}</small>
              <span className="card-price local"><em>{copy.localPrice}</em>{formatPrice(price.localRetailPrice, price.currency)}</span>
              <span className="card-price china"><em>{copy.chinaPrice}</em>{formatPrice(price.chinaReferencePrice, price.currency)}</span>
            </button>
          );
        })}
      </div>
      <p className="selection-hint" aria-live="polite">{products.some((item) => item.id === selectedProductId && !heroProductsIds.has(item.id)) ? copy.selectedProduct : ""}</p>
      <button className="secondary-button expand-button" onClick={() => { setExpanded((value) => !value); trackEvent("expand_products", { expanded: !expanded, country, language }); }}>
        {expanded ? copy.showLess : copy.showMore}
      </button>
    </section>
  );
}

const heroProductsIds = new Set(products.slice(0, 5).map((product) => product.id));
