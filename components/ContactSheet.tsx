"use client";

import { useEffect, useRef } from "react";
import type { CountryConfig } from "@/data/countries";
import { products } from "@/data/products";
import type { Copy } from "@/data/translations";
import type { Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";
import { intentTranslations } from "@/data/intent-translations";
import { IntentActions } from "./IntentActions";

export function ContactSheet({ open, onClose, country, language, copy, productId, source }: { open: boolean; onClose: () => void; country: CountryConfig; language: Language; copy: Copy; productId: string | null; source?: string }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const product = productId ? products.find((item) => item.id === productId) ?? null : null;
  const serviceCountryLabel = language === "zh" ? "中国" : language === "ru" ? null : country.name[language];
  const message = product
    ? `${copy.contactProduct}: ${product.name[language]} (${product.id}). ${copy.contactCountry}: ${country.name[language]}.`
    : `${copy.contactCountry}: ${country.name[language]}.`;
  const context = encodeURIComponent(message);
  const channels = [
    { name: "WhatsApp", mark: "WA", detail: country.contact.phone, href: `${country.contact.whatsappUrl}?text=${context}` },
    { name: "Telegram", mark: "TG", detail: `@${country.contact.telegramHandle}`, href: country.contact.telegramUrl },
    { name: "Phone", mark: "TEL", detail: country.contact.phone, href: `tel:${country.contact.phone.replace(/\s/g, "")}` },
  ];
  const intentCopy = intentTranslations[language];
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={sheetRef} className="contact-sheet" role="dialog" aria-modal="true" aria-labelledby="contact-title">
        <div className="sheet-handle" />
        <button ref={closeRef} className="close-button" onClick={onClose} aria-label={copy.close}><span aria-hidden="true">×</span></button>
        <header className="contact-heading">
          {serviceCountryLabel && <span className="eyebrow">{copy.contactCountry} · {serviceCountryLabel}</span>}
          <h2 id="contact-title">{copy.contactTitle}</h2>
          {product && <p className="country-name">{product.name[language]}</p>}
        </header>
        <div className="contact-layout">
          <section className="contact-outcomes" aria-labelledby="contact-outcomes-title">
            <h3 id="contact-outcomes-title">{copy.contactOutcomesTitle}</h3>
            <ol>
              {copy.contactOutcomes.map((outcome, index) => (
                <li key={outcome}><span aria-hidden="true">{index + 1}</span><p>{outcome}</p></li>
              ))}
            </ol>
          </section>
          <div className="contact-action-panel">
            <IntentActions country={country.code} language={language} productId={productId} source={source} />
            <h3 className="external-contact-title">{intentCopy.externalContact}</h3>
            <div className="contact-options">
              {channels.map((channel) => (
                <a key={channel.name} data-channel={channel.name.toLowerCase()} href={channel.href} target={channel.name === "Phone" ? undefined : "_blank"} rel="noreferrer" onClick={() => trackEvent("contact_channel_select", { country: country.code, language, channel: channel.name, productId })}>
                  <span className="channel-mark" aria-hidden="true">{channel.mark}</span>
                  <span className="contact-choice-copy"><strong>{channel.name}</strong><small>{channel.detail}</small></span>
                  <span className="contact-arrow" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
            <p className="contact-note">{copy.contactNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
