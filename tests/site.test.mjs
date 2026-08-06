import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { createTransitionGate, getCarouselWindow, getTrackRole, getTrackShift } from "../data/carousel.mjs";
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
  assert.deepEqual(resolveRoute("kg", ["en"]), { country: "kg", language: "en" });
  assert.deepEqual(resolveRoute("uz", ["en"]), { country: "uz", language: "en" });
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
  for (const mapping of [
    /zh:\s*"CNY"/,
    /uz:\s*"UZS"/,
    /ky:\s*"KGS"/,
    /ru:\s*"RUB"/,
    /en:\s*"USD"/,
  ]) assert.match(prices, mapping);
  assert.match(prices, /formatPrice\(value: number, sourceCurrency: Currency, language: Language\)/);
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
    "Central Asia Opportunity Portal",
  ]) assert.match(translations, new RegExp(brand));
  assert.match(header, /copy\.brandName/);
  assert.match(footer, /copy\.brandName/);
  assert.match(page, /copy\.brandName/);
  assert.match(layout, /lang=\{language\}/);
  assert.match(proxy, /x-page-language/);
});

test("language trigger shows only the current language and a dropdown chevron", async () => {
  const [header, styles] = await Promise.all([read("components/Header.tsx"), read("app/globals.css")]);
  assert.match(header, /<span>\{languageLabels\[language\]\}<\/span>/);
  assert.match(header, /<span className="language-chevron" aria-hidden="true">▾<\/span>/);
  assert.doesNotMatch(header, /language-shortcut|language !== "ru"/);
  assert.match(styles, /\.language-menu\[open\] \.language-chevron \{[^}]*transform:\s*rotate\(180deg\)/s);
});

test("mobile header keeps long localized brands from collapsing vertically", async () => {
  const styles = await read("app/globals.css");
  assert.match(styles, /\.brand > span:last-child \{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /@media \(max-width:\s*430px\)[\s\S]*\.site-header \{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\)/s);
  assert.match(styles, /html:not\(\[lang="zh"\]\) \.site-header > \.brand > span:last-child/);
  assert.match(styles, /\.site-header:has\(\.workspace-link\) > \.brand > span:last-child/);
  assert.match(styles, /\.header-actions \{[^}]*min-width:\s*0;[^}]*justify-content:\s*flex-end/s);
  assert.match(styles, /\.language-menu summary > span:first-child \{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap/s);
});

test("three carousel tracks keep five-item windows, opposite motion, and one center product", () => {
  const ids = ["kettle", "power-bank", "bulb", "earbuds", "dryer"];
  const productTrack = getCarouselWindow(ids, 0);
  const chinaTrack = getCarouselWindow(ids, 0);
  const localTrack = getCarouselWindow(ids, 0, true);
  assert.deepEqual(productTrack, ["earbuds", "dryer", "kettle", "power-bank", "bulb"]);
  assert.deepEqual(chinaTrack, productTrack);
  assert.deepEqual(localTrack, ["bulb", "power-bank", "kettle", "dryer", "earbuds"]);
  assert.equal(productTrack[2], chinaTrack[2]);
  assert.equal(productTrack[2], localTrack[2]);
  assert.equal(getTrackShift(1, "product"), -1);
  assert.equal(getTrackShift(1, "china"), -1);
  assert.equal(getTrackShift(1, "local"), 1);
  assert.equal(getTrackShift(-1, "product"), 1);
  assert.equal(getTrackShift(-1, "china"), 1);
  assert.equal(getTrackShift(-1, "local"), -1);
  assert.deepEqual([0, 1, 2, 3, 4].map((slot) => getTrackRole(slot, -1)), ["side", "side", "leaving", "entering", "side"]);
  assert.deepEqual([0, 1, 2, 3, 4].map((slot) => getTrackRole(slot, 1)), ["side", "entering", "leaving", "side", "side"]);
});

test("transition gate rejects rapid repeated moves until the reset completes", () => {
  const gate = createTransitionGate();
  assert.equal(gate.tryLock(), true);
  assert.equal(gate.isLocked(), true);
  assert.equal(gate.tryLock(), false);
  assert.equal(gate.tryLock(), false);
  gate.unlock();
  assert.equal(gate.isLocked(), false);
  assert.equal(gate.tryLock(), true);
});

test("hero renders three real synchronized tracks without automatic rotation", async () => {
  const [hero, track, grid] = await Promise.all([read("components/HeroCarousel.tsx"), read("components/PriceTrack.tsx"), read("components/ProductGrid.tsx")]);
  assert.match(hero, /src=\{item\.image\}/);
  assert.match(grid, /src=\{product\.image\}/);
  assert.doesNotMatch(`${hero}\n${track}`, /10\s*[×x]|DEMO/);
  assert.match(track, /data-product-id=\{product\.id\}/);
  assert.match(hero, /getCarouselWindow\(heroProducts, index\)/);
  assert.match(hero, /getCarouselWindow\(heroProducts, index, true\)/);
  assert.match(hero, /data-track="product"/);
  assert.match(track, /data-track=\{tone\}/);
  assert.match(track, /getTrackShift\(direction, tone\)/);
  assert.doesNotMatch(hero, /STAY_MS|autoTimer|"auto"|carousel-dots/);
  assert.match(hero, /createTransitionGate\(\)/);
  assert.match(hero, /className="current-product-info" data-product-id=\{product\.id\}/);
  assert.match(hero, /setResetting\(true\)/);
  assert.match(hero, /\{index \+ 1\} \/ \{heroProducts\.length\}/);
  assert.equal((hero.match(/type="button" className="carousel-arrow"/g) ?? []).length, 2);
  assert.match(hero, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(hero, /onPointerUp=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(hero, /onKeyDown/);
  assert.match(hero, /aria-live="polite"/);
});

test("hero separates its fixed image frame from bounded product copy", async () => {
  const [hero, styles] = await Promise.all([read("components/HeroCarousel.tsx"), read("app/globals.css")]);
  assert.match(hero, /<span className="product-visual"><img[^>]+\/><\/span>/s);
  assert.match(hero, /<div className="current-product-info" data-product-id=\{product\.id\}>/);
  assert.match(styles, /\.product-visual \{[^}]*height:\s*220px/s);
  assert.match(styles, /\.product-visual \{[^}]*padding:\s*12px/s);
  assert.match(styles, /\.product-visual img \{[^}]*max-width:\s*calc\(100% - 24px\);[^}]*max-height:\s*calc\(100% - 24px\);[^}]*object-fit:\s*contain;[^}]*object-position:\s*center/s);
  assert.match(styles, /\.current-product-info \{[^}]*height:\s*72px/s);
  assert.match(styles, /\.current-product-info \{[^}]*transition:\s*opacity 180ms ease/s);
  assert.match(styles, /\.product-showcase\.is-moving \.current-product-info \{[^}]*opacity:\s*\.28/s);
  assert.match(styles, /\.stage-item\.side, \.stage-item\.leaving \{[^}]*transform:\s*scale\(\.76\)/s);
  assert.match(styles, /\.stage-item\.current, \.stage-item\.entering \{[^}]*transform:\s*scale\(\.95\)/s);
  assert.match(styles, /\.track-strip \{[^}]*width:\s*360%;[^}]*margin-left:\s*-130%/s);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.track-strip \{[^}]*width:\s*166\.6667%;[^}]*margin-left:\s*-33\.3333%/s);
  assert.match(styles, /\.price-item\.side, \.price-item\.leaving \{[^}]*visibility:\s*hidden;[^}]*opacity:\s*0/s);
  assert.match(styles, /\.showcase-controls \{[^}]*z-index:\s*5/s);
  assert.match(styles, /\.carousel-arrow \{[^}]*width:\s*48px;[^}]*height:\s*48px;[^}]*touch-action:\s*manipulation/s);
  assert.doesNotMatch(styles, /\.product-strip\[data-shift=.*nth-child|\.price-strip\[data-shift=.*nth-child/);
  assert.match(styles, /-webkit-line-clamp:\s*2/);
});

test("product cards contain complete images inside their fixed visual frame", async () => {
  const styles = await read("app/globals.css");
  assert.match(styles, /\.card-visual \{[^}]*padding:\s*8px;[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.card-visual img \{[^}]*width:\s*auto;[^}]*height:\s*100px;[^}]*max-width:\s*100%;[^}]*object-fit:\s*contain;[^}]*object-position:\s*center/s);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.card-visual img \{[^}]*height:\s*150px/s);
});

test("product cards open an accessible responsive detail panel before consultation", async () => {
  const [grid, portal, translations, styles] = await Promise.all([
    read("components/ProductGrid.tsx"), read("components/PortalPage.tsx"), read("data/translations.ts"), read("app/globals.css"),
  ]);
  assert.match(grid, /aria-haspopup="dialog"/);
  assert.match(grid, /role="dialog" aria-modal="true"/);
  assert.match(grid, /event\.key === "Escape"/);
  assert.match(grid, /copy\.referenceDifference/);
  assert.match(grid, /copy\.differenceDisclaimer/);
  assert.match(grid, /copy\.landedCostParts\.join/);
  assert.match(grid, /copy\.landedCostResult/);
  assert.match(grid, /onConsult\(detailProduct\.id\)/);
  assert.doesNotMatch(grid, /is-selected|selectedProduct/);
  assert.match(portal, /openContact\("product_detail", productId\)/);
  assert.match(portal, /useState<string \| null>\(initialProductId \?\? null\)/);
  assert.match(translations, /consultProduct:\s*"咨询这个商品"/);
  assert.match(styles, /\.product-detail-panel \{[^}]*height:\s*100dvh/s);
  assert.match(styles, /\.product-detail-header \{[^}]*position:\s*sticky/s);
  assert.match(grid, /className="product-detail-image-frame"[\s\S]*<img[^>]*width=\{600\}[^>]*height=\{600\}/);
  assert.match(styles, /\.product-detail-image-frame \{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*height:\s*100%/s);
  assert.match(styles, /\.product-detail-image-frame img \{[^}]*object-fit:\s*contain/s);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.product-detail-backdrop \{[^}]*align-items:\s*center/s);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.product-detail-layout \{[^}]*grid-template-columns:/s);
});

test("product list can be filtered by business-friendly categories", async () => {
  const [grid, translations, styles] = await Promise.all([
    read("components/ProductGrid.tsx"), read("data/translations.ts"), read("app/globals.css"),
  ]);
  assert.match(grid, /type ProductFilter = "all" \| "electronics" \| "home" \| "personal" \| "daily"/);
  assert.match(grid, /const categoryGroups/);
  assert.match(grid, /copy\.productCategoryAll/);
  assert.match(grid, /copy\.productCategoryLabels\[filter\]/);
  assert.match(grid, /aria-pressed=\{activeFilter === filter\}/);
  assert.match(grid, /setExpanded\(false\)/);
  assert.match(grid, /trackEvent\("filter_products"/);
  assert.match(grid, /activeFilter === "all" &&/);
  assert.match(translations, /productCategoryLabels:\s*\{ electronics:/);
  assert.match(styles, /\.product-filter \{[^}]*flex-wrap:\s*wrap/s);
  assert.match(styles, /\.product-filter button\.is-active \{/);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.product-filter \{[^}]*justify-content:\s*center/s);
});

test("service flow uses two desktop phases and a compact mobile accordion", async () => {
  const [flow, translations, styles] = await Promise.all([
    read("components/ServiceFlow.tsx"), read("data/translations.ts"), read("app/globals.css"),
  ]);
  assert.match(translations, /servicePhases:\s*\[/);
  assert.match(translations, /label:\s*"前期确认"[\s\S]*range:\s*"01—03"/);
  assert.match(translations, /label:\s*"履约交付"[\s\S]*range:\s*"04—05"/);
  assert.match(flow, /className="service-phases"/);
  assert.match(flow, /className="service-mobile"/);
  assert.match(flow, /<details key=\{step\.title\} open=\{stepIndex === 0\}>/);
  assert.match(flow, /step\.duration/);
  assert.match(flow, /step\.deliverable/);
  assert.doesNotMatch(flow, /service-cta|onContact/);
  assert.doesNotMatch(translations, /serviceCta:/);
  assert.match(styles, /\.service-section \{[^}]*overflow:\s*visible/s);
  assert.match(styles, /\.service-section::after \{[^}]*right:\s*0;/s);
  assert.doesNotMatch(styles, /\.service-section::after \{[^}]*right:\s*-/s);
  assert.match(styles, /\.service-phases \{ display:\s*none;/);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.service-mobile \{ display:\s*none;/);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.service-phases \{ display:\s*grid;/);
  assert.match(styles, /@media \(min-width:\s*760px\)[\s\S]*\.service-card \{[^}]*overflow:\s*visible/s);
});

test("pricing guidance stays only at decision points", async () => {
  const [hero, portal, grid, styles] = await Promise.all([
    read("components/HeroCarousel.tsx"), read("components/PortalPage.tsx"), read("components/ProductGrid.tsx"), read("app/globals.css"),
  ]);
  assert.match(hero, /className="hero-cost-strip"/);
  assert.doesNotMatch(hero, /cost-strip-icon/);
  assert.match(hero, /copy\.landedCostParts\.join\(" \+ "\)/);
  assert.match(hero, /copy\.differenceDisclaimer/);
  assert.doesNotMatch(hero, /copy\.trust\.map|cost-strip-tags/);
  assert.doesNotMatch(portal, /TrustList|pricing-section|price-note|route-map|trade-route/);
  assert.match(grid, /className="product-detail-note"\>\{copy\.differenceDisclaimer\}<br \/>\{copy\.priceDisclaimer\}<\/p>/);
  assert.doesNotMatch(grid, /className="product-detail-note"[\s\S]*copy\.confirmedDate/);
  assert.match(styles, /\.hero-cost-strip \{[^}]*width:\s*min\(740px, calc\(100% - 24px\)\)/s);
  assert.match(styles, /\.hero-cost-strip \{[^}]*text-align:\s*center/s);
  assert.doesNotMatch(styles, /pricing-section|price-note|route-map|trade-route|trust-list|cost-strip-tags/);
});

test("section headings stay centered across desktop and mobile", async () => {
  const styles = await read("app/globals.css");
  assert.match(styles, /\.section-heading \{[^}]*align-items:\s*center;[^}]*flex-direction:\s*column;[^}]*justify-content:\s*center;[^}]*text-align:\s*center/s);
  assert.match(styles, /\.section-heading > p \{[^}]*margin:\s*0/s);
  assert.doesNotMatch(styles, /@media \(max-width:\s*759px\)[\s\S]*\.section-heading/);
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
  assert.match(contact, /const serviceCountryLabel = country\.name\[language\]/);
  assert.doesNotMatch(contact, /language === "zh" \? "中国"|language === "ru" \? null/);
  assert.match(contact, /label: intentCopy\.phone/);
  assert.match(contact, /<strong>\{channel\.label\}<\/strong>/);
  assert.match(contact, /copy\.contactOutcomes\.map/);
  assert.match(contact, /copy\.contactOutcomesTitle/);
  assert.doesNotMatch(contact, /t\.me\/share\/url/);
  assert.match(header, /encodeURIComponent\(source\)/);
  assert.match(footer, /encodeURIComponent\(source\)/);
});

test("query-string language controls protected-page html lang and metadata", async () => {
  const [proxy, auth, account, advisor] = await Promise.all([
    read("proxy.ts"), read("app/auth/page.tsx"), read("app/account/page.tsx"), read("app/advisor/page.tsx"),
  ]);
  assert.match(proxy, /const queryLanguage = request\.nextUrl\.searchParams\.get\("language"\)/);
  assert.match(proxy, /queryLanguage === "ky"/);
  for (const page of [auth, account, advisor]) {
    assert.match(page, /export async function generateMetadata/);
    assert.match(page, /robots: \{ index: false, follow: false \}/);
    assert.match(page, /translations\[language\]\.brandName/);
  }
});

test("the fixed opportunity entry reserves its own right-side rail", async () => {
  const [portal, styles] = await Promise.all([
    read("components/PortalPage.tsx"), read("app/globals.css"),
  ]);
  assert.match(portal, /<main className="portal-page">/);
  assert.match(portal, /className="opportunity-dock"/);
  assert.match(portal, /openContact\("fixed_opportunity"\)/);
  assert.match(portal, /copy\.floatingConsult/);
  assert.match(styles, /\.portal-page \{ --opportunity-rail:\s*46px; width:\s*calc\(100% - var\(--opportunity-rail\)\); \}/);
  assert.match(styles, /\.opportunity-dock \{[^}]*position:\s*fixed;[^}]*top:\s*50%; right:\s*0;/s);
  assert.match(styles, /@media \(max-width:\s*430px\)[\s\S]*?\.portal-page \{ --opportunity-rail:\s*38px; \}/);
});

test("the fixed opportunity entry is translated in every supported language", async () => {
  const translations = await read("data/translations.ts");
  for (const label of ["Enquire", "咨询商机", "Консультация", "Кеңеш алуу", "Maslahat"]) {
    assert.match(translations, new RegExp(`floatingConsult:\\s*${JSON.stringify(label)}`));
  }
});
