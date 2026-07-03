(function () {
  'use strict';

  var productForm = document.querySelector('product-form[data-is-eyeglass]');
  if (!productForm) return;

  var form = productForm.querySelector('form');
  var modal = document.querySelector('dialog.lens-modal');
  if (!modal || !form) return;

  var sectionId = modal.id.replace('LensSelectorModal-', '');
  var configEl = document.getElementById('LensConfig-' + sectionId);
  var config = configEl ? JSON.parse(configEl.textContent) : { bundles: [] };
  var framePricePaise = parseInt(modal.dataset.framePrice) || 0;

  var propPowerType = document.getElementById('lens-prop-power-type');
  var propLensPackage = document.getElementById('lens-prop-lens-package');
  var propPrescription = document.getElementById('lens-prop-prescription');
  var propPairId = document.getElementById('lens-prop-pair-id');
  var productTitle = document.querySelector('.product__title h1, .product__title h2');
  var frameName = productTitle ? productTitle.textContent.trim() : 'Frame';

  var lensList = document.getElementById('LensList-' + sectionId);
  var rxError = document.getElementById('LensRxError-' + sectionId);
  var rxErrorText = document.getElementById('LensRxErrorText-' + sectionId);
  var priceLabel = document.getElementById('LensPriceLabel-' + sectionId);
  var priceValue = document.getElementById('LensPriceValue-' + sectionId);
  var steps = modal.querySelectorAll('[data-step]');
  var stepIndicators = modal.querySelectorAll('[data-step-indicator]');
  var powerLabel = modal.querySelector('[data-lens-power-label]');

  var powerToggle = document.getElementById('LensPowerToggle-' + sectionId);
  var selectedPowerType = '';
  var selectedBundle = null;

  // ponytail: capture phase so this fires before product-form.js bubble listener
  form.addEventListener('submit', function (e) {
    if (propPowerType.value && propLensPackage.value) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    resetModal();
    modal.showModal();
  }, true);

  // Power type selection
  modal.querySelectorAll('[name="lens-power-type"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      selectedPowerType = this.value;
      if (selectedPowerType === 'Frame Only') {
        addToCart('Frame Only', null, 'N/A');
        return;
      }
      showStep(2);
      renderBundles(getActiveBundles());
    });
  });

  // Low/High power toggle
  if (powerToggle) {
    powerToggle.addEventListener('change', function () {
      renderBundles(getActiveBundles());
    });
  }

  function getActiveBundles() {
    var typeConfig = config[selectedPowerType] || {};
    return powerToggle && powerToggle.checked ? (typeConfig.high || []) : (typeConfig.low || []);
  }

  // Add to Cart with manual prescription
  modal.querySelector('[data-lens-submit]').addEventListener('click', function () {
    var lSph = modal.querySelector('#lens-sph-left').value;
    var rSph = modal.querySelector('#lens-sph-right').value;
    if (!lSph && !rSph) {
      rxErrorText.textContent = 'Please select SPH for at least one eye.';
      rxError.hidden = false;
      return;
    }
    rxError.hidden = true;

    if (lSph) addProp('Left Eye (OS) SPH', lSph);
    if (rSph) addProp('Right Eye (OD) SPH', rSph);
    var lCyl = modal.querySelector('#lens-cyl-left').value;
    var rCyl = modal.querySelector('#lens-cyl-right').value;
    if (lCyl) addProp('Left Eye (OS) CYL', lCyl);
    if (rCyl) addProp('Right Eye (OD) CYL', rCyl);
    var lAxis = modal.querySelector('#lens-axis-left').value;
    var rAxis = modal.querySelector('#lens-axis-right').value;
    if (lAxis) addProp('Left Eye (OS) Axis', lAxis + '\u00B0');
    if (rAxis) addProp('Right Eye (OD) Axis', rAxis + '\u00B0');

    addToCart(selectedPowerType, selectedBundle, 'Manual');
  });

  // Skip prescription -- upload after checkout
  modal.querySelector('[data-lens-skip]').addEventListener('click', function () {
    addToCart(selectedPowerType, selectedBundle, 'Upload After Purchase');
  });

  // Back buttons
  modal.querySelectorAll('[data-lens-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = parseInt(this.dataset.lensBack);
      if (target === 1) {
        modal.querySelectorAll('[name="lens-power-type"]').forEach(function (r) { r.checked = false; });
      }
      showStep(target);
      updatePriceDisplay(null);
    });
  });

  // Close
  modal.querySelector('[data-lens-close]').addEventListener('click', function () {
    modal.close(); resetModal();
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) { modal.close(); resetModal(); }
  });

  function showStep(n) {
    steps.forEach(function (el) {
      el.classList.toggle('lens-modal__step-content--active', parseInt(el.dataset.step) === n);
    });
    stepIndicators.forEach(function (el) {
      var s = parseInt(el.dataset.stepIndicator);
      el.classList.toggle('lens-modal__step--active', s <= n);
      el.classList.toggle('lens-modal__step--done', s < n);
    });
    if (n >= 2 && powerLabel) powerLabel.textContent = selectedPowerType;
  }

  function renderBundles(bundles) {
    if (!bundles.length) {
      lensList.innerHTML = '<div class="lens-modal__empty"><strong>No Lens found</strong><br>Try other lenses</div>';
      return;
    }
    var checkSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    lensList.innerHTML = bundles.map(function (b, i) {
      var total = (framePricePaise / 100) + b.price;
      var features = (b.features || []).map(function (f) {
        return '<span class="lens-modal__badge">' + checkSvg + f + '</span>';
      }).join('');
      return '<div class="lens-modal__lens-card">' +
        '<div class="lens-modal__lens-body">' +
          '<h4 class="lens-modal__lens-name">' + b.name + '</h4>' +
          '<p class="lens-modal__lens-desc">' + (b.description || '') + '</p>' +
          '<div class="lens-modal__badges">' + features + '</div>' +
          '<div class="lens-modal__lens-footer">' +
            '<div><span class="lens-modal__lens-price">' + b.priceDisplay + '</span>' +
            '<span class="lens-modal__total-hint">Total: ' + formatINR(total) + '</span></div>' +
            '<button type="button" class="lens-modal__add-btn" data-bundle-idx="' + i + '">Select</button>' +
          '</div>' +
        '</div></div>';
    }).join('');

    lensList.querySelectorAll('.lens-modal__add-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedBundle = bundles[parseInt(this.dataset.bundleIdx)];
        updatePriceDisplay(selectedBundle);
        if (selectedPowerType === 'Computer') {
          addToCart(selectedPowerType, selectedBundle, 'N/A');
        } else {
          showStep(3);
        }
      });
    });
  }

  function updatePriceDisplay(bundle) {
    if (bundle) {
      var total = (framePricePaise / 100) + bundle.price;
      priceLabel.textContent = 'Frame + Lens';
      priceValue.textContent = formatINR(total);
    } else {
      priceLabel.textContent = 'Frame cost';
      priceValue.textContent = formatINR(framePricePaise / 100);
    }
  }

  function addProp(name, value) {
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'properties[' + name + ']';
    input.value = value;
    input.className = 'lens-dynamic-prop';
    form.appendChild(input);
  }

  var overlay = document.getElementById('LensLoadingOverlay');

  function showOverlay() { if (overlay) overlay.hidden = false; }
  function hideOverlay() { if (overlay) overlay.hidden = true; }

  function addToCart(powerType, bundle, prescription) {
    var pairId = 'P' + Date.now();
    propPowerType.value = powerType;
    propLensPackage.value = bundle ? bundle.name : 'No Lens';
    propPrescription.value = prescription;
    propPairId.value = bundle && bundle.variantId ? pairId : '';
    modal.close();

    if (bundle && bundle.variantId) {
      showOverlay();
      fetch(window.routes.cart_add_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(bundle.variantId),
          quantity: 1,
          properties: { 'Pair ID': pairId, 'For Frame': frameName }
        })
      }).finally(function () {
        submitAndClearProps();
      });
    } else {
      submitAndClearProps();
    }
  }

  // ponytail: submit form then clear props so next click reopens modal
  function submitAndClearProps() {
    form.requestSubmit();
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      var unsub = subscribe(PUB_SUB_EVENTS.cartUpdate, function () {
        propPowerType.value = '';
        propLensPackage.value = '';
        propPrescription.value = '';
        propPairId.value = '';
        form.querySelectorAll('.lens-dynamic-prop').forEach(function (el) { el.remove(); });
        unsub();
      });
    }
  }

  function resetModal() {
    showStep(1);
    modal.querySelectorAll('input[type="radio"]').forEach(function (r) { r.checked = false; });
    if (powerToggle) powerToggle.checked = false;
    rxError.hidden = true;
    lensList.innerHTML = '';
    selectedPowerType = '';
    selectedBundle = null;
    propPowerType.value = '';
    propLensPackage.value = '';
    propPrescription.value = '';
    propPairId.value = '';
    form.querySelectorAll('.lens-dynamic-prop').forEach(function (el) { el.remove(); });
    updatePriceDisplay(null);
    modal.querySelectorAll('.lens-modal__rx-select, .lens-modal__rx-input').forEach(function (el) { el.value = ''; });
  }

  function populateSPH(select) {
    for (var i = 24; i >= -36; i--) {
      var val = (i * 0.25).toFixed(2);
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = i > 0 ? '+' + val : val;
      select.appendChild(opt);
    }
  }

  function populateCYL(select) {
    for (var i = -1; i >= -16; i--) {
      var val = (i * 0.25).toFixed(2);
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    }
  }

  modal.querySelectorAll('[data-rx-field="sph"]').forEach(populateSPH);
  modal.querySelectorAll('[data-rx-field="cyl"]').forEach(populateCYL);

  function formatINR(amount) {
    return '\u20B9' + Math.round(amount).toLocaleString('en-IN');
  }

  // ponytail: remove orphaned lens items when their paired frame is removed, batch removal
  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
      hideOverlay();
      if (event.source === 'lens-cleanup') return;
      fetch(window.routes.cart_url + '.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          var framePairIds = {};
          var orphanKeys = [];
          cart.items.forEach(function (item) {
            var pid = item.properties && item.properties['Pair ID'];
            if (!pid) return;
            if (item.properties['For Frame']) {
              orphanKeys.push({ key: item.key, pairId: pid });
            } else {
              framePairIds[pid] = true;
            }
          });
          var toRemove = orphanKeys.filter(function (lens) { return !framePairIds[lens.pairId]; });
          if (!toRemove.length) return;

          showOverlay();
          // ponytail: batch via Shopify /cart/update.js with updates object
          var updates = {};
          toRemove.forEach(function (lens) { updates[lens.key] = 0; });
          fetch(window.routes.cart_update_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: updates })
          }).then(function () {
            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'lens-cleanup' });
          });
        });
    });
  }
})();
