import type { Copy } from "@/data/translations";

export function TrustList({ copy }: { copy: Copy }) {
  const icons = ["✓", "↔", "◎"];
  return <div className="trust-list">{copy.trust.map((item, index) => <div key={item}><span aria-hidden="true">{icons[index]}</span><p>{item}</p></div>)}</div>;
}
