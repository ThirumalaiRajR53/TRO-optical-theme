// Mock Shopify objects for rendering the TRO theme locally (verification only; never shipped)
const IMG = '/img/';
let mediaId = 100;
export function img(file, width, height, alt = '') {
  const o = { id: ++mediaId, src: IMG + file, width, height, aspect_ratio: width / height, alt, media_type: 'image', position: mediaId, 'attached_to_variant?': false, toString() { return this.src; } };
  Object.defineProperty(o, 'preview_image', { value: o, enumerable: false });
  return o;
}

export const ROUTES = { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', predictive_search_url: '/search/suggest', search_url: '/search', account_url: '/account', account_login_url: '/account/login', account_logout_url: '/account/logout', account_register_url: '/account/register', account_addresses_url: '/account/addresses', account_recover_url: '/account/recover', collections_url: '/collections', all_products_collection_url: '/collections/all', product_recommendations_url: '/recommendations/products' };

function variant(p, id, title, price, compare, opts = [], extra = {}) {
  const v = { id, title, price, compare_at_price: compare, available: true, inventory_management: 'shopify', inventory_policy: 'deny', inventory_quantity: 12, sku: `SKU-${id}`, barcode: '', url: `${p.url}?variant=${id}`, featured_media: null, options: opts, option1: opts[0], option2: opts[1], option3: opts[2], quantity_rule: { min: 1, max: null, increment: 1 }, store_availabilities: [], unit_price_measurement: null, requires_shipping: true, taxable: true, weight: 0, ...extra };
  Object.defineProperty(v, 'product', { value: p, enumerable: false });
  return v;
}

export function product({ handle, title, vendor, type, tags, price, compare = null, images, options = null, metafields = {}, description, available = true }) {
  const p = { handle, title, vendor, type, tags, url: `/products/${handle}`, id: Math.abs(hash(handle)), description: description || `<p>${title} from ${vendor}. Crafted for all-day comfort and clear vision. Comes with a protective case and microfiber cloth.</p>`, content: '', available, media: images, images, featured_media: images[0], featured_image: images[0], first_available_variant: null, gift_card_q: false, requires_selling_plan: false, selling_plan_groups: [], collections: [], template_suffix: '' };
  p.metafields = { custom: Object.fromEntries(Object.entries(metafields).map(([k, v]) => [k, { value: v }])), reviews: { rating: { value: null }, rating_count: 0 } };
  if (!options) {
    p.has_only_default_variant = true;
    p.options = ['Title'];
    p.options_with_values = [{ name: 'Title', position: 1, values: ['Default Title'], selected_value: 'Default Title' }];
    p.variants = [variant(p, p.id + 1, 'Default Title', price, compare, ['Default Title'])];
  } else {
    p.has_only_default_variant = false;
    p.options = options.map((o) => o.name);
    p.options_with_values = options.map((o, i) => ({ name: o.name, position: i + 1, values: o.values, selected_value: o.values[0] }));
    // combos of first two options
    const combos = [];
    const a = options[0].values, b = options[1] ? options[1].values : [null];
    a.forEach((va) => b.forEach((vb) => combos.push([va, vb].filter(Boolean))));
    p.variants = combos.map((c, i) => variant(p, p.id + 1 + i, c.join(' / '), price + i * 5000, compare ? compare + i * 5000 : null, c, { available: !(i === combos.length - 1 && combos.length > 2) }));
  }
  p.options_by_name = Object.fromEntries(p.options_with_values.map((o) => [o.name, o]));
  p.selected_or_first_available_variant = p.variants[0];
  p.selected_variant = null;
  p.first_available_variant = p.variants[0];
  p.price = price; p.price_min = price; p.price_max = p.variants[p.variants.length - 1].price; p.price_varies = p.variants.length > 1; p.compare_at_price = compare; p.compare_at_price_min = compare; p.compare_at_price_max = compare; p.compare_at_price_varies = false;
  p.quantity_price_breaks_configured_q = false;
  return p;
}
function hash(s) { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }

const frameSpecs = (shape, material = 'Metal') => ({ frame_width: 140, bridge_width: 18, temple_length: 145, lens_width: 55, lens_height: 40, frame_material: material, frame_shape: shape, frame_weight: 24, lens_type_compatibility: ['Single Vision', 'Progressive', 'Bifocal'] });

export const P = {};
P.police = product({ handle: 'police-vplv94k55531fr-police-square-matte-black-full-rimmed-eyeglasses-men', title: 'POLICE Square Matte Black Full-Rimmed Eyeglasses - Men', vendor: 'POLICE', type: 'Eyeglasses', tags: ['Eyeglasses', 'Matte Black', 'Men', 'no-boxes', 'Rimless', 'Square'], price: 981800, compare: 1155000, images: [img('VPLV94K55531FR1.png', 1024, 768, 'POLICE Square Matte Black'), img('black-glasses-frames-sit-up-on-surface.jpg', 1400, 933), img('young-woman-in-shades-looking-into-the-distance.jpg', 1400, 933), img('VPLV94K55531FR1.png', 1024, 768)], metafields: frameSpecs('Square') });
P.idee = product({ handle: 'idee-butterfly-burgundy-full-rimmed-eyeglasses-women', title: 'IDEE Butterfly Burgundy Full-Rimmed Eyeglasses - Women', vendor: 'IDEE', type: 'Eyeglasses', tags: ['Eyeglasses', 'Burgundy', 'Women', 'no-boxes', 'Full-Rimmed', 'Cat Eye'], price: 429000, images: [img('ID2333C4FR1.png', 1024, 768, 'IDEE Butterfly Burgundy'), img('black-glasses-frames-sit-up-on-surface.jpg', 1400, 933)], options: [{ name: 'Color', values: ['Burgundy', 'Matte Black', 'Rose Gold'] }, { name: 'Size', values: ['Medium', 'Large'] }], metafields: frameSpecs('Cat Eye', 'Acetate') });
P.ideeKids = product({ handle: 'idee-young-round-translucent-full-rimmed-eyeglasses-kids', title: 'IDEE-YOUNG Round Translucent Full-Rimmed Eyeglasses - Kids', vendor: 'IDEE-YOUNG', type: 'Eyeglasses', tags: ['Eyeglasses', 'Kids', 'no-boxes', 'Full-Rimmed', 'Round'], price: 249000, images: [img('IDY680C6FR1.png', 1024, 768, 'IDEE Young Round')], metafields: frameSpecs('Round', 'TR-90') });
P.sun = product({ handle: 'police-splw11k53300sg-police-square-color-full-rimmed-sunglasses-men', title: 'POLICE Square Black Full-Rimmed Sunglasses - Men', vendor: 'POLICE', type: 'Sunglasses', tags: ['Sunglasses', 'Black', 'Men', 'Full-Rimmed', 'Square'], price: 1149000, compare: 1352000, images: [img('black-sunglasses-in-a-pile-of-grey-stones.jpg', 1400, 1550, 'POLICE sunglasses'), img('summer-sunglasses.jpg', 1400, 2100)], metafields: frameSpecs('Square') });
P.biofinity = product({ handle: 'coopervision-biofinity-xr-toric-monthly', title: 'CooperVision Biofinity XR Toric (High Power) Monthly Silicone Hydrogel Contact Lens', vendor: 'CooperVision', type: 'Contact Lens', tags: ['Contact Lens', 'Monthly', 'power-required'], price: 365000, images: [img('34CooperVisionBiofinityXRMonthlySiliconeHydrogelContactLens.jpg', 1400, 1400, 'Biofinity XR Toric'), img('lens-ball-trees-lookup.jpg', 1400, 933)], options: [{ name: 'Pack Size', values: ['3 Lens', '6 Lens'] }], metafields: { base_curve: '8.7', diameter: '14.5', water_content: '48', dk_value: '116', lens_material: 'Comfilcon A', replacement_schedule: 'Monthly', wear_type: 'Daily wear', uv_protection: 'false', available_pack_sizes: ['3 Lens', '6 Lens'], power_values: { sph: { min: -10, max: 8, step: 0.25 }, cyl: ['-0.75', '-1.25', '-1.75', '-2.25'], cylForZeroSph: ['-2.25', '-2.75'], axis: ['10', '20', '60', '70', '80', '90', '100', '110', '120', '160', '170', '180'] } } });
P.acuvue = product({ handle: 'acuvue-vita-monthly-contact-lens-bc-8-80mm-dia-14-0mm', title: 'Acuvue Vita Monthly Contact Lens (BC 8.80mm, DIA 14.0mm)', vendor: 'Acuvue', type: 'Contact Lens', tags: ['Contact Lens', 'Monthly', 'only-spherical', 'power-required'], price: 262500, images: [img('9DailiesTotal1DailyContactLens.jpg', 435, 495, 'Acuvue Vita')], options: [{ name: 'Pack Size', values: ['6 Lens'] }, { name: 'Type', values: ['Monthly Spherical'] }], metafields: { base_curve: '8.8', diameter: '14.0', water_content: '41', dk_value: '147', lens_material: 'Senofilcon C', replacement_schedule: 'Monthly', wear_type: 'Daily wear', uv_protection: 'true', power_values: { sph: ['-12.00', '-11.50', '-11.00', '-10.50', '-10.00', '-9.50', '-9.00', '-8.50', '-8.00', '-7.50', '-7.00', '-6.50', '-6.00', '-5.75', '-5.50', '-5.25', '-5.00', '-4.75', '-4.50', '-4.25', '-4.00', '-3.75', '-3.50', '-3.25', '-3.00', '-2.75', '-2.50', '-2.25', '-2.00', '-1.75', '-1.50', '-1.25', '-1.00', '-0.75', '-0.50', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.50', '+3.00', '+3.50', '+4.00', '+4.50', '+5.00', '+5.50', '+6.00'] } } });
P.celebration = product({ handle: 'celebration-colors-yearly-contact-lens-peppy-brown-salsa-gray', title: 'Celebration Colors Yearly Contact Lens - Peppy Brown / Salsa Gray', vendor: 'Celebration', type: 'Contact Lens', tags: ['Contact Lens', 'only-spherical', 'power-optional', 'Yearly Contact'], price: 168000, images: [img('1FreshlookCircleColorDailyContactLens.jpg', 1400, 1400, 'Celebration Colors')], options: [{ name: 'Pack Size', values: ['1 Pair'] }, { name: 'Color', values: ['Peppy Brown', 'Salsa Gray'] }], metafields: { base_curve: '8.6', diameter: '14.0', water_content: '38', replacement_schedule: 'Yearly', wear_type: 'Daily wear', power_values: { sph: { min: -6, max: 0, step: 0.25 } } } });
P.renu = product({ handle: 'renu-fresh-multi-purpose-solution-360ml', title: 'Bausch+Lomb ReNu Fresh Multi-Purpose Solution 360 ml', vendor: 'Bausch+Lomb', type: 'Accessories', tags: ['Accessories', 'Lens Care'], price: 55000, images: [img('long-tied-choker-necklace.jpg', 1400, 2097, 'ReNu solution')] });
P.freshOne = product({ handle: 'freshlook-oneday-daily', title: 'Freshlook One Day Daily Color Contact Lens', vendor: 'Alcon', type: 'Contact Lens', tags: ['Contact Lens', 'Daily Contact', 'only-spherical', 'power-optional'], price: 99000, images: [img('2FreshlookOneDayDailyColorContactLens.png', 550, 550, 'Freshlook One Day')], options: [{ name: 'Pack Size', values: ['10 Lens'] }, { name: 'Color', values: ['Blue', 'Green', 'Grey', 'Pure Hazel'] }] });
P.dailies = product({ handle: 'dailies-total1-daily', title: 'Dailies Total 1 Daily Contact Lens', vendor: 'Alcon', type: 'Contact Lens', tags: ['Contact Lens', 'only-spherical', 'power-required'], price: 363000, images: [img('9DailiesTotal1DailyContactLens.jpg', 435, 495, 'Dailies Total 1')], options: [{ name: 'Pack Size', values: ['30 Lens'] }] });
P.aspirePro = product({ handle: 'coopervision-aspire-pro-toric-monthly', title: 'CooperVision Aspire Pro Toric Monthly Silicone Hydrogel Contact Lens', vendor: 'CooperVision', type: 'Contact Lens', tags: ['Contact Lens', 'Monthly', 'power-required'], price: 179500, images: [img('28CooperVisionAspireProToricMonthlySiliconeHydrogelContactLens.png', 1080, 1080, 'Aspire Pro Toric')] });
P.aspireAir = product({ handle: 'coopervision-aspire-air-toric-monthly', title: 'CooperVision Aspire Air Toric Monthly Silicone Hydrogel Contact Lens', vendor: 'CooperVision', type: 'Contact Lens', tags: ['Contact Lens', 'Monthly', 'power-required'], price: 129500, images: [img('29CooperVisionAspireAirToricMonthlySiliconeHydrogelContactLens.png', 1080, 1080, 'Aspire Air Toric')] });
P.biomedics = product({ handle: 'coopervision-biomedics-now-monthly', title: 'CooperVision Biomedics Now Monthly Hydrogel Contact Lens', vendor: 'CooperVision', type: 'Contact Lens', tags: ['Contact Lens', 'Monthly', 'only-spherical', 'power-required'], price: 140000, images: [img('27CooperVisionBiomedicsNowMonthlyHydrogelContactLens.jpg', 1400, 880, 'Biomedics Now')] });
P.biofinityPlain = product({ handle: 'coopervision-biofinity-xr-monthly', title: 'CooperVision Biofinity XR Monthly Silicone Hydrogel Contact Lens', vendor: 'CooperVision', type: 'Contact Lens', tags: ['Contact Lens', 'Monthly', 'only-spherical', 'power-required'], price: 339500, compare: 340000, images: [img('34CooperVisionBiofinityXRMonthlySiliconeHydrogelContactLens.jpg', 1400, 1400, 'Biofinity XR')] });

const gridProducts = [P.police, P.idee, P.ideeKids, P.sun, P.police, P.idee, P.sun, P.ideeKids];
const newArrivals = [P.idee, P.police, P.ideeKids, P.freshOne, P.dailies, P.aspireAir, P.aspirePro, P.biofinityPlain];
const bestSellers = [P.aspirePro, P.biofinityPlain, P.biofinity, P.biomedics];

function listFilter(label, param, values, activeIdx = []) {
  const vals = values.map(([l, c], i) => ({ label: l, value: l, count: c, active: activeIdx.includes(i), param_name: param, url_to_remove: '/collections/eyeglasses', url_to_add: `/collections/eyeglasses?${param}=${encodeURIComponent(l)}` }));
  return { label, param_name: param, type: 'list', presentation: 'text', operator: 'OR', values: vals, active_values: vals.filter((v) => v.active), inactive_values: vals.filter((v) => !v.active), url_to_remove: '/collections/eyeglasses', false_value: null, true_value: null, min_value: null, max_value: null, range_max: null };
}
export function collection({ handle, title, description, image, products, activeFilters = false, productsCount = 48, allCount = 470 }) {
  return {
    handle, title, description, image, url: `/collections/${handle}`, id: Math.abs(hash(handle)),
    products, products_count: productsCount, all_products_count: allCount, results_count: null, terms: null,
    sort_by: 'best-selling', default_sort_by: 'manual',
    sort_options: ['manual', 'best-selling', 'title-ascending', 'title-descending', 'price-ascending', 'price-descending', 'created-ascending', 'created-descending'].map((v) => ({ value: v, name: { manual: 'Featured', 'best-selling': 'Best selling', 'title-ascending': 'Alphabetically, A-Z', 'title-descending': 'Alphabetically, Z-A', 'price-ascending': 'Price, low to high', 'price-descending': 'Price, high to low', 'created-ascending': 'Date, old to new', 'created-descending': 'Date, new to old' }[v] })),
    filters: [
      { label: 'Availability', param_name: 'filter.v.availability', type: 'boolean', presentation: 'text', operator: 'OR', values: [{ label: 'In stock', value: '1', count: 440, active: false, param_name: 'filter.v.availability' }, { label: 'Out of stock', value: '0', count: 30, active: false, param_name: 'filter.v.availability' }], active_values: [], inactive_values: [], url_to_remove: '/collections/eyeglasses', false_value: { label: 'Out of stock', value: '0', count: 30, active: false, param_name: 'filter.v.availability' }, true_value: { label: 'In stock', value: '1', count: 440, active: false, param_name: 'filter.v.availability' }, min_value: null, max_value: null },
      { label: 'Price', param_name: 'filter.v.price', type: 'price_range', presentation: 'text', values: [], active_values: [], url_to_remove: '/collections/eyeglasses', min_value: { param_name: 'filter.v.price.gte', value: activeFilters ? 2500 : null }, max_value: { param_name: 'filter.v.price.lte', value: activeFilters ? 8000 : null }, range_max: 3500000 },
      listFilter('Brand', 'filter.p.vendor', [['POLICE', 140], ['IDEE', 120], ['FILA', 60], ['IRUS', 40], ['IDEE-YOUNG', 30], ['IDEE-KIDS', 20]], activeFilters ? [0] : []),
      listFilter('Color', 'filter.p.m.custom.color', [['Black', 90], ['Matte Black', 60], ['Gunmetal', 40], ['Havana', 35], ['Gold / Metallic', 30], ['Rose Gold', 20], ['Burgundy', 18], ['Blue', 15], ...(process.env.FACET_EDGE ? [['Crystal', 1], ['Tortoise', 0], ['Ivory', 3], ['Olive', 2], ['Navy', 5], ['Ruby', 1]] : []), ['Tortoise', 14], ['Grey', 12], ['Olive / Khaki Green', 6]]),
      listFilter('Shape', 'filter.p.m.custom.shape', [['Square', 150], ['Rectangle', 110], ['Round', 80], ['Aviator', 40], ['Cat Eye', 30], ['Oval', 20], ['Pentagon', 8], ['Wayfarer', 0]], activeFilters ? [1] : []),
      listFilter('Gender', 'filter.p.m.custom.gender', [['Men', 200], ['Women', 160], ['Unisex', 70], ['Kids', 25], ['Teens', 15]]),
      listFilter('Rim type', 'filter.p.m.custom.rim_type', [['Full-Rimmed', 300], ['Semi-Rimmed', 100], ['Rimless', 70]], activeFilters ? [0] : []),
    ],
  };
}
export const C = {};
C.eyeglasses = collection({ handle: 'eyeglasses', title: 'Eyeglasses', description: '<p>Prescription-ready frames from IDEE, POLICE, FILA and IRUS — every pair fitted with lenses by our in-store opticians.</p>', image: img('black-glasses-frames-sit-up-on-surface.jpg', 1400, 933, 'Eyeglasses'), products: gridProducts });
C.mens = collection({ handle: 'mens-eyeglasses', title: "Men's Eyeglasses", description: '<p>Prescription-ready frames for men from IDEE, POLICE, FILA and IRUS.</p>', image: img('black-glasses-frames-sit-up-on-surface.jpg', 1400, 933, "Men's"), products: gridProducts, activeFilters: true, productsCount: 23 });
C.sunglasses = collection({ handle: 'sunglasses', title: 'Sunglasses', description: '', image: img('summer-sunglasses.jpg', 1400, 2100), products: [P.sun, P.police, P.sun] });
C['new-arrivals'] = collection({ handle: 'new-arrivals', title: 'New Arrivals', description: '', image: null, products: newArrivals });
C['best-sellers'] = collection({ handle: 'best-sellers', title: 'Best Sellers', description: '', image: null, products: bestSellers });
C['contact-lenses'] = collection({ handle: 'contact-lenses', title: 'Contact Lenses', description: '', image: img('lens-ball-trees-lookup.jpg', 1400, 933), products: [P.biofinity, P.acuvue, P.celebration, P.freshOne] });
C['womens-eyeglasses'] = collection({ handle: 'womens-eyeglasses', title: "Women's Eyeglasses", description: '', image: img('purple-retro-sunglasses-lay-on-a-open-novel-in-the-sunshine.jpg', 1400, 913), products: [P.idee] });
C['kids-eyeglasses'] = collection({ handle: 'kids-eyeglasses', title: 'Kids Eyeglasses', description: '', image: img('IDY680C6FR1.png', 1024, 768), products: [P.ideeKids] });
C['featured-collection'] = C['new-arrivals'];
C.all = C.eyeglasses;
export const collectionByHandle = (h) => C[h] || null;

export function cartItem(p, variantIdx, qty, properties, index) {
  const v = p.variants[variantIdx] || p.variants[0];
  return { key: `${v.id}:${index}`, index: index - 1, id: v.id, product: p, variant: v, product_id: p.id, variant_id: v.id, title: p.has_only_default_variant ? p.title : `${p.title} - ${v.title}`, product_title: p.title, variant_title: v.title, url: p.url, image: p.featured_media, quantity: qty, properties, original_price: v.price, final_price: v.price, original_line_price: v.price * qty, final_line_price: v.price * qty, line_level_discount_allocations: [], line_level_total_discount: 0, options_with_values: p.has_only_default_variant ? [] : p.options_with_values.map((o, i) => ({ name: o.name, value: v.options[i] })), product_has_only_default_variant: p.has_only_default_variant, unit_price_measurement: null, requires_shipping: true, selling_plan_allocation: null, discounts: [], message: '', vendor: p.vendor, error_message: '' };
}
const lensPackage = product({ handle: 'lens-package', title: 'Lens Package', vendor: 'The Rajhan Opticals', type: 'Lens', tags: [], price: 160000, images: [img('lens-ball-trees-lookup.jpg', 1400, 933, 'Lens package')], options: [{ name: 'Bundle', values: ['BlueGuard +'] }] });
export function cart(empty = false) {
  if (empty) return { item_count: 0, items: [], total_price: 0, items_subtotal_price: 0, original_total_price: 0, total_discount: 0, cart_level_discount_applications: [], note: '', attributes: {}, taxes_included: false, currency: { iso_code: 'INR', symbol: '₹' }, requires_shipping: true, checkout_charge_amount: 0, duties_included: false, discount_applications: [] };
  const items = [
    cartItem(P.idee, 0, 1, { 'Power Type': 'Single Vision', 'Lens Package': 'BlueGuard +', 'Prescription': 'Manual', 'Pair ID': 'P1730000000000', 'Left Eye (OS) SPH': '-2.50', 'Right Eye (OD) SPH': '-3.00', 'Left Eye (OS) CYL': '-0.75', 'Left Eye (OS) Axis': '180°' }, 1),
    cartItem(lensPackage, 0, 1, { 'Pair ID': 'P1730000000000', 'For Frame': 'IDEE Butterfly Burgundy Full-Rimmed Eyeglasses - Women' }, 2),
    cartItem(P.biofinityPlain, 0, 2, { 'Left Eye (OS) SPH': '-2.50', 'Left Eye (OS) Boxes': '2', 'Right Eye (OD) SPH': '', 'Right Eye (OD) Boxes': '' }, 3),
  ];
  const total = items.reduce((s, i) => s + i.final_line_price, 0);
  return { item_count: items.reduce((s, i) => s + i.quantity, 0), items, total_price: total, items_subtotal_price: total, original_total_price: total, total_discount: 0, cart_level_discount_applications: [], note: '', attributes: {}, taxes_included: false, currency: { iso_code: 'INR', symbol: '₹' }, requires_shipping: true, checkout_charge_amount: total, duties_included: false, discount_applications: [] };
}

const link = (title, url, links = [], extra = {}) => ({ title, url, links, levels: links.length ? (links.some((l) => l.links && l.links.length) ? 2 : 1) : 0, handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), current: false, child_active: false, child_current: false, type: 'collection_link', object: null, ...extra });
export const MENUS = {
  'main-menu': { title: 'Main menu', handle: 'main-menu', levels: 2, links: [
    link('Home', '/'),
    link('Eyeglasses', '/collections/eyeglasses', [link("Men's Eyeglasses", '/collections/mens-eyeglasses'), link("Women's Eyeglasses", '/collections/womens-eyeglasses'), link('Kids Eyeglasses', '/collections/kids-eyeglasses'), link('Blue Light Glasses [NEW]', '/collections/blue-light-glasses'), link('Titanium Frames', '/collections/titanium-frames')]),
    link('Sunglasses', '/collections/sunglasses', [link("Men's Sunglasses", '/collections/mens-sunglasses'), link("Women's Sunglasses", '/collections/womens-sunglasses'), link('Polarized [SALE]', '/collections/polarized-sunglasses')]),
    link('Contact Lenses', '/collections/contact-lenses', [link('Daily Disposable', '/collections/daily-contacts'), link('Monthly', '/collections/monthly-contacts'), link('Toric', '/collections/toric-contacts'), link('Colored Lenses', '/collections/colored-contacts'), link('Lens Care', '/collections/lens-care')]),
    link('Reading Glasses', '/collections/reading-glasses'),
    link('Brands', '/collections/all'),
  ] },
  footer: { title: 'Footer', handle: 'footer', levels: 1, links: [link('Our Story', '/pages/about-us'), link('Blogs', '/blogs/articles'), link('Search', '/search')] },
};

export const SHOP = { name: 'The Rajhan Opticals', email: 'support@rajhanopticals.com', phone: '+91-9791020440', domain: 'therajhanopticals.com', url: 'https://therajhanopticals.com', secure_url: 'https://therajhanopticals.com', currency: 'INR', money_format: 'Rs. {{amount}}', customer_accounts_enabled: true, customer_accounts_optional: true, enabled_payment_types: [], policies: [{ title: 'Privacy policy', url: '/policies/privacy-policy' }, { title: 'Refund policy', url: '/policies/refund-policy' }, { title: 'Terms of service', url: '/policies/terms-of-service' }], shipping_policy: { body: '', url: '/policies/shipping-policy' }, privacy_policy: { body: '<p>Privacy</p>', url: '/policies/privacy-policy', title: 'Privacy policy' }, refund_policy: { body: '', url: '/policies/refund-policy' }, terms_of_service: { body: '', url: '/policies/terms-of-service' }, address: { summary: '65/30, 7th Avenue, Ashok Nagar, Chennai 600083' }, metafields: {}, types: ['Eyeglasses', 'Sunglasses', 'Contact Lens'], vendors: ['IDEE', 'POLICE', 'FILA', 'IRUS'], brand: null };

const article = (handle, title, excerpt, image, date, tags = ['Guides']) => ({ handle, title, excerpt, excerpt_or_content: excerpt, content: `<p>${excerpt}</p><h2>The columns</h2><p>SPH is the main power, CYL corrects astigmatism and Axis gives its orientation. ADD is the extra near power for progressive or bifocal lenses.</p><blockquote>OS is your left eye, OD your right. On our product pages we spell both out.</blockquote><h2>Low or high power?</h2><p>In our lens selector, low power covers SPH −6 to +6 and CYL up to −4. If you're unsure, bring your prescription to any of our four Chennai stores and we'll check it for free.</p>`, image, url: `/blogs/articles/${handle}`, published_at: new Date(date), created_at: new Date(date), updated_at: new Date(date), author: 'TRO Opticians', user: { first_name: 'TRO', last_name: 'Opticians' }, tags, comments_enabled_q: false, moderated_q: false, comments_count: 0, comments: [], id: Math.abs(hash(handle)) });
export const ARTICLES = [
  article('how-to-read-your-eyeglass-prescription', 'How to read your eyeglass prescription', 'SPH, CYL, Axis and ADD explained in plain language — so you can order lenses with confidence.', img('purple-retro-sunglasses-lay-on-a-open-novel-in-the-sunshine.jpg', 1400, 913, 'Reading glasses on a book'), '2026-10-12'),
  article('which-frame-shape-suits-your-face', 'Which frame shape suits your face?', 'Round, square, oval or heart — a simple way to find frames that balance your features.', img('young-woman-in-shades-looking-into-the-distance.jpg', 1400, 933), '2026-09-28', ['Style']),
  article('daily-vs-monthly-contact-lenses', 'Daily vs monthly contact lenses', 'Comfort, cost and care routines compared, with our opticians\u2019 recommendations.', img('lens-ball-trees-lookup.jpg', 1400, 933), '2026-09-09', ['Contact lenses']),
  article('blue-light-lenses-what-the-evidence-says', 'Blue light lenses: what the evidence says', 'What blue-filter coatings do, who benefits, and when a computer lens is the better choice.', img('black-glasses-frames-sit-up-on-surface.jpg', 1400, 933), '2026-08-21', ['Lenses']),
];
export const BLOG = { title: 'Journal', handle: 'articles', url: '/blogs/articles', articles: ARTICLES, articles_count: ARTICLES.length, all_tags: ['Guides', 'Style', 'Contact lenses', 'Lenses'], comments_enabled_q: false, moderated_q: false };
export const PAGES = { 'about-us': { title: 'Our Story', handle: 'about-us', url: '/pages/about-us', content: '<p>Founded in 1956 in Ashok Nagar, The Rajhan Opticals has served three generations of Chennai families.</p>' }, contact: { title: 'Contact us', handle: 'contact', url: '/pages/contact', content: '<p>Visit any of our four stores or write to us — we reply within one working day.</p>' }, 'find-your-best-match': { title: 'Find your best match', handle: 'find-your-best-match', url: '/pages/find-your-best-match', content: '' } };
