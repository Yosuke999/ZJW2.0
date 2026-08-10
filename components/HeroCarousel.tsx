"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTransitionGate, getCarouselWindow, getTrackRole, getTrackShift } from "@/data/carousel.mjs";
import { formatPrice, getPrice } from "@/data/prices";
import { heroProducts } from "@/data/products";
import type { Copy } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";
import { formatConfirmedDate } from "@/lib/confirmed-date";
import { PriceTrack } from "./PriceTrack";

const TRANSITION_MS = 420;
const SWIPE_THRESHOLD = 42;

type ChangeReason = "initial" | "manual";

export function HeroCarousel({ country, language, copy, onActiveProductChange }: { country: CountryCode; language: Language; copy: Copy; onActiveProductChange: (productId: string, reason: ChangeReason) => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1 | null>(null);
  const [resetting, setResetting] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetFrame = useRef<number | null>(null);
  const gate = useRef(createTransitionGate());
  const product = heroProducts[index];
  const price = getPrice(country, product.id);
  const productWindow = useMemo(() => getCarouselWindow(heroProducts, index), [index]);
  const localPriceWindow = useMemo(() => getCarouselWindow(heroProducts, index, true), [index]);
  const productShift = direction ? getTrackShift(direction, "product") : 0;

  const finishMove = useCallback((delta: 1 | -1) => {
    const nextIndex = (index + delta + heroProducts.length) % heroProducts.length;
    const nextProduct = heroProducts[nextIndex];
    setIndex(nextIndex);
    setDirection(null);
    setResetting(true);
    onActiveProductChange(nextProduct.id, "manual");
    resetFrame.current = requestAnimationFrame(() => {
      resetFrame.current = requestAnimationFrame(() => {
        setResetting(false);
        gate.current.unlock();
      });
    });
  }, [index, onActiveProductChange]);

  const move = useCallback((delta: 1 | -1) => {
    if (!gate.current.tryLock()) return;
    setDirection(delta);
    trackEvent("carousel_manual", { country, language, direction: delta });
    transitionTimer.current = setTimeout(() => finishMove(delta), TRANSITION_MS);
  }, [country, finishMove, language]);

  useEffect(() => {
    onActiveProductChange(heroProducts[0].id, "initial");
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      if (resetFrame.current !== null) cancelAnimationFrame(resetFrame.current);
    };
  }, [onActiveProductChange]);

  useEffect(() => {
    trackEvent("hero_product_impression", { country, language, productId: product.id });
  }, [country, language, product.id]);

  const liveSummary = `${product.name[language]}. ${copy.localPrice}: ${formatPrice(price.localRetailPrice, price.currency, language)}. ${copy.chinaPrice}: ${formatPrice(price.chinaReferencePrice, price.currency, language)}.`;
  const confirmedDate = formatConfirmedDate(copy.confirmedDate, language);

  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" tabIndex={-1}>{copy.heroTitle}</h1>
        <p>{copy.heroSubtitle}</p>
      </div>
      <div
        className={`product-showcase ${direction ? "is-moving" : ""} ${resetting ? "is-resetting" : ""}`}
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
        <div className="product-track track-viewport">
          <div className="track-strip product-strip" data-shift={productShift} data-track="product">
            {productWindow.map((item, slot) => (
              <div className={`track-item stage-item ${getTrackRole(slot, productShift)}`} key={item.id} data-product-id={item.id}>
                <span className="product-visual"><img src={item.image} alt={slot === 2 ? item.name[language] : ""} width={600} height={600} /></span>
              </div>
            ))}
          </div>
        </div>
        <div className="current-product-info" data-product-id={product.id}>
          <strong>{product.name[language]}</strong>
          <span>{product.specification[language]}</span>
        </div>
        <PriceTrack label={copy.localPrice} products={localPriceWindow} country={country} language={language} tone="local" direction={direction} />
        <PriceTrack label={copy.chinaPrice} products={productWindow} country={country} language={language} tone="china" direction={direction} />
        <div className="showcase-controls" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>
          <button type="button" className="hero-carousel-arrow" onClick={() => move(-1)} disabled={Boolean(direction)} aria-label={copy.previous}><span aria-hidden="true">‹</span></button>
          <span className="carousel-progress" aria-hidden="true">{index + 1} / {heroProducts.length}</span>
          <button type="button" className="hero-carousel-arrow" onClick={() => move(1)} disabled={Boolean(direction)} aria-label={copy.next}><span aria-hidden="true">›</span></button>
        </div>
        <p className="hero-price-disclaimer">{copy.priceDisclaimer}</p>
      </div>
      <p className="confirmation-note">{confirmedDate}</p>
      <div className="hero-cost-strip" aria-label={copy.priceNoteTitle}>
        <div className="cost-strip-copy">
          <span>{copy.priceNoteTitle}</span>
          <strong>{copy.landedCostParts.join(" + ")} = {copy.landedCostResult}</strong>
          <p>{copy.priceDisclaimer} · {copy.differenceDisclaimer}</p>
        </div>
      </div>
    </section>
  );
}
