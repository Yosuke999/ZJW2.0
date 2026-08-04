import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PortalPage } from "@/components/PortalPage";
import { translations } from "@/data/translations";
import { resolveRoute } from "@/data/routes.mjs";
import type { CountryCode, Language } from "@/data/types";

type RouteParams = Promise<{ country: string; locale?: string[] }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { country: "kg", locale: [] },
    { country: "kg", locale: ["ru"] },
    { country: "kg", locale: ["zh"] },
    { country: "uz", locale: [] },
    { country: "uz", locale: ["ru"] },
    { country: "uz", locale: ["zh"] },
  ];
}

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { country: rawCountry, locale } = await params;
  const route = resolveRoute(rawCountry, locale);
  if (!route) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const imageUrl = `${siteUrl}${assetPrefix}/og.png`;
  const copy = translations[route.language as Language];
  return {
    title: `${copy.heroTitle}｜${copy.brandName}`,
    description: copy.heroSubtitle,
    openGraph: { title: `${copy.heroTitle}｜${copy.brandName}`, description: copy.heroSubtitle, images: [{ url: imageUrl, width: 1732, height: 910, alt: `${copy.brandName} · ${copy.heroTitle}` }] },
    twitter: { card: "summary_large_image", title: copy.heroTitle, description: copy.heroSubtitle, images: [imageUrl] },
  };
}

export default async function CountryPage({ params }: { params: RouteParams }) {
  const { country: rawCountry, locale } = await params;
  const route = resolveRoute(rawCountry, locale);
  if (!route) notFound();
  return <PortalPage countryCode={route.country as CountryCode} language={route.language as Language} />;
}
