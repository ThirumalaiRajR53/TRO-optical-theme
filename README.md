# TRO Optical -- Store Handover & Maintenance Guide

**Store:** The Rajhan Opticals (TRO)
**Established:** 1956 -- "70 Years of Clear Vision"
**Location:** 65/30, 7th Avenue, Ashok Nagar, Chennai - 600083
**Phone:** +91-9791020440
**Email:** support@rajhanopticals.com
**Instagram:** [@therajhan](https://www.instagram.com/therajhan/)

---

## Table of Contents

1. [Store & Theme Overview](#1-store--theme-overview)
2. [Product Tag System](#2-product-tag-system)
3. [Tag Combination Matrix](#3-tag-combination-matrix)
4. [Per-Product Power Values (Metafield)](#4-per-product-power-values-metafield)
5. [Adding a New Contact Lens Product](#5-adding-a-new-contact-lens-product)
6. [Adding a New Eyeglass Frame](#6-adding-a-new-eyeglass-frame)
7. [Eyeglass Lens Package Setup](#7-eyeglass-lens-package-setup)
8. [Managing Collections & Navigation](#8-managing-collections--navigation)
9. [Theme Customizer (No-Code Changes)](#9-theme-customizer-no-code-changes)
10. [Cart & Order Behavior](#10-cart--order-behavior)
11. [Key Custom Files Reference](#11-key-custom-files-reference)
12. [Deployment & Code Changes](#12-deployment--code-changes)
13. [Known Gotchas](#13-known-gotchas)

---

## 1. Store & Theme Overview

| Item | Detail |
|------|--------|
| Theme base | [PoloThemes Eye Cart](https://docs.polothemes.com/docs/category/eye-cart-shopify/) (Shopify Dawn-derived) |
| Theme version | TRO Optical v2.0.9 |
| Cart type | Drawer (slides in from the right) |
| Languages | English (default), Spanish |
| CSS framework | Tailwind CSS v3.4.3 (classes prefixed `twcss-`) |
| JavaScript | Vanilla JS -- no React/Vue/npm build step |
| Templating | Shopify Liquid + JSON templates (Online Store 2.0) |

The theme uses **product tags** to control which purchase UI appears (power selector vs. lens modal vs. standard add-to-cart), and **metafields** to store per-product data (power ranges, frame specs, contact lens specs).

---

## 2. Product Tag System

There are four product tags that control how a product page behaves. Tags are added in **Shopify Admin > Products > [product] > Tags**.

### Primary Tags (pick one)

| Tag | What it does |
|-----|-------------|
| `power-required` | Shows the inline prescription power selector. Customer **must** enter SPH/CYL/Axis values. No "No Power" option. Hides the standard quantity selector (quantity is calculated from box counts). |
| `power-optional` | Same as above, but includes a **"No Power"** option in the SPH dropdown for plano/cosmetic purchases. |

### Modifier Tags (combine with a primary tag)

| Tag | What it does |
|-----|-------------|
| `only-spherical` | Hides the CYL and Axis dropdowns. Only SPH (+ Boxes) is shown. Use for spherical-only contact lenses that don't need cylinder/axis values. |
| `no-boxes` | Hides the per-eye box quantity selectors. Routes the product to the **eyeglass lens selector modal** (3-step wizard) instead of the inline power selector. The standard Shopify quantity selector stays visible. |

### Priority Rules

- If a product has **both** `power-required` and `power-optional`, `power-required` wins.
- `only-spherical` and `no-boxes` are independent modifiers -- they can be added alongside either primary tag.
- If `no-boxes` is present, the inline power selector **never** appears -- the lens modal takes over, regardless of other tags.

### Legacy Fallbacks (no tags needed)

These older methods still work for backward compatibility:

| Trigger | Behaves like |
|---------|-------------|
| Metafield `custom.requires_power` set to `true` | `power-required` |
| Product has a variant option named `Pack Size` | `power-optional` |

---

## 3. Tag Combination Matrix

This is the complete reference for which tags to apply to each product type.

| Tags | Product Type (Example) | What the Customer Sees | Fields Shown |
|------|----------------------|----------------------|--------------|
| `power-required` | Toric contact lens (BioTrue Toric) | Inline power selector, prescription required | SPH + CYL + Axis + Boxes (per eye) |
| `power-optional` | Colored/plano contacts (Celebration Colors) | Inline power selector with "No Power" option | SPH (+ No Power) + CYL + Axis + Boxes (per eye) |
| `power-required` + `only-spherical` | Spherical contact lens (iConnect Daily) | Inline power selector, SPH only | SPH + Boxes (per eye) |
| `power-optional` + `only-spherical` | Optional-power spherical contacts | Inline power selector, SPH with "No Power" | SPH (+ No Power) + Boxes (per eye) |
| `power-required` + `no-boxes` | Prescription eyeglass frame | Lens selector modal (3-step wizard) | Power Type > Lens Bundle > Prescription |
| `power-optional` + `no-boxes` | Frame with optional prescription | Lens selector modal with optional Rx | Power Type > Lens Bundle > Prescription (optional) |
| *(no power tags)* | Accessories (Renu solution, lens case) | Standard add-to-cart button | None -- normal Shopify behavior |

### How Validation Works

- **Contact lenses (inline selector):** Add to Cart is disabled until at least one eye has all required fields filled. The button shows "Select Prescription Details" until valid.
- **Eyeglasses (lens modal):** Add to Cart opens the 3-step modal. The customer must complete all steps before the item is added.
- **No Power selected:** CYL and Axis automatically set to "N/A". Boxes are still required if applicable.

---

## 4. Per-Product Power Values (Metafield)

Each contact lens product can have its own SPH, CYL, and Axis ranges via the `custom.power_values` metafield. If this metafield is empty, the default range is used (SPH: 0.00 to -9.00 in 0.25 steps).

### How to Set It

1. Go to **Shopify Admin > Products > [product]**
2. Scroll to the bottom or click **Metafields**
3. Find `custom.power_values` and paste a JSON value

### JSON Format

**Range-based SPH** (most common -- generates values automatically):

```json
{
  "sph": { "min": -6.00, "max": 0, "step": 0.25 },
  "cyl": ["-0.75", "-1.25", "-1.75"],
  "cylForZeroSph": ["-2.25"],
  "axis": ["10", "20", "60", "90", "180"]
}
```

**Explicit SPH array** (for non-uniform ranges):

```json
{
  "sph": ["-0.50", "-1.00", "-1.50", "-3.00", "-6.00"],
  "cyl": ["-0.75", "-1.25", "-1.75", "-2.25"],
  "axis": ["10", "20", "90", "180"]
}
```

**Positive SPH values** (for farsighted lenses):

```json
{
  "sph": { "min": -6.00, "max": 4.00, "step": 0.25 }
}
```

Positive values automatically display with a `+` sign (e.g. `+1.50`, `+2.00`).

### JSON Fields Reference

| Field | Type | Purpose | Default if omitted |
|-------|------|---------|-------------------|
| `sph` | Object `{min, max, step}` or Array of strings | Sphere power values | `{min: -9, max: 0, step: 0.25}` |
| `cyl` | Array of strings | Cylinder values shown when SPH is not zero | `["-0.75", "-1.25", "-1.75"]` |
| `cylForZeroSph` | Array of strings | Extra CYL options when SPH is exactly 0.00 | `["-2.25"]` |
| `axis` | Array of strings | Axis degree values | `["10", "20", "60", "70", "80", "90", "100", "110", "120", "160", "170", "180"]` |

### Bulk Editing

- **Shopify Bulk Editor:** Select multiple products > Edit > add the `custom.power_values` column
- **CSV Export/Import:** Use the column header `Metafield: custom.power_values [json]` with the JSON as the cell value
- **Matrixify app:** Supports metafield import/export for large catalogs

---

## 5. Adding a New Contact Lens Product

Step-by-step walkthrough in Shopify Admin:

### Step 1: Create the Product

1. Go to **Products > Add product**
2. Fill in: Title, Description, Images, Price, Inventory (SKU, quantity)
3. If the lens comes in pack sizes, add a variant option named accordingly (e.g. "Pack Size" with values like "3 Lenses", "6 Lenses")

### Step 2: Add Tags

1. Scroll down to the **Tags** field on the product page
2. Type the tag name and press **Enter** for each tag
3. Refer to the [Tag Combination Matrix](#3-tag-combination-matrix) to pick the right tags:
   - Toric lens: type `power-required`, press Enter
   - Spherical lens: type `power-required`, Enter, then `only-spherical`, Enter
   - Colored/plano lens: type `power-optional`, Enter

### Step 3: Set Power Values (Metafield)

1. Scroll to the bottom of the product page (or go to **Products > [product] > Metafields**)
2. Find `custom.power_values`
3. Paste the JSON for this product's power range (see [Section 4](#4-per-product-power-values-metafield))
4. If you skip this, the product will use the default range (SPH: 0.00 to -9.00)

### Step 4: Fill Contact Lens Spec Metafields

These metafields appear in the product specifications section on the product page:

| Metafield | Example value |
|-----------|--------------|
| `custom.base_curve` | `8.6` |
| `custom.diameter` | `14.0` |
| `custom.water_content` | `38%` |

### Step 5: Assign to Collection

1. On the product page, find the **Collections** section
2. Add the product to the appropriate collection (e.g. `contact-lenses`)

### Step 6: Save & Preview

1. Click **Save**
2. Click **Preview** to open the product page
3. Verify: the power selector appears, dropdowns show correct values, Add to Cart is gated until prescription is filled

---

## 6. Adding a New Eyeglass Frame

### Step 1: Create the Product

1. Go to **Products > Add product**
2. Fill in: Title, Description, Images, Price
3. Add variants if needed (e.g. Color, Size)

### Step 2: Add Tags

1. In the **Tags** field, add:
   - `power-required` (or `power-optional` for frames that can be bought without a prescription)
   - `no-boxes`
2. This combination routes the product to the lens selector modal

### Step 3: Fill Frame Spec Metafields

| Metafield | Type | Example |
|-----------|------|---------|
| `custom.frame_width` | Integer (mm) | `140` |
| `custom.bridge_width` | Integer (mm) | `18` |
| `custom.temple_length` | Integer (mm) | `145` |
| `custom.lens_width` | Integer (mm) | `52` |
| `custom.lens_height` | Integer (mm) | `40` |
| `custom.frame_material` | Text | `Acetate` |
| `custom.frame_shape` | Text | `Rectangle` |
| `custom.frame_weight` | Integer (g) | `25` |

### Step 4: Assign to Collection

1. Add to `eyeglasses` or `sunglasses` collection

### Step 5: Save & Preview

1. Click **Save**
2. Preview the product page
3. Verify: clicking Add to Cart opens the lens selector modal (3-step wizard)

---

## 7. Eyeglass Lens Package Setup

The lens selector modal lets customers choose a lens bundle (e.g. Basic, Mid-range, Premium) that gets added to cart alongside the frame. This requires a hidden "Lens Package" product.

### Setup Steps

1. **Create the product:**
   - Go to **Products > Add product**
   - Title: `Lens Package` (or similar)
   - Add 3 variants with prices:
     - Bundle 1: Rs.1,000
     - Bundle 2: Rs.2,000
     - Bundle 3: Rs.3,000
   - Set product status to **Draft** (or remove from all collections/sales channels) so customers cannot find it directly

2. **Get the variant IDs:**
   - Go to **Products > Lens Package**
   - Click on each variant
   - Copy the variant ID from the browser URL (the number after `/variants/`)

3. **Update the code** (requires developer):
   - Open `snippets/lens-selector-modal.liquid`
   - Find the `<script type="application/json" id="LensConfig-...">` block near the bottom
   - Paste each variant ID into the `"variantId"` field for the corresponding bundle

4. **Prescription file uploads:**
   - Install the [Upload-Lift](https://apps.shopify.com/upload-lift) app (or similar) for prescription file attachments
   - Configure it to target the CSS selector `.lens-upload-target`

### Current Bundle Configuration

| Bundle | Price | Features |
|--------|-------|----------|
| Bundle 1 | Rs.1,000 | UV400 Protect, Scratch Resistant |
| Bundle 2 | Rs.2,000 | UV400 Protect, Anti Reflective, Scratch Resistant |
| Bundle 3 | Rs.3,000 | UV400 Protect, Blue Protect, Anti Reflective, Scratch Resistant, Anti Smudge |

---

## 8. Managing Collections & Navigation

### Creating or Editing Collections

1. Go to **Products > Collections**
2. Click **Create collection**
3. Set the title and choose collection type:
   - **Manual:** hand-pick products
   - **Automated:** set conditions (e.g. product tag contains "contact-lens")
4. The collection **handle** (URL slug, shown under the title) must match what's used in the navigation menu

### Updating Navigation Menus

1. Go to **Online Store > Navigation**
2. Click **Main menu**
3. Add, reorder, or remove menu items
4. Each item links to a collection, page, or URL
5. Nested items appear as dropdown/mega-menu children
6. **Important:** The collection handle must exist before you add it to the menu, or the link will 404

### Search & Discovery Filters

1. Go to **Apps > Search & Discovery**
2. Click **Filters**
3. Add filterable fields: Brand, Frame Shape, Material, Price, etc.
4. These use product metafields and tags

### Updating Product Descriptions

1. Go to **Products > [product]**
2. Edit the description in the rich text editor
3. Many products currently have placeholder descriptions -- update these with real product details

---

## 9. Theme Customizer (No-Code Changes)

These changes can be made safely without touching code:

1. Go to **Online Store > Themes > Customize**
2. You can modify:
   - **Logo:** Header section > Logo image
   - **Colors:** Theme settings > Colors
   - **Typography:** Theme settings > Typography
   - **Banner images:** Homepage sections > Slideshow / Image banner
   - **Announcement bar:** Header group > Announcement bar
   - **Footer content:** Footer group > Footer section
   - **Section order:** Drag and drop sections on any page
   - **Legacy banner text:** "Trusted since 1956" strip -- edit text in the Legacy Banner section

Changes here are saved to the theme and do not affect custom code.

---

## 10. Cart & Order Behavior

### Contact Lens Orders

When a customer orders contact lenses, the order line item includes these properties:

| Property | Example Value |
|----------|--------------|
| `Left Eye (OS) SPH` | `-2.50` or `no-power` |
| `Left Eye (OS) CYL` | `-1.25` or `N/A` |
| `Left Eye (OS) Axis` | `180` or `N/A` |
| `Left Eye (OS) Boxes` | `2` |
| `Right Eye (OD) SPH` | `-3.00` |
| `Right Eye (OD) CYL` | `-0.75` |
| `Right Eye (OD) Axis` | `90` |
| `Right Eye (OD) Boxes` | `1` |

- **Quantity** = Left Boxes + Right Boxes (e.g. 2 + 1 = 3)
- The standard quantity selector is hidden; box counts drive the cart quantity
- If `only-spherical`, CYL and Axis properties are omitted entirely

### Eyeglass Orders

When a customer orders eyeglasses through the lens modal:

| Property | Example Value |
|----------|--------------|
| `Power Type` | `Single Vision` |
| `Lens Package` | `Bundle 2` |
| `Prescription` | `Upload after purchase` or `L: -2.50/-1.25x180, R: -3.00/-0.75x90` |

- If a lens bundle with a variant ID is configured, the frame and lens package appear as **two separate line items** in the cart
- If "Frame Only" is selected, no lens package is added

### Viewing Prescription in Orders

1. Go to **Orders > [order]**
2. Click on the line item
3. Prescription details appear under **Additional details** or **Line item properties**

---

## 11. Key Custom Files Reference

These are the files that were custom-built or significantly modified for TRO. If a developer needs to make changes, these are the files to look at.

| File | Purpose |
|------|---------|
| `snippets/buy-buttons.liquid` | **Routing logic** -- reads tags, decides whether to show power selector, lens modal, or standard add-to-cart |
| `snippets/power-selector.liquid` | Contact lens prescription UI -- Left/Right eye dropdowns for SPH, CYL, Axis, Boxes |
| `assets/power-selector.js` | Populates dropdowns from metafield JSON, cascading validation, box-to-quantity sync |
| `assets/component-power-selector.css` | Power selector styling |
| `snippets/lens-selector-modal.liquid` | Eyeglass lens modal -- 3-step wizard (Power Type > Lens Bundle > Prescription) |
| `assets/lens-selector.js` | Modal step navigation, prescription form, cart API multi-add |
| `assets/component-lens-selector.css` | Lens modal styling |
| `sections/main-product.liquid` | Product page section -- quantity selector visibility, CSS preloading |
| `snippets/product-specifications.liquid` | Product specs grid (frame dimensions or contact lens specs from metafields) |
| `snippets/card-product.liquid` | Collection page product cards -- "More Details" link instead of Add to Cart |
| `sections/category-showcase.liquid` | Homepage circular category links |
| `sections/legacy-banner.liquid` | "Trusted Since 1956" heritage strip |

### Files You Should NOT Edit

| File | Reason |
|------|--------|
| `assets/app.css` | Pre-compiled Tailwind output -- changes will be overwritten if Tailwind is rebuilt |
| `config/settings_data.json` | Managed by the theme customizer -- manual edits may be overwritten |
| `templates/*.json` | Managed by the theme editor -- prefer using the Customizer instead |

---

## 12. Deployment & Code Changes

### Downloading the Theme

1. Go to **Online Store > Themes**
2. Click **...** (three dots) on the live theme > **Download theme file**
3. A ZIP file will be emailed to you

### Uploading a Modified Theme

1. Go to **Online Store > Themes**
2. Click **Add theme > Upload ZIP file**
3. Upload the modified ZIP
4. Click **Preview** to test before publishing
5. Once verified, click **Publish**

### Using Shopify CLI (Developer)

```
shopify theme dev --store=your-store.myshopify.com
shopify theme push --store=your-store.myshopify.com
```

### Git Repository

The code is version-controlled in a Git repository:
- **Repo:** `TRO-optical-theme/`
- **Branches:** `main` (stable), `lens_section` (lens feature work)
- **Remote:** [github.com/ThirumalaiRajR53/TRO-optical-theme](https://github.com/ThirumalaiRajR53/TRO-optical-theme)

### Post-Deploy Checklist

After uploading or pushing theme changes, verify:

- [ ] Homepage loads correctly (banners, category showcase, trust badges)
- [ ] A contact lens product page shows the power selector with correct dropdown values
- [ ] An eyeglass product page opens the lens selector modal on Add to Cart click
- [ ] A non-power product (accessory) has a standard Add to Cart button
- [ ] Cart drawer opens and shows prescription line item properties
- [ ] Collection pages show "More Details" links (not Add to Cart buttons)
- [ ] Navigation menu links resolve (no 404s)

---

## 13. Known Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| Homepage shows 404 or blank | `templates/index.json` sections placed at root level instead of inside `"sections": {}` | Ensure all sections are nested inside the `"sections"` object |
| Navigation link 404 | Collection handle doesn't exist yet | Create the collection first, then add the menu item |
| "Trusted Since 1956" appears twice | Both the legacy banner section and footer `brand_headline` setting are populated | Use one or the other, not both |
| Cart page breaks | `main-cart.js` was removed or missing | This file is required while `cart_type` is set to `drawer` |
| Fonts look wrong | Google Fonts CDN link was added manually | Use the Shopify font picker in Theme Settings > Typography instead |
| Power selector shows default range | `custom.power_values` metafield is empty for the product | Add the JSON metafield to the product |
| Lens modal doesn't add lens to cart | `variantId` is empty in the lens config JSON | Set up the hidden Lens Package product and paste variant IDs into `lens-selector-modal.liquid` |

---

## Quick Reference: Which Tags Do I Need?

| I'm adding a... | Tags to use |
|-----------------|-------------|
| Toric/multifocal contact lens | `power-required` |
| Spherical-only contact lens | `power-required`, `only-spherical` |
| Colored/plano contact lens (power optional) | `power-optional` |
| Colored spherical lens (power optional) | `power-optional`, `only-spherical` |
| Prescription eyeglass frame | `power-required`, `no-boxes` |
| Frame with optional prescription | `power-optional`, `no-boxes` |
| Lens care solution, case, accessory | *(no tags needed)* |
