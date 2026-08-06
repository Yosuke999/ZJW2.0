export function resolveRoute(rawCountry, locale = []) {
  if (rawCountry !== "kg" && rawCountry !== "uz") return null;
  const defaultLanguage = rawCountry === "kg" ? "ky" : "uz";
  const requested = locale[0];
  const allowed = [defaultLanguage, "ru", "zh", "en"];
  if (locale.length > 1 || (requested && !allowed.includes(requested))) return null;
  return { country: rawCountry, language: requested ?? defaultLanguage };
}
