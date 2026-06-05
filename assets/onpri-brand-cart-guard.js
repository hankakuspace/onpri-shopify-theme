(function () {
  function getBrandIds(cart) {
    if (!cart || !Array.isArray(cart.items)) return [];

    return cart.items
      .map(function (item) {
        if (!item.properties) return null;
        return item.properties._onpri_brand_id || null;
      })
      .filter(function (brandId) {
        return Boolean(brandId);
      });
  }

  function getUniqueValues(values) {
    return values.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
  }

  function createMessage() {
    var message = document.createElement('div');
    message.id = 'onpri-brand-cart-warning';
    message.setAttribute('role', 'alert');
    message.style.margin = '24px 0';
    message.style.padding = '16px';
    message.style.border = '1px solid #d72c0d';
    message.style.background = '#fff4f4';
    message.style.color = '#8a1f11';
    message.style.fontSize = '14px';
    message.style.lineHeight = '1.7';
    message.textContent = '異なるブランドの商品は同時に購入できません。どちらか一方のブランド商品のみにしてから購入手続きへ進んでください。';

    return message;
  }

  function showWarning() {
    if (document.getElementById('onpri-brand-cart-warning')) return;

    var cartFooter =
      document.querySelector('.cart__footer') ||
      document.querySelector('.cart__ctas') ||
      document.querySelector('main');

    if (!cartFooter) return;

    cartFooter.insertBefore(createMessage(), cartFooter.firstChild);
  }

  function hideWarning() {
    var message = document.getElementById('onpri-brand-cart-warning');
    if (message) message.remove();
  }

  function setCheckoutDisabled(disabled) {
    var checkoutButtons = document.querySelectorAll(
      'button[name="checkout"], input[name="checkout"], a[href="/checkout"]'
    );

    checkoutButtons.forEach(function (button) {
      if (disabled) {
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('data-onpri-disabled', 'true');

        if (button.tagName === 'A') {
          button.setAttribute('data-original-href', button.getAttribute('href') || '');
          button.removeAttribute('href');
          button.style.pointerEvents = 'none';
          button.style.opacity = '0.5';
        } else {
          button.disabled = true;
          button.style.opacity = '0.5';
        }
      } else if (button.getAttribute('data-onpri-disabled') === 'true') {
        button.removeAttribute('aria-disabled');
        button.removeAttribute('data-onpri-disabled');

        if (button.tagName === 'A') {
          var originalHref = button.getAttribute('data-original-href') || '/checkout';
          button.setAttribute('href', originalHref);
          button.removeAttribute('data-original-href');
          button.style.pointerEvents = '';
          button.style.opacity = '';
        } else {
          button.disabled = false;
          button.style.opacity = '';
        }
      }
    });
  }

  function validateCartBrand() {
    fetch('/cart.js', {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (cart) {
        var brandIds = getBrandIds(cart);
        var uniqueBrandIds = getUniqueValues(brandIds);
        var hasMixedBrands = uniqueBrandIds.length > 1;

        if (hasMixedBrands) {
          showWarning();
          setCheckoutDisabled(true);
        } else {
          hideWarning();
          setCheckoutDisabled(false);
        }
      })
      .catch(function () {
        // カート取得に失敗した場合は、購入ボタンを止めない。
      });
  }

  document.addEventListener('DOMContentLoaded', validateCartBrand);
  document.addEventListener('cart:updated', validateCartBrand);

  document.addEventListener('change', function (event) {
    if (event.target && event.target.closest('cart-items')) {
      window.setTimeout(validateCartBrand, 500);
    }
  });

  document.addEventListener('click', function () {
    window.setTimeout(validateCartBrand, 700);
  });
})();
