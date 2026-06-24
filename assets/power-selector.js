(function () {
  'use strict';

  const container = document.getElementById('PowerSelector');
  if (!container) return;

  const formId = container.dataset.formId;
  const powerMode = container.dataset.powerMode || 'optional';
  const showBoxes = container.dataset.showBoxes !== 'false';
  const onlySpherical = container.dataset.onlySpherical === 'true';

  const errorEl = document.getElementById('PowerSelectorError');
  const errorTextEl = document.getElementById('PowerSelectorErrorText');

  // ponytail: per-product config from metafield JSON, hardcoded fallback for products without it
  const DEFAULT_CONFIG = {
    sph: { min: -9, max: 0, step: 0.25 },
    cyl: ['-0.75', '-1.25', '-1.75'],
    cylForZeroSph: ['-2.25'],
    axis: ['10', '20', '60', '70', '80', '90', '100', '110', '120', '160', '170', '180']
  };

  let powerConfig = DEFAULT_CONFIG;
  try {
    const raw = container.dataset.powerValues;
    if (raw) powerConfig = Object.assign({}, DEFAULT_CONFIG, JSON.parse(raw));
  } catch (_) { /* bad JSON — use defaults */ }

  function resolveSphValues(sph) {
    if (Array.isArray(sph)) return sph.map(String);
    var min = Number(sph.min), max = Number(sph.max), step = Math.abs(Number(sph.step)) || 0.25;
    var vals = [];
    // ponytail: iterate from max (least negative / most positive) down to min
    for (var v = max; v >= min - step / 2; v -= step) {
      vals.push(Number(v.toFixed(2)));
    }
    return vals.map(String);
  }

  var sphValues = resolveSphValues(powerConfig.sph);

  function getSelect(eye, field) {
    return document.getElementById(`power-${field}-${eye}`);
  }

  function getHiddenInput(eye, field) {
    return document.getElementById(`prop-${eye}-${field}`);
  }

  function populateSph(eye) {
    const select = getSelect(eye, 'sph');
    if (!select) return;
    // Keep "Select" and optional "No Power" that Liquid already rendered
    sphValues.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = Number(val).toFixed(2);
      select.appendChild(opt);
    });
  }

  function getCylOptions(sphValue) {
    if (sphValue === '0' || sphValue === '0.00') {
      return powerConfig.cylForZeroSph || powerConfig.cyl || [];
    }
    return powerConfig.cyl || [];
  }

  function updateCyl(eye) {
    if (onlySpherical) return;

    const sphSelect = getSelect(eye, 'sph');
    const cylSelect = getSelect(eye, 'cyl');
    const sphValue = sphSelect.value;

    cylSelect.innerHTML = '';

    if (!sphValue) {
      cylSelect.disabled = true;
      cylSelect.innerHTML = '<option value="">Select</option>';
      updateAxis(eye);
      return;
    }

    if (sphValue === 'no-power') {
      cylSelect.disabled = true;
      cylSelect.innerHTML = '<option value="N/A">N/A</option>';
      const hidden = getHiddenInput(eye, 'cyl');
      if (hidden) hidden.value = 'N/A';
      updateAxis(eye);
      return;
    }

    cylSelect.disabled = false;
    var opts = getCylOptions(sphValue);
    // Prepend empty "Select" placeholder
    var all = [''].concat(opts);
    all.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val === '' ? 'Select' : val;
      cylSelect.appendChild(opt);
    });

    updateAxis(eye);
  }

  function updateAxis(eye) {
    if (onlySpherical) return;

    const cylSelect = getSelect(eye, 'cyl');
    const axisSelect = getSelect(eye, 'axis');
    const cylValue = cylSelect.value;

    axisSelect.innerHTML = '';

    if (!cylValue || cylValue === 'N/A') {
      axisSelect.disabled = true;
      if (cylValue === 'N/A') {
        axisSelect.innerHTML = '<option value="N/A">N/A</option>';
        const hidden = getHiddenInput(eye, 'axis');
        if (hidden) hidden.value = 'N/A';
      } else {
        axisSelect.innerHTML = '<option value="">Select</option>';
      }
      return;
    }

    axisSelect.disabled = false;
    var axisVals = powerConfig.axis || [];
    [''].concat(axisVals).forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val === '' ? 'Select' : val + '\u00B0';
      axisSelect.appendChild(opt);
    });
  }

  function syncHiddenInputs() {
    ['left', 'right'].forEach(eye => {
      const fields = onlySpherical ? ['sph'] : ['sph', 'cyl', 'axis'];
      if (showBoxes) fields.push('boxes');

      fields.forEach(field => {
        const select = getSelect(eye, field);
        const hidden = getHiddenInput(eye, field);
        if (select && hidden) {
          hidden.value = select.disabled && select.value !== 'N/A' ? '' : select.value;
        }
      });
    });

    if (showBoxes) {
      syncQuantity();
    }
  }

  function syncQuantity() {
    const leftBoxes = parseInt(getSelect('left', 'boxes').value) || 0;
    const rightBoxes = parseInt(getSelect('right', 'boxes').value) || 0;
    const totalQty = leftBoxes + rightBoxes;

    const qtyInput = document.getElementById('power-quantity-input');
    if (qtyInput) {
      qtyInput.value = totalQty > 0 ? totalQty : 1;
    }
  }

  function isEyeComplete(eye) {
    const sph = getSelect(eye, 'sph').value;

    if (!sph) return false;

    if (sph === 'no-power') {
      return showBoxes ? !!getSelect(eye, 'boxes').value : true;
    }

    if (!onlySpherical) {
      const cyl = getSelect(eye, 'cyl').value;
      const axis = getSelect(eye, 'axis');
      if (!cyl) return false;
      if (!axis.disabled && !axis.value) return false;
    }

    if (showBoxes) {
      const boxes = getSelect(eye, 'boxes').value;
      if (!boxes) return false;
    }

    return true;
  }

  function validate() {
    const leftComplete = isEyeComplete('left');
    const rightComplete = isEyeComplete('right');

    syncHiddenInputs();
    updateCartButton(leftComplete || rightComplete);

    if (leftComplete || rightComplete) {
      hideError();
    }

    return leftComplete || rightComplete;
  }

  function getFirstMissingField() {
    for (const eye of ['left', 'right']) {
      const eyeLabel = eye === 'left' ? 'Left (OS)' : 'Right (OD)';
      const sph = getSelect(eye, 'sph').value;

      if (!sph) continue;
      if (sph === 'no-power') {
        if (showBoxes && !getSelect(eye, 'boxes').value) return `No. of Boxes for ${eyeLabel} eye`;
        continue;
      }

      if (!onlySpherical) {
        const cyl = getSelect(eye, 'cyl').value;
        const axis = getSelect(eye, 'axis');
        if (!cyl) return `CYL for ${eyeLabel} eye`;
        if (!axis.disabled && !axis.value) return `Axis for ${eyeLabel} eye`;
      }

      if (showBoxes && !getSelect(eye, 'boxes').value) return `No. of Boxes for ${eyeLabel} eye`;
    }

    return 'SPH for at least one eye';
  }

  function showError(message) {
    errorTextEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
  }

  function updateCartButton(enabled) {
    const submitBtn = document.getElementById(`ProductSubmitButton-${getSubmitSectionId()}`);
    if (!submitBtn) return;

    if (enabled) {
      submitBtn.removeAttribute('data-power-disabled');
      if (!submitBtn.hasAttribute('data-variant-disabled')) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent =
          submitBtn.dataset.originalText || 'Add to cart';
      }
    } else {
      submitBtn.setAttribute('data-power-disabled', 'true');
      submitBtn.disabled = true;
      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = submitBtn.querySelector('span').textContent;
      }
      submitBtn.querySelector('span').textContent = 'Select Prescription Details';
    }
  }

  function getSubmitSectionId() {
    const form = document.getElementById(formId);
    if (form) {
      const section = form.closest('[data-section]');
      if (section) return section.dataset.section;
    }
    const productInfo = document.querySelector('product-info');
    if (productInfo) return productInfo.dataset.section;
    return '';
  }

  function interceptSubmit() {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function (e) {
      if (!validate()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const missing = getFirstMissingField();
        showError(`Please select ${missing}`);
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function init() {
    ['left', 'right'].forEach(eye => {
      populateSph(eye);

      const sphSelect = getSelect(eye, 'sph');
      if (sphSelect) {
        sphSelect.addEventListener('change', () => {
          updateCyl(eye);
          validate();
        });
      }

      if (!onlySpherical) {
        const cylSelect = getSelect(eye, 'cyl');
        const axisSelect = getSelect(eye, 'axis');
        if (cylSelect) {
          cylSelect.addEventListener('change', () => {
            updateAxis(eye);
            validate();
          });
        }
        if (axisSelect) {
          axisSelect.addEventListener('change', () => validate());
        }
      }

      if (showBoxes) {
        const boxesSelect = getSelect(eye, 'boxes');
        if (boxesSelect) {
          boxesSelect.addEventListener('change', () => validate());
        }
      }
    });

    updateCartButton(false);
    interceptSubmit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
