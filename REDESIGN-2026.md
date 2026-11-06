# TRO Optical — 2026 Redesign ("Heritage Luxury Glass")

Branch: `theme_overhaul` (11 commits on top of `34ac3d6`, one per phase). Shopify Online Store 2.0 theme, still PoloThemes "Eye Cart"/Dawn-derived — no framework, no build step, deploys exactly like before.

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
| Geometry | radii 10px buttons/inputs, 14px cards, 16px media, 20px popups, 999px pills; `--page-width` 1400px with 1.25/2/3rem gutters. Since Phase 9 these are **pinned in `tro-tokens.css`** (`--page-width`, `--buttons-radius`, `--inputs-radius`, card/media/popup radii, grid spacing) so the storefront renders the design even when the store's saved editor sliders differ; the Theme Settings sliders for those values no longer have an effect |
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
| 7 | `4e75462` | Verification fixes: AA contrast (gold-deep, option names, product count), breadcrumb separators moved to CSS, login/register a11y (h1, password-toggle label, underlined policy links), `preload_tag`, metric-matched fallback fonts (CLS 0.06 → 0), token-level glass fallbacks, `tests/theme-contracts.test.js`, this report |
| 8 | `a0439cb` | theme-check and axe clean-up to zero: header-drawer unclosed `<div>`, `email-signup-banner` schema (`enabled_on`), `<img>` dimensions (cart notification, drawer promo tiles), `assets/magnify.js` restored from Dawn v10.0.0 (hover zoom works again), 7 Spanish schema keys, all hardcoded `/collections` routes → `routes.*`, `preload_tag` for picker fonts, announcement-bar/`offset: continue` lints, unused assigns, variable names, orphan `icon-remove`; `facets.liquid` complexity 164 → 98 via `facets-active-pills` / `facets-filter-value` / `facets-price-inputs` snippets (DOM-equivalent output proven); heading order on power selector, blog/collection cards (`heading_tag` param), login/register tabs, quiz (`<h1>` + eyebrow contrast) |
| 8b | `0bcd28c` | Desktop facet popups (price, brands, colour…) as glass panels with rounded corners |
| 9 | `8d62592` | Live-site fixes and mockup parity: filter toolbar centred on wide screens (a `margin` override was cancelling `.page-width`'s auto margins) + frame-shape quick-filter pills (`facets-quick-filters.liquid`, link-based, `show_shape_quick_filters` setting); contact-lens power selector laid out by its own container width (eyes stack, fields in one row on desktop) instead of a viewport breakpoint; lens-modal eye legends inside the cards; geometry tokens pinned (see §3); "What we offer" rebuilt to the mockup (eyebrow + left-aligned serif heading + lede, line icons per column via `icon-offer.liquid`, no grey band, copy in `index.json`); duplicate bottom "View all" hidden on desktop; footer brand column (emblem, name, tagline, description, social icons), "Get directions" links on store cards, payment badges when Shopify has no gateway icons; shipping message "Free Shipping on orders ₹7000+"; offline Docker preview (`docker compose up preview`) |
| 10 | this commit | Navigation now lives in the theme: `snippets/theme-menu.liquid` defines the main menu (Home, Eyeglasses, Sunglasses, Contact Lenses, Reading Glasses, Brands with children built only from URLs that exist on the store) and renders both the desktop mega menu and the mobile drawer with the existing markup contracts; header setting `nav_source` (default "Theme navigation") falls back to a Shopify navigation menu if ever wanted. Brands panel gains 2x2 logo tiles (Ray-Ban, FILA, ACUVUE wordmarks from Wikimedia Commons, CooperVision typographic) linking to vendor filters. Promo tiles in `header-group.json` rebuilt with real links and store images (six, two per dropdown); blank-image tiles are skipped. Frame-finder quiz page on the tokens (rounded white card, rounded answer cards with indigo hover/selected ring, glass progress bar, Back/Reset in ink) |

Files: 77 changed vs base (+5,514 / −1,983 lines, fonts excluded); new: `tro-tokens.css`, `component-tro-header.css`, `section-feature-block.css`, `header-logo.liquid`, `cart-item-properties.liquid`, `swatch-color.liquid`, `facets-active-pills.liquid`, `facets-filter-value.liquid`, `facets-price-inputs.liquid`, `magnify.js` (Dawn v10.0.0, MIT), 3 WOFF2, `tests/theme-contracts.test.js`; deleted: `snippets/icon-remove.liquid` (orphan).

## 5. Functionality-preservation report

**Byte-identical (Verified by sha256 in `tests/theme-contracts.test.js`):** `power-selector.js`, `lens-selector.js`, `product-form.js`, `quiz.js`, `facets.js`, `cart.js`, `cart-drawer.js`. Also untouched: `global.min.js`, `pubsub.js`, `product-info.js`, `sortby.js`, `predictive-search.js`, `snippets/buy-buttons.liquid`, `snippets/lens-selector-modal.liquid`, all `templates/*.json` except `index.json` (hero `layout` settings only). Edited only at the tag level in Phase 8, with every id/class/data attribute preserved: `snippets/power-selector.liquid` (`<span>`→`<h2>`, `<h4>`→`<h3>`), `sections/main-product.liquid` (`offset: continue` → the arithmetically identical `offset: slide_offset`, verified against Ruby Liquid 4.0.4 which is Shopify's engine), the three quiz slide sections (`<h2>`→`<h1>`, `quiz.js` toggles `display` only).

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

**Facets refactor (Phase 8):** `snippets/facets.liquid` delegates its four active-pill loops, three value-item bodies and two price-input blocks to new snippets. Before/after renders of collection, contact-lens collection and search were compared in drawer, horizontal and vertical filter modes with an edge-case mock (12-value facet → show-more, a `count == 0` disabled value, a `count == 1` value, an applied price range): DOM-equivalent on every page. The single intentional difference is the mobile drawer's screen-reader text for one-product values ("1 products" → "1 product"; the old copy compared `value.count == '1'` as a string).

**Phase 10 scope check:** `theme-menu.liquid` emits the same element structure the Dawn scripts drive (`header-menu > details > summary + .mega-menu__content`; drawer `details > summary + .menu-drawer__submenu.has-submenu > .menu-drawer__inner-submenu > button.menu-drawer__close-button + ul`), so `details-disclosure.js` / `global.min.js` are untouched; verified by keyboard: Enter opens a mega menu with `aria-expanded`, Tab walks children and brand tiles, Escape closes and returns focus to the summary; in the drawer Enter opens a submenu with focus on its close button and Escape closes it. The old linklist renderers remain behind `nav_source = shopify`.

**Phase 9 scope check:** the shape quick filters are plain `<a>` links built from Shopify's `filter_value.url_to_add` / `url_to_remove`, so the existing `facets.js` form logic is untouched; the power-selector change is CSS only (container queries on `.power-selector`; browsers without support get the stacked 2×2 fallback); the footer additions are new Liquid branches behind settings that default on; `featured-collection` only gains a modifier class.

**Business-rule side effects deliberately not changed:** "Buy it now" still bypasses the lens modal; a variant change still visually resets the power gate (the submit interceptor still blocks); the lens modal's frame price is read once and not refreshed on variant change; cart quantity steppers still allow lens/frame quantities to diverge. All pre-existing (Verified in baseline), listed in §8.

## 6. Test results (Verified, final commit)

| Check | Result |
|---|---|
| Functional suite (`preview/` harness, Chrome, real theme JS) | **93/93** on baseline and after every phase (last run after Phase 9) |
| `node --test tests/*.test.js` | **33/33** (5 existing frame-finder tests + 28 contract/hash/reference tests; Phase 10 adds the theme-menu contracts and a guard that every menu URL is store-relative and points at a known collection handle) |
| Shopify theme-check 3.31 (all checks, default config) | **0 offenses** (base: 57 — 16 errors, 41 warnings). Note the base count under-reported: `header-drawer.liquid` did not parse, which hid one `<img>` error and 15 hardcoded routes until Phase 8 fixed the nesting. `facets.liquid` complexity 164 → 98 (limit 120) |
| axe-core 4.x (WCAG 2.1 AA + best-practice), 24 pages @1280 and 11 pages @390 | **0 violations on every page at both widths** (re-run on the Phase 9 pages: home, collections, contact-lens PDPs, frame PDP, cart). On the 10 core pages the baseline had 46 violating nodes (12 missing `alt`, 8 contrast, 7 list structure, 6 label/name mismatches, 5 redundant alt, heading order, password-toggle name, colour-only links, no `<h1>` on login) |
| Lighthouse 13.6 (local server, mock images — relative comparison only) | Accessibility **89–92 → 99–100** (desktop and mobile, 4 pages); Best-practices/SEO unchanged (100/100; PDP desktop 81 both: one pre-existing deprecation warning); Performance parity (57–59 vs 57–58 desktop, 67–70 vs 65–69 mobile); CLS home 0.011 → 0.000, LCP improved on all 4 pages; font bytes 154 KB → 85–108 KB; CSS +45 KB uncompressed (~9 KB gzipped) |
| Keyboard pass (CDP Tab sequences) | Every stop on PDP/cart/collection shows the indigo focus ring (baseline thumbnails had none); lens `<dialog>` traps focus and closes on Escape; cart drawer traps focus and returns it to the cart icon on Escape; power-selector selects reachable in order |
| Reduced motion / reduced transparency (emulated) | Max transition/animation duration 0.01ms; mega menu, drawers and hero card become opaque with `backdrop-filter: none` |
| Hover zoom (`image_zoom: hover`, restored `magnify.js`) | Click on the gallery image creates the `.image-magnify-full-size` overlay at 2×, toggles the spinner, restores opacity; overlay removed on mouseleave (CDP smoke test) |
| Screenshots | `design-samples/final-renders/` — 8 pages × 1440 full / 1280 / 768 / 375 full + mega menu, cart drawer (desktop/mobile), menu drawer, lens modal (desktop/mobile), filter drawer; `design-samples/final-renders/phase8/` — pages touched by the clean-up; `design-samples/final-renders/phase9/` — toolbar at 1920/1440, power selector at 1920/1440/375, lens modal step 3, offers section, footer, cart drawer; `design-samples/final-renders/phase10/` — Eyeglasses / Contact Lenses / Brands mega menus (1440, Brands also 1920), header at 1366, drawer submenu, quiz intro and question slides at 1440 and 375 |
| Live-store navigation audit (before Phase 10) | The store's Shopify menu `main-menu` was Home / Explore / Brands; the theme hardcoded both dropdowns, so the storefront never showed the merchandised menu. Every URL in `theme-menu.liquid` was fetched on the live store before being added (collection handles, `/collections/contact-lenses/{daily-contact,monthly,yearly-contact}`, `/collections/accessories/lens-solution`, gender/shape/vendor filters) |
| Live-site measurements (therajhanopticals.com, Chrome 1920px, before Phase 9) | Filter toolbar x=0 / 1200px wide while the grid started at x=408 (centring bug); contact-lens selects 66px wide ("Sel"); page width 1200, button/input radius 0 — the store had not applied `settings_data.json` / `header-group.json` from `main` even though templates had synced |

## 7. Font licence notice

`assets/tro-font-cormorant.woff2`, `assets/tro-font-cormorant-italic.woff2` (Cormorant Garamond, © Christian Thalmann) and `assets/tro-font-inter.woff2` (Inter, © Rasmus Andersson) are distributed under the SIL Open Font License 1.1. The OFL permits bundling and self-hosting with a web product; the reserved font names are unchanged. Keep this notice with the theme.

## 8. Known limitations

**Not verifiable without a Shopify store (Unverified):**
- Rendering inside Shopify's Liquid (the harness is liquidjs with a mock object model; `image_tag`, `preload_tag`, `font_face`, metafield shapes and section rendering API are emulated). In particular: `preload_tag` with `type`/`crossorigin` params, `image_tag` emitting `alt=""` for images without alt text, and `settings.use_brand_fonts` toggling in the editor.
- Live cart/checkout round-trips (`/cart/add.js`, `/cart/update.js` orphan cleanup) — the suite stubs `fetch` and asserts the payloads instead.
- Third-party apps: reviews widget (`.reviews-footer--b0D19`) and Instafeed (`#insta-feed`) custom CSS was left as-is and not re-rendered.
- Real-device glass performance on low-end Android (blur is capped at 12px under 750px; no measurement possible here).
- Theme editor behaviour for the new section settings (`logo_style`, `emblem_image`, `brand_tagline`, hero `layout`/`image_focus`).

**Navigation is code-defined (Phase 10):** edit `snippets/theme-menu.liquid` to change the menu — one `append` line per top-level item, `Title|URL|Child>URL;Child>URL`; `[NEW]`/`[SALE]` in a child title renders a badge. Promo tiles under each dropdown are the header's "Mega menu image" blocks (match on the menu title; a tile without an image is skipped). Known gaps: Ray-Ban has no products yet, so its tile and vendor filter open an empty page until stock is added; Toric and coloured contact lenses have no identifying tag or filter yet — tag the products (e.g. `Toric`, `Colored`) and add `Toric>/collections/contact-lenses/toric` to the Contact Lenses line. Women's sunglasses is omitted (0 products with `gender=Women`).

**Brand artwork:** `assets/brand-ray-ban.svg`, `assets/brand-fila.svg`, `assets/brand-acuvue.svg` are the public-domain wordmarks from Wikimedia Commons (text-only logos; trademarks shown nominatively as an authorised retailer). Replace them with dealer-kit artwork if the brands supply it, and drop `assets/brand-coopervision.svg` in and reference it in `theme-menu.liquid`'s `brand_tiles` line to swap the typographic CooperVision tile.

**Store settings that did not sync from GitHub (checklist for the theme editor):** the live theme is connected to `main`, but `config/settings_data.json` and `sections/header-group.json` were not applied by the store. Geometry is now pinned in CSS, so only these remain to be set by hand: Header → Logo style "Emblem", Emblem image `TRO_new.jpg`, Brand tagline "Estd. 1956 · Chennai"; Cart drawer → Shipping message "Free Shipping on orders ₹7000+"; Theme settings → Currency → untick "Show currency codes" (removes the "INR" suffix); optionally check the theme's GitHub sync status under Online Store → Themes.

**Pre-existing issues left unchanged (documented, not fixed — outside the "no business-logic change" boundary or content decisions):**
- "Buy it now" bypasses the lens modal and the power gate (dynamic checkout button is Shopify-rendered).
- Variant change resets the power-selector's visual state; lens modal frame price not refreshed on variant change.
- `sections/submit-quiz.liquid` orphan (not referenced by any template; not flagged by theme-check because sections are editor-addable), `.js-facet-remove` selector in `facets.js` matches nothing in the markup (it only toggles a `disabled` class on pills while a filter request is in flight; removal itself works through the `<facet-remove>` element), pagination prev/next class names swapped, cart page items lack `.cart-item`.
- Content inconsistencies: free-shipping threshold ₹1,999 (cart drawer) vs ₹7,000 (trust strips); "Summer Essentials 2024" mega-menu block; quiz CTA copy mentions Readers/Blue Light; lens tooltip SPH range (−16…+9) wider than the Rx form (+6…−9).
- `app.css` (Tailwind) remains frozen; `twcss-` utilities still used in login/register/cart/quiz markup.

## 9. Local preview (offline, Docker)

`docker compose up preview` from the theme root, then open http://localhost:4000. The container (`preview/`: `render.mjs`, `mock.mjs`, `serve.mjs`, 21 mock images, liquidjs 10.30.1 pinned) renders the JSON templates with mock products, collections, menus, blog and cart, serves the theme's `assets/` directly from the bind-mounted repo, and re-renders + reloads open pages when any theme file changes (mtime polling, so it works with Docker Desktop bind mounts). Without Docker: `cd preview && npm ci && npm start`.

Caveats: this is liquidjs with emulated Shopify filters/objects, not Shopify's engine; data is mock; settings come from the repo's `settings_data.json`, not the store; cart/checkout requests are not executed; the storefront links the mock pages point at (collections, products, account) redirect to the index. Use it for layout and CSS review, and `shopify theme dev` for store-accurate previews.

## 10. Recommendations

1. Preview on a development theme (`shopify theme push --development`) and run the 12 PDP cases from §5 with real products, especially the live `LensConfig` variant IDs and the `/cart/update.js` orphan cleanup.
2. Decide the free-shipping threshold and update the three places; retire "Summer Essentials 2024".
3. `main-login.liquid` still carries ~150 lines of commented-out "OLDER CODE"; delete it once the new login layout is signed off.
4. Replace the hardcoded `#LensConfig` JSON with metafields/metaobjects so lens bundles are merchant-editable; re-read `data-frame-price` on `variantChange`.
5. Remove the 15 unreferenced stock sections and unused scripts (`main-search.js`, `quick-add.js`, `submit-quiz.liquid`) after confirming in the editor that no template uses them.
6. Consider Shopify colour schemes (Dawn 10+) to replace the flat Polo colour model — the token layer already isolates the palette.
7. Keep `theme-check` and `node --test tests/` in CI; both are at zero/green now and will catch regressions in the Liquid/JS contracts.
