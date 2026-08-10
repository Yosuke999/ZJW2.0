"use client";

import Link from "next/link";
import { useRef } from "react";
import { getLanguageRoute, languageCountry, languageLabels } from "@/data/countries";
import type { CountryConfig } from "@/data/countries";
import type { Language } from "@/data/types";
import type { Copy } from "@/data/translations";
import { trackEvent } from "@/lib/analytics";
import { AccountNav } from "@/components/AccountNav";

export function Header({ country, language, copy, source }: { country: CountryConfig; language: Language; copy: Copy; source?: string }) {
  const languageMenuRef = useRef<HTMLDetailsElement>(null);
  const languages: Language[] = ["ky", "uz", "ru", "zh", "en"];
  const linkFor = (next: Language) => {
    const path = getLanguageRoute(country.code, next);
    return source ? `${path}?src=${encodeURIComponent(source)}` : path;
  };

  return (
    <header className="site-header shell">
      <Link className="brand" href={source ? `/${country.code}?src=${encodeURIComponent(source)}` : `/${country.code}`} aria-label={copy.brandName}>
        <span className="brand-mark" aria-hidden="true">CA</span>
        <span>{copy.brandName}</span>
      </Link>
      <div className="header-actions"><AccountNav country={country.code} language={language} /><details ref={languageMenuRef} className="language-menu">
        <summary aria-label={copy.language}>
          <span>{languageLabels[language]}</span>
          <span className="language-chevron" aria-hidden="true">▾</span>
        </summary>
        <div className="language-popover">
          {languages.map((item) => (
            <Link
              key={item}
              className={item === language ? "active" : ""}
              href={linkFor(item)}
              onClick={() => {
                if (languageMenuRef.current) languageMenuRef.current.open = false;
                trackEvent("language_switch", { country: country.code, targetCountry: languageCountry[item] ?? country.code, from: language, to: item });
              }}
            >
              {languageLabels[item]}
            </Link>
          ))}
        </div>
      </details></div>
    </header>
  );
}
