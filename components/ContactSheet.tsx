"use client";

import { useEffect, useRef } from "react";
import type { CountryConfig } from "@/data/countries";
import { products } from "@/data/products";
import type { Copy } from "@/data/translations";
import type { Language } from "@/data/types";
import { trackEvent } from "@/lib/analytics";

export function ContactSheet({ open, onClose, country, language, copy, productId }: { open: boolean; onClose: () => void; country: CountryConfig; language: Language; copy: Copy; productId: string }) {
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
  const product = products.find((item) => item.id === productId) ?? products[0];
  const message = `${copy.contactProduct}: ${product.name[language]} (${product.id}). ${copy.contactCountry}: ${country.name[language]}.`;
  const context = encodeURIComponent(message);
  const channels = [
    { name: "WhatsApp", href: `${country.contact.whatsappUrl}?text=${context}` },
    { name: "Telegram", href: country.contact.telegramUrl },
    { name: "Phone", href: `tel:${country.contact.phone.replace(/\s/g, "")}` },
  ];
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={sheetRef} className="contact-sheet" role="dialog" aria-modal="true" aria-labelledby="contact-title">
        <div className="sheet-handle" />
        <button ref={closeRef} className="close-button" onClick={onClose} aria-label={copy.close}>×</button>
        <span className="eyebrow">{copy.contactCountry}</span>
        <h2 id="contact-title">{copy.contactTitle}</h2>
        <p className="country-name">{country.name[language]} · {product.name[language]}</p>
        <div className="contact-options">
          {channels.map((channel) => (
            <a key={channel.name} href={channel.href} target={channel.name === "Phone" ? undefined : "_blank"} rel="noreferrer" onClick={() => trackEvent("contact_channel_select", { country: country.code, language, channel: channel.name, productId })}>
              <span className="channel-mark" aria-hidden="true">{channel.name.slice(0, 2)}</span>
              <span><strong>{channel.name}</strong><small>{copy.demoContact}</small></span>
            </a>
          ))}
        </div>
        <p className="contact-note">{copy.contactNote}</p>
      </div>
    </div>
  );
}
