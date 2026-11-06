# TRO Optical — 2026 Redesign ("Heritage Luxury Glass")

Branch: `theme_overhaul` (7 commits on top of `34ac3d6`, one per phase). Shopify Online Store 2.0 theme, still PoloThemes "Eye Cart"/Dawn-derived — no framework, no build step, deploys exactly like before.

This document is the single deliverable for the redesign: audit summary, design rationale, design system, implementation summary, functionality-preservation report, test results, known limitations and recommendations. Every claim is tagged **Verified** (executed locally), **Inferred** (reasoned from code) or **Unverified** (needs a Shopify store/preview).

---

## 1. Audit summary (Verified, pre-redesign commit `34ac3d6`)

- Three overlapping style layers: Dawn `base.css` (70 KB), a precompiled Tailwind v3.4.3 bundle `app.css` (prefix `twcss-`, no config/source in repo — cannot be rebuilt) and ~60 per-component stylesheets. Component CSS hardcoded 90+ hex values and referenced non-existent variables (`--accent-color-1`).
- Fonts: EB Garamond from Google Fonts hardcoded in `theme.liquid`, overriding the Theme Settings picker (which still downloaded Assistant). Three external font requests per page.
- `theme.liquid` referenced `settings.main_background`, `accent_color_3`, `white_color`, `error*`, `colors_outline_button_labels` which were **missing from `settings_schema.json`**, so `--color-base-background-2`, `--color-base-accent-3` and the error tokens rendered as invalid CSS.
- Cart drawer and cart page never rendered `item.properties`: prescriptions, power type, lens package and "For Frame" pairing were invisible to the customer until the order page.
- Product cards used the Shopify option *name* ("Rose Gold") directly as a CSS colour; product-count and sort markup duplicated; `.facet-filters__summary { min-width: 15625rem }` typo; `main-404.liquid` had a Tailwind class without the `twcss-` prefix; hero image had a fixed 750px width and no `srcset`; multiple `<h1>` on the homepage; missing `width`/`height` on several `<img>` (theme-check errors).
- Business logic lives in `snippets/buy-buttons.liquid` (tag routing `power-required` / `power-optional` / `no-boxes` / `only-spherical` + legacy `custom.requires_power` metafield + "Pack Size" option), `assets/power-selector.js` (SPH→CYL→Axis→Boxes cascade, quantity = sum of boxes, submit interception), `assets/lens-selector.js` (native `<dialog>`, hardcoded `#LensConfig-{section}` variant map, `Pair ID`/`For Frame` properties, orphan-lens cleanup via `/cart/update.js`), Dawn `global.min.js` variant contracts, `quiz.js`.

## 2. Design rationale (direction B — chosen over A "Optical Atelier" and C "Modern Glossy Boutique")

- **Why B:** the brand is a 70-year-old Chennai optician. Direction A alone read conservative; C read "tech demo" and would have fought the trust narrative. B keeps A's editorial base (porcelain surfaces, ink typography, hairline rules, heritage gold used sparingly) and applies *liquid glass only where the UI genuinely layers*: sticky header once scrolled, mega-menu panel, mobile navigation drawer, cart drawer, filter drawer, the lens-selector `<dialog>`, the hero content card and the mobile buy bar. Products always sit on opaque, neutral backgrounds.
- **Why it is low-risk:** glass maps 1:1 onto the theme's existing overlay components, so the restyle is CSS + wrapper markup; no JavaScript, no form contract and no Liquid business rule changed (see §5).
- **Typography:** Cormorant Garamond (display, weight 500, italic for emphasis) + Inter (body). Self-hosted variable WOFF2 (107 KB total vs 154 KB of Google Fonts before) because Shopify's font library could not be verified offline; a `use_brand_fonts` theme setting falls back to the standard font picker.
- **Heritage cues:** the round TRO emblem is cropped into a circular seal with the wordmark and "Estd. 1956 · Chennai" tagline (editable in the header section), gold eyebrows, serif display headings, the ink footer with the four store cards.

## 3. Design system (`assets/tro-tokens.css`, loaded after `base.css`)

| Token group | Values |
|---|---|
| Palette | ink `#121A4A`, ink-900 `#070B2E`, indigo `#3B3989` (brand anchor, links/focus), indigo-soft `#5B59A8`, indigo-tint `#ECEBF6`, porcelain `#F7F5F0` (page), linen `#F1EDE5` (alt surface), stone `#BDB5A6` (disabled only), muted `#5B6172` (secondary text, 5.67:1 on porcelain), gold `#B99A5B` (on dark only, 6.2:1 on ink), gold-deep `#7A6230` (gold on light, 4.97:1 on linen), error `#B3261E` |
| Glass | `--tro-glass-bg rgba(255,255,255,.66)`, `--tro-glass-bg-strong .86`, border `.65`, blur `18px` (12px under 750px), dark variant `rgba(10,16,52,.58)`; opaque overrides under `@supports not (backdrop-filter)` and `prefers-reduced-transparency: reduce` (which also removes every `backdrop-filter`) |
| Geometry | radii 10px buttons/inputs, 14px cards, 16px media, 20px popups, 999px pills; `--page-width` 1400px with 1.25/2/3rem gutters |
| Motion | 150–250ms transform/opacity only; global `prefers-reduced-motion` kill-switch (0.01ms durations, single iteration) |
| Type scale | Display headings via `--font-heading-family`, `.tro-eyebrow`/`.caption-with-letter-spacing` 11px/600/0.16em uppercase |
| Focus | `*:focus-visible` 2px indigo outline + 2px offset (Tailwind-styled buttons previously had none) |

Theme Settings restored/added: `accent_color_3`, `background_color`, `main_background`, `white_color`, `colors_outline_button_labels`, `error`, `error_background`, `error_border`, `use_brand_fonts`. Defaults in `settings_data.json`: porcelain background, radii above, currency code off.

## 4. Implementation summary (one commit per phase)

| Phase | Commit | Scope |
|---|---|---|
| 0 | — | Baseline: offline render harness (liquidjs + mock Shopify objects), 15-test / 93-check functional suite run against the untouched theme, reference screenshots (`design-samples/baseline-renders`) |
| 1 | `8ed6be3` | `tro-tokens.css`; self-hosted fonts + `use_brand_fonts`; Google Fonts removed; missing colour settings restored; `--page-width` in px; `theme-color` meta |
| 2 | `c219561` | Header (emblem/wordmark snippet `header-logo.liquid`, glass sticky header, nav grid), mega menu (glass panel, `[NEW]`/`[SALE]` badge titles cleaned), mobile drawer, cart drawer rewrite with **line-item properties now visible** (`cart-item-properties.liquid`: Power Type, Lens Package, prescription values, "For frame" pairing; upload links; `Pair ID` hidden), footer |
| 3 | `44aa015` | Hero (`layout` split/full, `image_focus`, single `<h1>` only when first section, responsive `image_tag`), category showcase, legacy strip (static ambience), quiz CTA, trust strip, feature block, multicolumn grid, featured-collection heading row |
| 4 | `c18e47a` | Product card (brand eyebrow, colour swatches via `swatch-color.liquid` name→hex map, glass "View details" hover), facets toolbar/pills/sort/drawer, colour-swatch + shape-icon facets, collection hero, breadcrumbs, pagination, search page form for empty results |
| 5 | `b3d01c7` | PDP — **CSS only**: gallery/thumbnails, info column, frame specifications card (SVG diagram fill fix), inline power selector, lens-selector modal (stepper lines fixed), mobile fixed glass buy bar |
| 6 | `782fca4` | Cart page (properties, item cards), article/blog, 404 (prefix bug + `routes.root_url`), customer pages, contact, password layout |
| 7 | this commit | Verification fixes: AA contrast (gold-deep, option names, product count), breadcrumb separators moved to CSS, login/register a11y (h1, password-toggle label, underlined policy links), `preload_tag`, metric-matched fallback fonts (CLS 0.06 → 0), token-level glass fallbacks, `tests/theme-contracts.test.js`, this report |

Files: 54 changed vs base (+5,114 / −1,538 lines, fonts excluded); new: `tro-tokens.css`, `component-tro-header.css`, `section-feature-block.css`, `header-logo.liquid`, `cart-item-properties.liquid`, `swatch-color.liquid`, 3 WOFF2, `tests/theme-contracts.test.js`.

## 5. Functionality-preservation report

**Byte-identical (Verified by sha256 in `tests/theme-contracts.test.js`):** `power-selector.js`, `lens-selector.js`, `product-form.js`, `quiz.js`, `facets.js`, `cart.js`, `cart-drawer.js`. Also untouched: `global.min.js`, `pubsub.js`, `product-info.js`, `sortby.js`, `predictive-search.js`, `snippets/buy-buttons.liquid`, `snippets/power-selector.liquid`, `snippets/lens-selector-modal.liquid`, `sections/main-product.liquid`, all quiz slide sections, all `templates/*.json` except `index.json` (hero `layout` settings only).

**DOM/JS contracts kept (Verified by the contracts test + 93 runtime checks):** `#PowerSelector`, `power-{field}-{eye}`, `prop-{eye}-{field}`, `#ProductSubmitButton-{section}`, `LensConfig-/LensList-/LensPrice*/LensPowerToggle-/LensRxError*/lens-sph|cyl|axis-*`, `lens-prop-*` hidden inputs, `#CartDrawer*`, `CartDrawer-Item-/Remove-/LineItemError-`, `Drawer-quantity-`, `#cart`, `#main-cart-items`, `CartItem-`, `Line-item-error-`, `#FacetSortForm`, `#product-grid`, `#ProductCount*`, quiz selectors, `cart-icon-bubble`, `sections 'header-group'`.

**Runtime behaviour re-executed in Chrome against the real Liquid + real JS (15 tests, 93 checks — identical pass on baseline and redesign):**
1. Contact lens (power-required, toric): SPH→CYL→Axis→Boxes cascade gates Add to cart; properties `Left/Right Eye SPH/CYL/Axis/Boxes`; hidden quantity = boxes sum
2. Contact lens (power-required + only-spherical, explicit SPH array): CYL/Axis hidden
3. Contact lens (power-optional + only-spherical): No Power path → `N/A`
4. Submit interception shows the validation error
5. Eyeglass frame: Add to cart opens the lens modal; Single Vision → bundles → Rx → add (frame + lens with `Pair ID`/`For Frame`)
6. Frame Only adds immediately with Prescription `N/A`
7. Computer skips the prescription step
8. Progressive → "upload after purchase" skip
9. Back/close reset the modal
10. Accessory (no power tags): standard add to cart
11. Variant switching (Color/Size): variant id + media update, modal still gates submit
12. Sunglasses: standard flow + stock badge
13. Cart drawer markup contract (items, quantity, remove, errors, checkout)
14. Header + collection contracts (facets forms, sort, grid, count)
15. Quiz page contract (slides, answers, progress, back)

**Business-rule side effects deliberately not changed:** "Buy it now" still bypasses the lens modal; a variant change still visually resets the power gate (the submit interceptor still blocks); the lens modal's frame price is read once and not refreshed on variant change; cart quantity steppers still allow lens/frame quantities to diverge. All pre-existing (Verified in baseline), listed in §8.

## 6. Test results (Verified, final commit)

| Check | Result |
|---|---|
| Functional suite (`/tmp` harness, Chrome, real theme JS) | **93/93** on baseline and on redesign |
| `node --test tests/*.test.js` | **24/24** (5 existing frame-finder tests + 19 new contract/hash/reference tests) |
| Shopify theme-check 3.31 | **42 offenses (16 → 12 errors)** vs 57 on base. All 12 remaining errors are pre-existing (header-drawer `</details>` nesting, `magnify.js` missing, `email-signup-banner` schema, 7 `es.schema.json` translations, one `<img>` in `cart-notification-product`). The only new offense is `facets.liquid` Liquid complexity 161 → 164 (already over the limit). Fixed vs base: 4 `ImgWidthAndHeight` errors, 2 deprecated filters, 4 hardcoded routes, 3 remote assets, 2 undefined objects |
| axe-core 4.x (WCAG 2.1 AA + best-practice), 24 pages @1280 and 11 pages @390 | Redesign: **0 violations on 17/24 pages**; the remaining 7 pages carry pre-existing issues only — 1 `heading-order` node each on the three contact-lens PDPs (power-selector `<h4>`), blog (card heading), login (tab `<h3>`), list-collections (card `<h3>`), plus the quiz page's `twcss-text-[rgb(var(--color-base-text))]` contrast and missing `<h1>`. On the 10 core pages the baseline had 46 violating nodes (12 missing `alt`, 8 contrast, 7 list structure, 6 label/name mismatches, 5 redundant alt, heading order, password-toggle name, colour-only links, no `<h1>` on login); the redesign has 3 (the pre-existing heading-order nodes above) |
| Lighthouse 13.6 (local server, mock images — relative comparison only) | Accessibility **89–92 → 99–100** (desktop and mobile, 4 pages); Best-practices/SEO unchanged (100/100; PDP desktop 81 both: one pre-existing deprecation warning); Performance parity (57–59 vs 57–58 desktop, 67–70 vs 65–69 mobile); CLS home 0.011 → 0.000, LCP improved on all 4 pages; font bytes 154 KB → 85–108 KB; CSS +45 KB uncompressed (~9 KB gzipped) |
| Keyboard pass (CDP Tab sequences) | Every stop on PDP/cart/collection shows the indigo focus ring (baseline thumbnails had none); lens `<dialog>` traps focus and closes on Escape; cart drawer traps focus and returns it to the cart icon on Escape; power-selector selects reachable in order |
| Reduced motion / reduced transparency (emulated) | Max transition/animation duration 0.01ms; mega menu, drawers and hero card become opaque with `backdrop-filter: none` |
| Screenshots | `design-samples/final-renders/` — 8 pages × 1440 full / 1280 / 768 / 375 full + mega menu, cart drawer (desktop/mobile), menu drawer, lens modal (desktop/mobile), filter drawer |

## 7. Font licence notice

`assets/tro-font-cormorant.woff2`, `assets/tro-font-cormorant-italic.woff2` (Cormorant Garamond, © Christian Thalmann) and `assets/tro-font-inter.woff2` (Inter, © Rasmus Andersson) are distributed under the SIL Open Font License 1.1. The OFL permits bundling and self-hosting with a web product; the reserved font names are unchanged. Keep this notice with the theme.

## 8. Known limitations

**Not verifiable without a Shopify store (Unverified):**
- Rendering inside Shopify's Liquid (the harness is liquidjs with a mock object model; `image_tag`, `preload_tag`, `font_face`, metafield shapes and section rendering API are emulated). In particular: `preload_tag` with `type`/`crossorigin` params, `image_tag` emitting `alt=""` for images without alt text, and `settings.use_brand_fonts` toggling in the editor.
- Live cart/checkout round-trips (`/cart/add.js`, `/cart/update.js` orphan cleanup) — the suite stubs `fetch` and asserts the payloads instead.
- Third-party apps: reviews widget (`.reviews-footer--b0D19`) and Instafeed (`#insta-feed`) custom CSS was left as-is and not re-rendered.
- Real-device glass performance on low-end Android (blur is capped at 12px under 750px; no measurement possible here).
- Theme editor behaviour for the new section settings (`logo_style`, `emblem_image`, `brand_tagline`, hero `layout`/`image_focus`).

**Pre-existing issues left unchanged (documented, not fixed — outside the "no business-logic change" boundary or content decisions):**
- "Buy it now" bypasses the lens modal and the power gate (dynamic checkout button is Shopify-rendered).
- Variant change resets the power-selector's visual state; lens modal frame price not refreshed on variant change.
- `snippets/header-drawer.liquid` `<details>`/`<div>` nesting error (theme-check), `assets/magnify.js` referenced but missing, `sections/submit-quiz.liquid` orphan, `.js-facet-remove` class mismatch, pagination prev/next class names swapped, cart page items lack `.cart-item`.
- Heading-order issues inside `power-selector.liquid` (`<h4>`), blog/article cards, login tabs, list-collections; quiz page has no `<h1>` and one low-contrast utility class.
- Content inconsistencies: free-shipping threshold ₹1,999 (cart drawer) vs ₹7,000 (trust strips); "Summer Essentials 2024" mega-menu block; quiz CTA copy mentions Readers/Blue Light; lens tooltip SPH range (−16…+9) wider than the Rx form (+6…−9).
- `app.css` (Tailwind) remains frozen; `twcss-` utilities still used in login/register/cart/quiz markup.
- Spanish schema translations missing for 7 pre-existing keys (`stock_badge`, `main_cart`, error colours).

## 9. Recommendations

1. Preview on a development theme (`shopify theme push --development`) and run the 12 PDP cases from §5 with real products, especially the live `LensConfig` variant IDs and the `/cart/update.js` orphan cleanup.
2. Decide the free-shipping threshold and update the three places; retire "Summer Essentials 2024".
3. Fix the two cheap heading-order items (`power-selector.liquid` `<h4>` → `<h3>`, blog card heading) once the PDP markup freeze is lifted.
4. Replace the hardcoded `#LensConfig` JSON with metafields/metaobjects so lens bundles are merchant-editable; re-read `data-frame-price` on `variantChange`.
5. Remove the 15 unreferenced stock sections and unused scripts (`main-search.js`, `quick-add.js`, `submit-quiz.liquid`) after confirming in the editor that no template uses them.
6. Consider Shopify colour schemes (Dawn 10+) to replace the flat Polo colour model — the token layer already isolates the palette.
7. Add the Spanish translations for the 7 missing schema keys.
