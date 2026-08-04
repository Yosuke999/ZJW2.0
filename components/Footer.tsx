import Link from "next/link";
import { getLanguageRoute, languageLabels } from "@/data/countries";
import type { CountryConfig } from "@/data/countries";
import type { Copy } from "@/data/translations";
import type { Language } from "@/data/types";

export function Footer({ country, language, copy, source }: { country: CountryConfig; language: Language; copy: Copy; source?: string }) {
  const languages: Language[] = ["ky", "uz", "ru", "zh"];
  const linkFor = (next: Language) => {
    const path = getLanguageRoute(country.code, next);
    return source ? `${path}?src=${encodeURIComponent(source)}` : path;
  };
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div><div className="brand footer-brand"><span className="brand-mark" aria-hidden="true">CA</span><span>{copy.brandName}</span></div><p>{country.name[language]} · {copy.demoContact}</p><p>{country.contact.phone}</p></div>
        <nav><a href="#pricing">{copy.footerPriceNote}</a><a href="#privacy">{copy.privacy}</a></nav>
        <nav>{languages.map((item) => <Link key={item} href={linkFor(item)}>{languageLabels[item]}</Link>)}</nav>
      </div>
      <div className="shell footer-bottom"><span>© 2026 {copy.brandName}</span><span>{copy.demoData}</span></div>
    </footer>
  );
}
