type EventPayload = Record<string, string | number | boolean | null | undefined>;

const sessionId = `session-${Math.random().toString(36).slice(2, 10)}`;

export function trackEvent(name: string, payload: EventPayload = {}) {
  if (process.env.NODE_ENV === "development") {
    console.debug("[anonymous-event]", { name, sessionId, ...payload });
  }
}
