type EventPayload = Record<string, string | number | boolean | null | undefined>;

const eventNames: Record<string, string> = {
  page_loaded: "page_view",
  product_detail_open: "product_view",
  consult_click: "consult_open",
  registration_completed: "registration",
  inquiry_submitted: "inquiry_submit",
};

function randomId(prefix: string) {
  const value = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${value}`;
}

function storedId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = randomId(prefix);
  storage.setItem(key, value);
  return value;
}

export function trackEvent(name: string, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  const eventName = eventNames[name];
  if (!eventName) return;
  try {
    const visitorId = storedId(window.localStorage, "ca-analytics-visitor", "visitor");
    const sessionId = storedId(window.sessionStorage, "ca-analytics-session", "session");
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        sessionId,
        eventName,
        productLegacyId: typeof payload.productId === "string" ? payload.productId : undefined,
        marketCode: payload.country,
        language: payload.language,
        source: payload.src ?? payload.source,
        path: window.location.pathname,
      }),
    }).catch(() => undefined);
  } catch {
    // Analytics must never block the customer flow.
  }
}
