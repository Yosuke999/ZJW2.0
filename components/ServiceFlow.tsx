import type { Copy } from "@/data/translations";

export function ServiceFlow({ copy, onContact }: { copy: Copy; onContact: () => void }) {
  return (
    <section className="service-section shell" aria-labelledby="service-title">
      <div className="section-heading"><div><span className="eyebrow">01—05</span><h2 id="service-title">{copy.serviceTitle}</h2></div></div>
      <ol className="service-flow">{copy.serviceSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
      <button className="secondary-button" onClick={onContact}>{copy.serviceCta}</button>
    </section>
  );
}
