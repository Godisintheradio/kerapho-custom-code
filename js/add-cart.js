(function () {
  'use strict';

  const observedDetails = new WeakSet();

  function arrangeCart(details) {
    const quantity = details.querySelector(
      '.product-quantity-input'
    );

    const button = details.querySelector(
      '.sqs-add-to-cart-button-wrapper'
    );

    if (!quantity || !button) return;

    let row = details.querySelector('.kerapho-cart-row');

    if (!row) {
      // Interviene solo quando entrambi i controlli
      // appartengono direttamente ai dettagli prodotto.
      if (
        quantity.parentElement !== details ||
        button.parentElement !== details
      ) {
        return;
      }

      row = document.createElement('div');
      row.className = 'kerapho-cart-row';

      quantity.before(row);
      row.append(quantity, button);
    }

    // Mantiene il calcolatore fuori dalla riga anche
    // se il suo script viene eseguito successivamente.
    const calculator = row.querySelector(
      '#kerapho-mq-calculator'
    );

    if (calculator) {
      row.before(calculator);
    }
  }

  function init() {
    document.querySelectorAll(
      '.ProductItem-details'
    ).forEach(function (details) {
      arrangeCart(details);

      if (observedDetails.has(details)) return;

      const observer = new MutationObserver(function () {
        arrangeCart(details);
      });

      observer.observe(details, {
        childList: true,
        subtree: true
      });

      observedDetails.add(details);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {
      once: true
    });
  } else {
    init();
  }

  document.addEventListener('mercury:load', init);
})();
