"use client";

import Link from "next/link";
import { languageLabels } from "@/data/countries";
import type { CountryConfig } from "@/data/countries";
import type { Language } from "@/data/types";
import type { Copy } from "@/data/translations";
import { trackEvent } from "@/lib/analytics";

export function Header({ country, language, copy, source }: { country: CountryConfig; language: Language; copy: Copy; source?: string }) {
  const languages: Language[] = [country.localLanguage, "ru", "zh"];
  const linkFor = (next: Language) => {
    const path = next === country.defaultLanguage ? `/${country.code}` : `/${country.code}/${next}`;
    return source ? `${path}?src=${encodeURIComponent(source)}` : path;
  };

  return (
    <header className="site-header shell">
      <Link className="brand" href={source ? `/${country.code}?src=${encodeURIComponent(source)}` : `/${country.code}`} aria-label={copy.brandName}>
        <span className="brand-mark" aria-hidden="true">CA</span>
        <span>{copy.brandName}</span>
      </Link>
      <details className="language-menu">
        <summary aria-label={copy.language}>
          <span>{languageLabels[language]}</span>
          {language !== "ru" && <span className="language-shortcut">Русский</span>}
        </summary>
        <div className="language-popover">
          {languages.map((item) => (
            <Link
              key={item}
              className={item === language ? "active" : ""}
              href={linkFor(item)}
              onClick={() => trackEvent("language_switch", { country: country.code, from: language, to: item })}
            >
              {languageLabels[item]}
            </Link>
          ))}
        </div>
      </details>
    </header>
  );
}
