"use client";

import { useCallback, useEffect, useState } from "react";
import { countries } from "@/data/countries";
import { translations } from "@/data/translations";
import type { CountryCode, Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";
import { Header } from "./Header";
import { HeroCarousel } from "./HeroCarousel";
import { ProductGrid } from "./ProductGrid";
import { ContactSheet } from "./ContactSheet";
import { ServiceFlow } from "./ServiceFlow";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { AiChat } from "./AiChat";

export function PortalPage({ countryCode, language, source, initialIntent, initialProductId }: { countryCode: CountryCode; language: Language; source?: string; initialIntent?: string; initialProductId?: string }) {
  const [contactOpen, setContactOpen] = useState(initialIntent === "purchase" || initialIntent === "callback");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProductId ?? null);
  const country = countries[countryCode];
  const copy = translations[language];
  const openContact = (origin: string, productId: string | null = null) => {
    setSelectedProductId(productId);
    trackEvent("consult_click", { country: countryCode, language, origin, productId });
    setContactOpen(true);
  };
  const handleHeroProductChange = useCallback(() => {}, []);
  useEffect(() => {
    trackEvent("page_loaded", { country: countryCode, language, src: source });
  }, [countryCode, language, source]);
  return (
    <main className="portal-page">
      <Header country={country} language={language} copy={copy} source={source} />
      <button
        type="button"
        className="opportunity-dock"
        onClick={() => openContact("fixed_opportunity")}
        aria-label={copy.consultOpportunity}
      >
        <span aria-hidden="true">◆</span>
        <strong>{copy.floatingConsult}</strong>
      </button>
      <HeroCarousel country={countryCode} language={language} copy={copy} onActiveProductChange={handleHeroProductChange} />
      <ProductGrid country={countryCode} language={language} copy={copy} onConsult={(productId) => openContact("product_detail", productId)} />
      <section className="consult-section shell"><button className="primary-button" onClick={() => openContact("primary")}>{copy.consultOpportunity}</button><p>{copy.consultHelp}</p></section>
      <ServiceFlow copy={copy} />
      <Faq copy={copy} />
      <section className="final-cta"><div className="shell"><h2>{copy.finalTitle}</h2><button className="primary-button light" onClick={() => openContact("footer_cta")}>{copy.localAdvisor}</button></div></section>
      <div id="privacy" className="privacy-placeholder shell">{copy.privacy} · {copy.demoData}</div>
      <Footer country={country} language={language} copy={copy} source={source} />
      <ContactSheet open={contactOpen} onClose={() => setContactOpen(false)} country={country} language={language} copy={copy} productId={selectedProductId} source={source} />
      <AiChat country={countryCode} language={language} />
    </main>
  );
}
