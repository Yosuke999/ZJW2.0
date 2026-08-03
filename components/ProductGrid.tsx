"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { products } from "@/data/products";
import { getPrice, formatPrice } from "@/data/prices";
import type { Copy } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";

type ProductFilter = "all" | "electronics" | "home" | "personal" | "daily";

const productFilters: ProductFilter[] = ["all", "electronics", "home", "personal", "daily"];

const categoryGroups: Record<Exclude<ProductFilter, "all">, string[]> = {
  electronics: ["electronics", "lighting", "auto"],
  home: ["kitchen", "home"],
  personal: ["personal-care"],
  daily: ["toys", "bags", "tools"],
};

const belongsToFilter = (category: string, filter: ProductFilter) => (
  filter === "all" || categoryGroups[filter].includes(category)
);

export function ProductGrid({ country, language, copy, onConsult }: { country: CountryCode; language: Language; copy: Copy; onConsult: (productId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>("all");
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const catalogProducts = products.slice(5);
  const filteredProducts = catalogProducts.filter((product) => belongsToFilter(product.category, activeFilter));
  const items = activeFilter === "all" && !expanded ? filteredProducts.slice(0, 8) : filteredProducts;
  const detailProduct = products.find((product) => product.id === detailProductId) ?? null;
  const filterCount = (filter: ProductFilter) => catalogProducts.filter((product) => belongsToFilter(product.category, filter)).length;

  const closeDetails = useCallback(() => {
    setDetailProductId(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!detailProduct) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetails();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDetails, detailProduct]);

  return (
    <section className="products-section shell" aria-labelledby="products-title">
      <div className="section-heading">
        <div><span className="eyebrow">{copy.demoData}</span><h2 id="products-title">{copy.popularTitle}</h2></div>
        <p>{copy.confirmedDate}</p>
      </div>
      <div className="product-filter" aria-label={copy.popularTitle}>
        {productFilters.map((filter) => {
          const label = filter === "all" ? copy.productCategoryAll : copy.productCategoryLabels[filter];
          return (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "is-active" : ""}
              aria-pressed={activeFilter === filter}
              onClick={() => {
                setActiveFilter(filter);
                setExpanded(false);
                trackEvent("filter_products", { country, language, filter });
              }}
            >
              <span>{label}</span>
              <b>{filterCount(filter)}</b>
            </button>
          );
        })}
      </div>
      <div className="product-grid">
        {items.map((product) => {
          const price = getPrice(country, product.id);
          return (
            <button
              className="product-card"
              key={product.id}
              aria-haspopup="dialog"
              aria-label={`${copy.viewDetails}: ${product.name[language]}`}
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setDetailProductId(product.id);
                trackEvent("product_detail_open", { country, language, productId: product.id });
              }}
            >
              <span className="card-visual"><img src={product.image} alt={product.name[language]} width={480} height={480} loading="lazy" /></span>
              <span className="tag">{copy.popularTag}</span>
              <strong>{product.name[language]}</strong>
              <small>{product.specification[language]}</small>
              <span className="card-price local"><em>{copy.localPrice}</em>{formatPrice(price.localRetailPrice, price.currency)}</span>
              <span className="card-price china"><em>{copy.chinaPrice}</em>{formatPrice(price.chinaReferencePrice, price.currency)}</span>
              <span className="card-detail-hint">{copy.viewDetails}<b aria-hidden="true">→</b></span>
            </button>
          );
        })}
      </div>
      {activeFilter === "all" && (
        <button className="secondary-button expand-button" onClick={() => { setExpanded((value) => !value); trackEvent("expand_products", { expanded: !expanded, country, language }); }}>
          {expanded ? copy.showLess : copy.showMore}
        </button>
      )}

      {detailProduct && (() => {
        const price = getPrice(country, detailProduct.id);
        const difference = price.localRetailPrice - price.chinaReferencePrice;
        return (
          <div className="product-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
            <aside className="product-detail-panel" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
              <div className="product-detail-header">
                <span className="product-detail-eyebrow">{copy.productDetails}</span>
                <button ref={closeButtonRef} type="button" className="product-detail-close" onClick={closeDetails} aria-label={copy.close}><span aria-hidden="true">×</span></button>
              </div>
              <div className="product-detail-layout">
                <div className="product-detail-visual">
                  <span className="product-detail-image-frame">
                    <img src={detailProduct.image} alt={detailProduct.name[language]} width={600} height={600} />
                  </span>
                </div>
                <div className="product-detail-content">
                  <span className="tag">{copy.popularTag}</span>
                  <h3 id="product-detail-title">{detailProduct.name[language]}</h3>
                  <p className="product-detail-spec">{detailProduct.specification[language]}</p>
                  <div className="product-detail-prices">
                    <div><span>{copy.localPrice}</span><strong>{formatPrice(price.localRetailPrice, price.currency)}</strong></div>
                    <div><span>{copy.chinaPrice}</span><strong>{formatPrice(price.chinaReferencePrice, price.currency)}</strong></div>
                  </div>
                  <div className="product-detail-difference"><span>{copy.referenceDifference}</span><strong>{formatPrice(difference, price.currency)}</strong></div>
                  <div className="product-detail-cost-path" aria-label={`${copy.landedCostParts.join(" + ")} → ${copy.landedCostResult}`}>
                    <span>{copy.landedCostParts.join(" + ")}</span>
                    <strong>→ {copy.landedCostResult}</strong>
                  </div>
                  <p className="product-detail-note">{copy.differenceDisclaimer}<br />{copy.priceDisclaimer}</p>
                  <button type="button" className="primary-button product-detail-consult" onClick={() => { trackEvent("product_detail_consult", { country, language, productId: detailProduct.id }); closeDetails(); onConsult(detailProduct.id); }}>{copy.consultProduct}</button>
                </div>
              </div>
            </aside>
          </div>
        );
      })()}
    </section>
  );
}
