import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { resolveRoute } from "../data/routes.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("resolves every supported country and preview route", () => {
  assert.deepEqual(resolveRoute("kg"), { country: "kg", language: "ky" });
  assert.deepEqual(resolveRoute("uz"), { country: "uz", language: "uz" });
  assert.deepEqual(resolveRoute("kg", ["ru"]), { country: "kg", language: "ru" });
  assert.deepEqual(resolveRoute("uz", ["ru"]), { country: "uz", language: "ru" });
  assert.deepEqual(resolveRoute("kg", ["zh"]), { country: "kg", language: "zh" });
  assert.deepEqual(resolveRoute("uz", ["zh"]), { country: "uz", language: "zh" });
  assert.equal(resolveRoute("kg", ["uz"]), null);
  assert.equal(resolveRoute("other"), null);
});

test("all 20 products have a real static image path", async () => {
  const products = await read("data/products.ts");
  const ids = [...products.matchAll(/^\s*\["([a-z0-9-]+)",/gm)].map((match) => match[1]);
  assert.equal(ids.length, 20);
  await Promise.all(ids.map((id) => access(new URL(`public/products/${id}.webp`, root))));
  assert.match(products, /imageStatus:\s*"placeholder"/);
});

test("both countries have 20 prices in their own currency", async () => {
  const prices = await read("data/prices.ts");
  for (const name of ["kgsLocal", "kgsChina", "uzsLocal", "uzsChina"]) {
    const values = prices.match(new RegExp(`const ${name} = \\[([^\\]]+)\\]`))?.[1].split(",");
    assert.equal(values?.length, 20, `${name} should have 20 entries`);
  }
  assert.match(prices, /kg:\s*buildPrices\("kg",\s*"KGS"/);
  assert.match(prices, /uz:\s*buildPrices\("uz",\s*"UZS"/);
});

test("localized brands are used by header, footer, metadata, and html lang", async () => {
  const [translations, header, footer, page, layout, proxy] = await Promise.all([
    read("data/translations.ts"), read("components/Header.tsx"), read("components/Footer.tsx"),
    read("app/[country]/[[...locale]]/page.tsx"), read("app/layout.tsx"), read("proxy.ts"),
  ]);
  for (const brand of [
    "中亚商机网",
    "Борбор Азия бизнес мүмкүнчүлүктөрү порталы",
    "Markaziy Osiyo biznes imkoniyatlari portali",
    "Портал бизнес-возможностей Центральной Азии",
  ]) assert.match(translations, new RegExp(brand));
  assert.match(header, /copy\.brandName/);
  assert.match(footer, /copy\.brandName/);
  assert.match(page, /copy\.brandName/);
  assert.match(layout, /lang=\{language\}/);
  assert.match(proxy, /x-page-language/);
});

test("hero uses one synchronized product state without automatic rotation", async () => {
  const [hero, track, grid] = await Promise.all([read("components/HeroCarousel.tsx"), read("components/PriceTrack.tsx"), read("components/ProductGrid.tsx")]);
  assert.match(hero, /src=\{product\.image\}/);
  assert.match(grid, /src=\{product\.image\}/);
  assert.doesNotMatch(`${hero}\n${track}`, /10\s*[×x]|DEMO/);
  assert.match(track, /data-product-id=\{product\.id\}/);
  assert.match(hero, /className="price-comparison" data-product-id=\{product\.id\}/);
  assert.match(hero, /product=\{product\}/g);
  assert.doesNotMatch(hero, /STAY_MS|autoTimer|"auto"|carousel-dots|getCarouselWindow|getTrackShift/);
  assert.match(hero, /\{index \+ 1\} \/ \{heroProducts\.length\}/);
  assert.match(hero, /onKeyDown/);
  assert.match(hero, /aria-live="polite"/);
});

test("hero separates its fixed image frame from bounded product copy", async () => {
  const [hero, styles] = await Promise.all([read("components/HeroCarousel.tsx"), read("app/globals.css")]);
  assert.match(hero, /<div className="hero-image-frame">\s*<Image[^>]+\/>\s*<\/div>\s*<div className="hero-product-info">/s);
  assert.match(styles, /\.hero-image-frame \{[^}]*height:\s*250px/s);
  assert.match(styles, /\.hero-image-frame img \{[^}]*object-fit:\s*contain;[^}]*object-position:\s*center/s);
  assert.match(styles, /\.hero-product-info \{[^}]*min-height:/s);
  assert.match(styles, /-webkit-line-clamp:\s*2/);
});

test("contact context follows the selected product and language links preserve src", async () => {
  const [portal, contact, header, footer] = await Promise.all([
    read("components/PortalPage.tsx"), read("components/ContactSheet.tsx"), read("components/Header.tsx"), read("components/Footer.tsx"),
  ]);
  assert.match(portal, /selectedProductId/);
  assert.match(portal, /onActiveProductChange=\{handleHeroProductChange\}/);
  assert.doesNotMatch(portal, /openContact\("product_card"\)/);
  assert.match(contact, /product\.name\[language\]/);
  assert.match(contact, /product\.id/);
  assert.match(contact, /country\.contact\.telegramUrl/);
  assert.doesNotMatch(contact, /t\.me\/share\/url/);
  assert.match(header, /encodeURIComponent\(source\)/);
  assert.match(footer, /encodeURIComponent\(source\)/);
});
