"use client";

import { useState } from "react";
import type { Copy } from "@/data/translations";
import { trackEvent } from "@/lib/analytics";

export function Faq({ copy }: { copy: Copy }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="faq-section shell" aria-labelledby="faq-title">
      <div className="section-heading"><div><span className="eyebrow">FAQ</span><h2 id="faq-title">{copy.faqTitle}</h2></div></div>
      <div className="faq-list">{copy.faqs.map((faq, index) => {
        const expanded = open === index;
        return <div className="faq-item" key={faq.question}><button aria-expanded={expanded} onClick={() => { setOpen(expanded ? null : index); if (!expanded) trackEvent("faq_open", { index }); }}><span>{faq.question}</span><b>{expanded ? "−" : "+"}</b></button>{expanded && <p>{faq.answer}</p>}</div>;
      })}</div>
    </section>
  );
}
