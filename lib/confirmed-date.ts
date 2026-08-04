import type { Language } from "@/data/types";

const DISPLAY_TIME_ZONE = "Asia/Shanghai";

export function formatConfirmedDate(label: string, language: Language, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const value = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const date = language === "zh" ? `${year}.${month}.${day}` : `${day}.${month}.${year}`;
  return `${label}${language === "zh" ? "：" : ": "}${date}`;
}
