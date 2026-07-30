"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatPrice, getPrice } from "@/data/prices";
import { heroProducts } from "@/data/products";
import type { Copy } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";
import { PriceTrack } from "./PriceTrack";

const TRANSITION_MS = 300;
const SWIPE_THRESHOLD = 42;

type ChangeReason = "initial" | "manual";

export function HeroCarousel({ country, language, copy, onActiveProductChange }: { country: CountryCode; language: Language; copy: Copy; onActiveProductChange: (productId: string, reason: ChangeReason) => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1 | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const product = heroProducts[index];
  const price = getPrice(country, product.id);
  const previous = heroProducts[(index - 1 + heroProducts.length) % heroProducts.length];
  const next = heroProducts[(index + 1) % heroProducts.length];

  const move = useCallback((delta: 1 | -1) => {
    if (direction) return;
    const nextIndex = (index + delta + heroProducts.length) % heroProducts.length;
    const nextProduct = heroProducts[nextIndex];
    setDirection(delta);
    setIndex(nextIndex);
    onActiveProductChange(nextProduct.id, "manual");
    trackEvent("carousel_manual", { country, language, direction: delta, productId: nextProduct.id });
    transitionTimer.current = setTimeout(() => setDirection(null), TRANSITION_MS);
  }, [country, direction, index, language, onActiveProductChange]);

  useEffect(() => {
    onActiveProductChange(heroProducts[0].id, "initial");
    return () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); };
  }, [onActiveProductChange]);

  useEffect(() => {
    trackEvent("hero_product_impression", { country, language, productId: product.id });
  }, [country, language, product.id]);

  const liveSummary = `${product.name[language]}. ${copy.localPrice}: ${formatPrice(price.localRetailPrice, price.currency)}. ${copy.chinaPrice}: ${formatPrice(price.chinaReferencePrice, price.currency)}.`;

  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="eyebrow">{copy.demoData}</span>
        <h1 id="hero-title" tabIndex={-1}>{copy.heroTitle}</h1>
        <p>{copy.heroSubtitle}</p>
      </div>
      <div
        className="product-showcase"
        tabIndex={0}
        aria-label={copy.popularTitle}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        }}
        onPointerDown={(event) => {
          dragStart.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          if (!dragStart.current) return;
          const distanceX = event.clientX - dragStart.current.x;
          const distanceY = event.clientY - dragStart.current.y;
          dragStart.current = null;
          if (Math.abs(distanceX) > SWIPE_THRESHOLD && Math.abs(distanceX) > Math.abs(distanceY)) move(distanceX < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { dragStart.current = null; }}
      >
        <p className="sr-only" aria-live="polite">{liveSummary}</p>
        <button className="desktop-preview previous-preview" onClick={() => move(-1)} disabled={Boolean(direction)} aria-label={`${copy.previous}: ${previous.name[language]}`}>
          <Image src={previous.image} alt="" width={180} height={180} />
        </button>
        <div className={`showcase-content ${direction === 1 ? "slide-next" : direction === -1 ? "slide-previous" : ""}`} data-product-id={product.id}>
          <div className="hero-image-frame">
            <Image src={product.image} alt={product.name[language]} width={600} height={600} priority={index === 0} />
          </div>
          <div className="hero-product-info">
            <strong>{product.name[language]}</strong>
            <span>{product.specification[language]}</span>
          </div>
          <div className="price-comparison" data-product-id={product.id}>
            <PriceTrack label={copy.localPrice} product={product} country={country} tone="local" />
            <PriceTrack label={copy.chinaPrice} product={product} country={country} tone="china" />
          </div>
        </div>
        <button className="desktop-preview next-preview" onClick={() => move(1)} disabled={Boolean(direction)} aria-label={`${copy.next}: ${next.name[language]}`}>
          <Image src={next.image} alt="" width={180} height={180} />
        </button>
        <div className="showcase-controls">
          <button className="carousel-arrow" onClick={() => move(-1)} disabled={Boolean(direction)} aria-label={copy.previous}>‹</button>
          <span className="carousel-progress" aria-hidden="true">{index + 1} / {heroProducts.length}</span>
          <button className="carousel-arrow" onClick={() => move(1)} disabled={Boolean(direction)} aria-label={copy.next}>›</button>
        </div>
        <p className="hero-price-disclaimer">{copy.priceDisclaimer}</p>
      </div>
      <p className="confirmation-note">{copy.confirmedDate}</p>
    </section>
  );
}
