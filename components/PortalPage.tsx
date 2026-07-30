"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { countries } from "@/data/countries";
import { heroProducts } from "@/data/products";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";
import { Header } from "./Header";
import { HeroCarousel } from "./HeroCarousel";
import { ProductGrid } from "./ProductGrid";
import { TrustList } from "./TrustList";
import { ContactSheet } from "./ContactSheet";
import { ServiceFlow } from "./ServiceFlow";
import { Faq } from "./Faq";
import { Footer } from "./Footer";

export function PortalPage({ countryCode, language, source }: { countryCode: CountryCode; language: Language; source?: string }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(heroProducts[0].id);
  const productCardSelection = useRef(false);
  const country = countries[countryCode];
  const copy = translations[language];
  const openContact = (origin: string) => {
    trackEvent("consult_click", { country: countryCode, language, origin });
    setContactOpen(true);
  };
  const handleHeroProductChange = useCallback((productId: string, reason: "initial" | "manual") => {
    if (reason === "manual") productCardSelection.current = false;
    if (!productCardSelection.current) setSelectedProductId(productId);
  }, []);
  useEffect(() => {
    trackEvent("page_loaded", { country: countryCode, language, src: source });
  }, [countryCode, language, source]);
  return (
    <main>
      <Header country={country} language={language} copy={copy} source={source} />
      <HeroCarousel country={countryCode} language={language} copy={copy} onActiveProductChange={handleHeroProductChange} />
      <ProductGrid country={countryCode} language={language} copy={copy} selectedProductId={selectedProductId} onSelect={(productId) => { productCardSelection.current = true; setSelectedProductId(productId); }} />
      <section id="pricing" className="pricing-section shell">
        <div className="price-note"><span className="eyebrow">{copy.confirmedDate}</span><h2>{copy.priceNoteTitle}</h2><p>{copy.priceNote}</p></div>
        <TrustList copy={copy} />
      </section>
      <section className="consult-section shell"><button className="primary-button" onClick={() => openContact("primary")}>{copy.consultOpportunity}</button><p>{copy.consultHelp}</p></section>
      <ServiceFlow copy={copy} onContact={() => openContact("service_flow")} />
      <Faq copy={copy} />
      <section className="final-cta"><div className="shell"><h2>{copy.finalTitle}</h2><button className="primary-button light" onClick={() => openContact("footer_cta")}>{copy.localAdvisor}</button></div></section>
      <div id="privacy" className="privacy-placeholder shell">{copy.privacy} · {copy.demoData}</div>
      <Footer country={country} language={language} copy={copy} source={source} />
      <ContactSheet open={contactOpen} onClose={() => setContactOpen(false)} country={country} language={language} copy={copy} productId={selectedProductId} />
    </main>
  );
}
