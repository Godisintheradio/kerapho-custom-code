(function () {
  function insertPaymentOptions() {
    document.querySelectorAll(
      ".ProductItem-details .sqs-add-to-cart-button"
    ).forEach(function (button) {
      const details = button.closest(".ProductItem-details");
      if (!details || details.querySelector(".ag-payment-options")) return;

      const box = document.createElement("div");
      box.className = "ag-payment-options";
      box.innerHTML = `
        <p class="ag-payment-options__title">Acquista ora, paga a rate</p>
        <p class="ag-payment-options__text">Scegli PayPal o Klarna al checkout.</p>
        <div class="ag-payment-options__brands">
          <span class="ag-payment-options__brand">PayPal</span>
          <span class="ag-payment-options__brand ag-payment-options__brand--klarna">Klarna</span>
        </div>
        <p class="ag-payment-options__note">
          Disponibilità e condizioni vengono mostrate al momento del pagamento.
        </p>
        <div class="ag-payment-options__section">
          <p class="ag-payment-options__heading"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h11v12H3zM14 9h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg><span>Spedizione gratuita per ordini superiori a € 999.00 - Escluse le pavimentazioni ultra spessorate da 20 e 30 millimetri </span></p>
        </div>
        <div class="ag-payment-options__section">
          <p class="ag-payment-options__heading"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg><span>Pagamenti sicuri</span></p>
          <div class="ag-payment-options__logos"><span class="ag-payment-logo" role="img" aria-label="Google Pay" style="background-position: -16px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Apple Pay" style="background-position: -87px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Klarna" style="background-position: -157px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Link" style="background-position: -227px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Visa" style="background-position: -297px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Mastercard" style="background-position: -367px -13px"></span><span class="ag-payment-logo" role="img" aria-label="American Express" style="background-position: -437px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Discover" style="background-position: -507px -13px"></span><span class="ag-payment-logo" role="img" aria-label="Diners Club" style="background-position: -577px -13px"></span><span class="ag-payment-logo" role="img" aria-label="JCB" style="background-position: -647px -13px"></span><span class="ag-payment-logo" role="img" aria-label="UnionPay" style="background-position: -717px -13px"></span><span class="ag-payment-logo" role="img" aria-label="CB" style="background-position: -17px -65px"></span><span class="ag-payment-logo" role="img" aria-label="iDEAL | Wero" style="background-position: -87px -65px"></span><span class="ag-payment-logo ag-payment-logo--paypal"><img src="data:image/jpeg;base64,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" alt="PayPal" width="48" height="30"></span></div>
        </div>
      `;
      // Nei contenitori flex segue l'ordine visivo del pulsante.
      let sibling = button;
      while (sibling && sibling.parentElement !== details) {
        sibling = sibling.parentElement;
      }
      if (sibling) {
        box.style.order = getComputedStyle(sibling).order;
        sibling.insertAdjacentElement("afterend", box);
      }
    });
  }

  function start() {
    insertPaymentOptions();
    let scheduled = false;
    const observer = new MutationObserver(function (records) {
      if (!records.some(function (record) { return record.addedNodes.length; })) return;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        insertPaymentOptions();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

