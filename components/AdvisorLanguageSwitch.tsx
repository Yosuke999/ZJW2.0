"use client";

import Link from "next/link";
import { useState } from "react";
import { languageLabels } from "@/data/countries";
import type { Language } from "@/data/types";

const languages: Language[] = ["zh", "ru", "ky", "uz", "en"];

export function AdvisorLanguageSwitch({ language, ariaLabel }: { language: Language; ariaLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <details className="advisor-language-switch" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary aria-label={ariaLabel}>
        <span>{languageLabels[language]}</span>
        <span className="language-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="advisor-language-popover">
        {languages.map((item) => (
          <Link
            key={item}
            className={item === language ? "active" : ""}
            href={`/advisor?language=${item}`}
            onClick={() => setOpen(false)}
          >
            {languageLabels[item]}
          </Link>
        ))}
      </div>
    </details>
  );
}
