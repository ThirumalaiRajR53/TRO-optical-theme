const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildCollectionUrl,
  createFallbackUrls,
  expandGender,
  isSelectedAnswer,
  shouldHideAnswer,
} = require("../assets/quiz.js");

test("expands adult genders and temporary youth sunglasses fallback", () => {
  assert.deepEqual(expandGender("eyeglasses", "Men"), ["Men", "Unisex"]);
  assert.deepEqual(expandGender("eyeglasses", "Kids"), ["Kids"]);
  assert.deepEqual(expandGender("sunglasses", "Teens"), ["Teens", "Unisex"]);
});

test("builds encoded Shopify filters with repeated OR values", () => {
  const url = new URL(
    buildCollectionUrl({
      collection: "sunglasses",
      gender: "Women",
      shape: "Rectangle|Rectangular",
      color: "Black|Gold / Metallic",
      price: "2500|5000",
    }),
    "https://example.com",
  );

  assert.equal(url.pathname, "/collections/sunglasses");
  assert.deepEqual(url.searchParams.getAll("filter.p.m.custom.gender"), ["Women", "Unisex"]);
  assert.deepEqual(url.searchParams.getAll("filter.p.m.custom.shape"), [
    "Rectangle",
    "Rectangular",
  ]);
  assert.deepEqual(url.searchParams.getAll("filter.p.m.custom.color"), [
    "Black",
    "Gold / Metallic",
  ]);
  assert.equal(url.searchParams.get("filter.v.price.gte"), "2500");
  assert.equal(url.searchParams.get("filter.v.price.lte"), "5000");
});

test("relaxes optional filters in the configured order", () => {
  const urls = createFallbackUrls({
    collection: "eyeglasses",
    gender: "Men",
    vendor: "POLICE",
    color: "Black",
    rim_type: "Full-Rimmed",
    shape: "Square",
    price: "8000|14000",
  }).map((url) => new URL(url, "https://example.com"));

  assert.equal(urls.length, 6);
  assert.equal(urls[0].searchParams.get("filter.p.vendor"), "POLICE");
  assert.equal(urls[1].searchParams.has("filter.p.vendor"), false);
  assert.equal(urls[2].searchParams.has("filter.p.m.custom.color"), false);
  assert.equal(urls[3].searchParams.has("filter.p.m.custom.rim_type"), false);
  assert.equal(urls[4].searchParams.has("filter.p.m.custom.shape"), false);
  assert.equal(urls[5].searchParams.has("filter.v.price.gte"), false);
  assert.deepEqual(urls[5].searchParams.getAll("filter.p.m.custom.gender"), ["Men", "Unisex"]);
});

test("selects an answer by identity when filter values are identical", () => {
  const selected = { answerId: "unsure-face", value: "" };

  assert.equal(isSelectedAnswer(selected, "unsure-face"), true);
  assert.equal(isSelectedAnswer(selected, "oval-face"), false);
});

test("hides collection-specific answers only for that collection", () => {
  assert.equal(shouldHideAnswer("sunglasses", "sunglasses"), true);
  assert.equal(shouldHideAnswer("sunglasses", "eyeglasses"), false);
  assert.equal(shouldHideAnswer("none", "sunglasses"), false);
});
