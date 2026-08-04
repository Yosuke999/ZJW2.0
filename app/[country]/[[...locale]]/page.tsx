import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { PortalPage } from "@/components/PortalPage";
import { translations } from "@/data/translations";
import { resolveRoute } from "@/data/routes.mjs";
import type { CountryCode, Language } from "@/data/types";

type RouteParams = Promise<{ country: string; locale?: string[] }>;

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { country: rawCountry, locale } = await params;
  const route = resolveRoute(rawCountry, locale);
  if (!route) return {};
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  const copy = translations[route.language as Language];
  return {
    title: `${copy.heroTitle}｜${copy.brandName}`,
    description: copy.heroSubtitle,
    openGraph: { title: `${copy.heroTitle}｜${copy.brandName}`, description: copy.heroSubtitle, images: [{ url: imageUrl, width: 1732, height: 910, alt: `${copy.brandName} · ${copy.heroTitle}` }] },
    twitter: { card: "summary_large_image", title: copy.heroTitle, description: copy.heroSubtitle, images: [imageUrl] },
  };
}

export default async function CountryPage({ params, searchParams }: { params: RouteParams; searchParams: Promise<{ src?: string; intent?: string; product?: string }> }) {
  const { country: rawCountry, locale } = await params;
  const route = resolveRoute(rawCountry, locale);
  if (!route) notFound();
  const query = await searchParams;
  const rawSource = query.src;
  const source = rawSource && /^[a-z0-9_-]{1,32}$/i.test(rawSource) ? rawSource : undefined;
  const initialIntent = query.intent === "purchase" || query.intent === "callback" ? query.intent : undefined;
  const initialProductId = query.product && /^[a-z0-9-]{1,80}$/.test(query.product) ? query.product : undefined;
  return <PortalPage countryCode={route.country as CountryCode} language={route.language as Language} source={source} initialIntent={initialIntent} initialProductId={initialProductId} />;
}
