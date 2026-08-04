import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中亚商机网｜日常商品采购机会",
  description: "面向吉尔吉斯斯坦与乌兹别克斯坦小生意经营者的演示商品价格与采购交付协助入口。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = "zh";
  const assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const backgroundImages = {
    "--hero-background-image": `url("${assetPrefix}/hero/central-asia-commerce-white-v1.webp")`,
    "--products-background-image": `url("${assetPrefix}/hero/popular-products-market-bg.png")`,
  } as React.CSSProperties;
  return <html lang={language}><body style={backgroundImages}>{children}</body></html>;
}
