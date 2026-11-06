// Regression guard for the DOM contracts shared between Liquid markup and the
// business-logic scripts (power-selector.js, lens-selector.js, product-form.js,
// quiz.js, cart.js, facets.js). If a restyle drops one of these hooks the JS
// silently stops working, so fail loudly here instead. Every token below was
// taken from the pre-redesign theme (commit 34ac3d6).
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const contracts = {
  "snippets/buy-buttons.liquid": [
    "power-required",
    "power-optional",
    "no-boxes",
    "only-spherical",
    "custom.requires_power",
    "Pack Size",
    "ProductSubmitButton-",
    "power-quantity-input",
    "lens-prop-lens-package",
    "lens-prop-pair-id",
    "lens-prop-power-type",
    "lens-prop-prescription",
  ],
  "snippets/power-selector.liquid": [
    'id="PowerSelector"',
    "PowerSelectorError",
    "PowerSelectorErrorText",
    "power-sph-",
    "power-cyl-",
    "power-axis-",
    "power-boxes-",
    "prop-left-sph",
    "prop-right-axis",
    "power-selector.js",
  ],
  "snippets/lens-selector-modal.liquid": [
    "LensSelectorModal-",
    "LensConfig-",
    "LensList-",
    "LensLoadingOverlay",
    "LensManualRx-",
    "LensPowerToggle-",
    "LensPriceLabel-",
    "LensPriceValue-",
    "LensRxError-",
    "LensRxErrorText-",
    "lens-sph-",
    "lens-cyl-",
    "lens-axis-",
    "lens-modal__rx-select",
    "lens-selector.js",
  ],
  "sections/main-product.liquid": ['id="MainProduct-', 'id="ProductInfo-', 'id="price-', 'id="Quantity-', "data-section="],
  "sections/cart-drawer.liquid": [
    'id="CartDrawer"',
    'id="CartDrawer-Form"',
    'id="CartDrawer-CartItems"',
    'id="CartDrawer-LineItemStatus"',
    'id="CartDrawer-LiveRegionText"',
    'id="CartDrawer-CartErrors"',
    'id="CartDrawer-Overlay"',
    'id="CartDrawer-Checkout"',
    'id="Details-CartDrawer"',
    "CartDrawer-Item-",
    "CartDrawer-LineItemError-",
    "CartDrawer-Remove-",
    "Drawer-quantity-",
    "cart-remove-button",
    "cart-item__error-text",
    "data-index=",
  ],
  "sections/main-cart.liquid": ['id="cart"', 'id="main-cart-items"', "CartItem-", "Line-item-error-", "Quantity-", "cart-item__error-text", "data-index="],
  "sections/main-cart-footer.liquid": ['id="cart-errors"'],
  "snippets/cart-item-properties.liquid": ["Pair ID", "For Frame", "/uploads/", "no-power"],
  "sections/main-quiz.liquid": ["quiz-slide-section"],
  "sections/secondary-quiz-slide.liquid": ["quiz-slide-section", "quiz-answer-option", "next-button", "skip-button", "quiz-status"],
  "sections/quiz-progress.liquid": ['id="back-button"', 'id="progress"'],
  "sections/main-collection-product-grid.liquid": ["FacetSortForm", 'id="product-grid"', "ProductCount"],
  "snippets/facets.liquid": ["FacetFiltersForm", "facets__disclosure", "active-facets", "ProductCountDesktop", "mobile-facets"],
  "snippets/card-product.liquid": ["card__heading", "quick-add"],
  "sections/header.liquid": ["header-drawer", "cart-icon-bubble", "header__icon--cart"],
  "layout/theme.liquid": ["tro-tokens.css", "cart-drawer", "global.min.js", "pubsub.js", "quiz.js", "sections 'header-group'"],
};

for (const [file, tokens] of Object.entries(contracts)) {
  test(`${file} keeps its JS/DOM contracts`, () => {
    const source = read(file);
    const missing = tokens.filter((token) => !source.includes(token));
    assert.deepEqual(missing, [], `${file} is missing: ${missing.join(", ")}`);
  });
}

test("business-logic scripts are byte-identical to the pre-redesign theme", () => {
  // sha256 prefixes frozen on commit 34ac3d6. Any edit to these files must be
  // intentional and must bump the hash here.
  const frozen = {
    "assets/power-selector.js": "9daccbf409b13a4f",
    "assets/lens-selector.js": "a384e411156a34eb",
    "assets/product-form.js": "721a0e0eb3584953",
    "assets/quiz.js": "651fb88172e3960e",
    "assets/facets.js": "3ac2fb8423c235fb",
    "assets/cart.js": "992879465c3742fa",
    "assets/cart-drawer.js": "1fd5d3538c31db51",
  };
  for (const [file, hash] of Object.entries(frozen)) {
    const actual = crypto.createHash("sha256").update(read(file)).digest("hex").slice(0, 16);
    assert.equal(actual, hash, `${file} changed (sha256 prefix ${actual})`);
  }
});

test("every section the JSON templates and section groups reference exists", () => {
  // Shopify allows a leading /* ... */ comment in JSON templates; strip it.
  const parse = (file) => JSON.parse(read(file).replace(/^\s*\/\*[\s\S]*?\*\//, ""));
  const files = [
    ...fs.readdirSync(path.join(root, "templates")).filter((f) => f.endsWith(".json")).map((f) => `templates/${f}`),
    ...fs.readdirSync(path.join(root, "sections")).filter((f) => f.endsWith(".json")).map((f) => `sections/${f}`),
  ];
  const types = new Set();
  for (const file of files) for (const s of Object.values(parse(file).sections || {})) types.add(s.type);
  const missing = [...types].filter((type) => !fs.existsSync(path.join(root, "sections", `${type}.liquid`)));
  assert.deepEqual(missing, []);
});

test("every snippet rendered by sections/snippets/layout exists", () => {
  const dirs = ["layout", "sections", "snippets"];
  const missing = new Set();
  for (const dir of dirs) {
    for (const f of fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(".liquid"))) {
      for (const m of read(`${dir}/${f}`).matchAll(/\{%-?\s*render\s+'([^']+)'/g)) {
        if (!fs.existsSync(path.join(root, "snippets", `${m[1]}.liquid`))) missing.add(`${dir}/${f} -> ${m[1]}`);
      }
    }
  }
  assert.deepEqual([...missing], []);
});
