"use client";

import { useCallback, useEffect, useState } from "react";
import { countries } from "@/data/countries";
import { heroProducts } from "@/data/products";
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

export function PortalPage({ countryCode, language, source }: { countryCode: CountryCode; language: Language; source?: string }) {
  const [resolvedSource, setResolvedSource] = useState(source);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(heroProducts[0].id);
  const country = countries[countryCode];
  const copy = translations[language];
  const openContact = (origin: string) => {
    trackEvent("consult_click", { country: countryCode, language, origin });
    setContactOpen(true);
  };
  const handleHeroProductChange = useCallback((productId: string) => {
    setSelectedProductId(productId);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    if (!source) {
      const rawSource = new URLSearchParams(window.location.search).get("src");
      if (rawSource && /^[a-z0-9_-]{1,32}$/i.test(rawSource)) setResolvedSource(rawSource);
    }
  }, [language, source]);
  useEffect(() => {
    trackEvent("page_loaded", { country: countryCode, language, src: resolvedSource });
  }, [countryCode, language, resolvedSource]);
  return (
    <main>
      <Header country={country} language={language} copy={copy} source={resolvedSource} />
      <HeroCarousel country={countryCode} language={language} copy={copy} onActiveProductChange={handleHeroProductChange} />
      <ProductGrid country={countryCode} language={language} copy={copy} onConsult={(productId) => { setSelectedProductId(productId); openContact("product_detail"); }} />
      <section className="consult-section shell"><button className="primary-button" onClick={() => openContact("primary")}>{copy.consultOpportunity}</button><p>{copy.consultHelp}</p></section>
      <ServiceFlow copy={copy} />
      <Faq copy={copy} />
      <section className="final-cta"><div className="shell"><h2>{copy.finalTitle}</h2><button className="primary-button light" onClick={() => openContact("footer_cta")}>{copy.localAdvisor}</button></div></section>
      <div id="privacy" className="privacy-placeholder shell">{copy.privacy} · {copy.demoData}</div>
      <Footer country={country} language={language} copy={copy} source={resolvedSource} />
      <ContactSheet open={contactOpen} onClose={() => setContactOpen(false)} country={country} language={language} copy={copy} productId={selectedProductId} />
    </main>
  );
}
