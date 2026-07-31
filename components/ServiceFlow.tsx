import type { Copy } from "@/data/translations";

const stepIcons = ["⌕", "✓", "◇", "↗", "◎"];

export function ServiceFlow({ copy, onContact }: { copy: Copy; onContact: () => void }) {
  return (
    <section className="service-section shell" aria-labelledby="service-title">
      <div className="section-heading"><div><span className="eyebrow">01—05</span><h2 id="service-title">{copy.serviceTitle}</h2></div></div>
      <div className="service-phases">
        {copy.servicePhases.map((phase, phaseIndex) => {
          const phaseStart = copy.servicePhases.slice(0, phaseIndex).reduce((total, item) => total + item.steps.length, 0);
          return (
            <div className={`service-phase phase-${phaseIndex + 1}`} key={phase.label}>
              <div className="service-phase-heading"><span aria-hidden="true">{phaseIndex === 0 ? "✓" : "↗"}</span><strong>{phase.label}</strong><small>{phase.range}</small></div>
              <ol>
                {phase.steps.map((step, index) => {
                  const stepIndex = phaseStart + index;
                  return (
                    <li className="service-card" key={step.title}>
                      <span className="service-number">{String(stepIndex + 1).padStart(2, "0")}</span>
                      <div className="service-card-title"><i aria-hidden="true">{stepIcons[stepIndex]}</i><strong>{step.title}</strong></div>
                      <p>{step.description}</p>
                      <span className="service-duration">◷ {step.duration}</span>
                      <div className="service-deliverable"><b aria-hidden="true">□</b><span>{step.deliverable}</span></div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
      <div className="service-mobile">
        {copy.servicePhases.map((phase, phaseIndex) => {
          const phaseStart = copy.servicePhases.slice(0, phaseIndex).reduce((total, item) => total + item.steps.length, 0);
          return (
            <div className={`mobile-service-phase phase-${phaseIndex + 1}`} key={phase.label}>
              <div className="mobile-phase-heading"><span aria-hidden="true">{phaseIndex === 0 ? "✓" : "↗"}</span><strong>{phase.label}</strong><small>· {phase.range}</small></div>
              <div className="mobile-service-timeline">
                {phase.steps.map((step, index) => {
                  const stepIndex = phaseStart + index;
                  return (
                    <details key={step.title} open={stepIndex === 0}>
                      <summary>
                        <span className="service-number">{String(stepIndex + 1).padStart(2, "0")}</span>
                        <span className="mobile-step-copy"><strong>{step.title}</strong><small>{step.description}</small></span>
                        <span className="service-duration">◷ {step.duration}</span>
                        <span className="mobile-chevron" aria-hidden="true">⌄</span>
                      </summary>
                      <div className="service-deliverable"><b aria-hidden="true">□</b><span>{step.deliverable}</span></div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <button className="secondary-button service-cta" onClick={onContact}>{copy.serviceCta}</button>
    </section>
  );
}
