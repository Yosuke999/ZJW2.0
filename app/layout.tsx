import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "中亚商机网｜日常商品采购机会",
  description: "面向吉尔吉斯斯坦与乌兹别克斯坦小生意经营者的演示商品价格与采购交付协助入口。",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = (await headers()).get("x-page-language") ?? "zh";
  return <html lang={language}><body>{children}</body></html>;
}
