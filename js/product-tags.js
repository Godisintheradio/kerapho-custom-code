// KERAPHO — Product Tags
// Squarespace 7.0
// Versione 1.0



/**
 * KERAPHO — PRODUCT TAGS
 * Squarespace 7.0
 * Versione 1.1 — GitHub Edition
 *
 * Funzioni:
 * - Recupero tag dal JSON Squarespace
 * - Tag maiuscoli visualizzati per primi
 * - Collegamenti alla collezione di origine
 * - Supporto alla navigazione AJAX Mercury
 * - CSS integrato
 */

(function () {
  "use strict";

  const STYLE_ID = "kerapho-product-tags-style";
  const BOX_ID = "kerapho-product-tags";

  // ==========================================
  // 1. CSS INTEGRATO
  // ==========================================

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      /* KERAPHO — TAG PAGINA PRODOTTO */

      .kerapho-product-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 18px 0;
      }

      .kerapho-product-tags a.kerapho-product-tag {
        display: inline-block;
        padding: 6px 11px;
        border: 1px solid #dedede;
        border-radius: 4px;
        background: #fff;
        color: #222;
        font-family: inherit;
        font-size: 12px;
        line-height: 1.4;
        text-decoration: none !important;
        background-image: none !important;
        box-shadow: none !important;
        overflow-wrap: anywhere;
        transition: color 0.2s ease, border-color 0.2s ease;
      }

      .kerapho-product-tags a.kerapho-product-tag:hover,
      .kerapho-product-tags a.kerapho-product-tag:focus-visible {
        color: hsl(0, 100%, 36%);
        border-color: hsl(0, 100%, 36%);
      }
    `;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;

    document.head.appendChild(style);
  }

  // ==========================================
  // 2. ORDINAMENTO TAG
  // ==========================================

  function isUppercase(tag) {
    const text = tag.trim();

    return (
      text === text.toUpperCase() &&
      text !== text.toLowerCase()
    );
  }

  // ==========================================
  // 3. MOTORE PRODUCT TAGS
  // ==========================================

  let currentRun = 0;

  async function showProductTags() {
    const run = ++currentRun;
    const path = location.pathname;

    let description;

    for (let attempt = 0; attempt < 40; attempt++) {
      if (run !== currentRun || location.pathname !== path) return;

      description = document.querySelector(
        ".ProductItem-details-excerpt"
      );

      if (description) break;

      await new Promise(resolve => setTimeout(resolve, 250));
    }

    if (!description) return;
    if (document.getElementById(BOX_ID)) return;

    try {
      const url = new URL(path, location.origin);
      url.searchParams.set("format", "json");

      const response = await fetch(url.href, {
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();
      const tags = data.item && data.item.tags;
      const collection = data.collection && data.collection.fullUrl;

      if (
        run !== currentRun ||
        location.pathname !== path ||
        !description.isConnected
      ) return;

      if (!Array.isArray(tags) || !tags.length || !collection) return;
      if (document.getElementById(BOX_ID)) return;

// Riconosce i tag contenenti esclusivamente un formato.
function isFormatTag(tag) {
  return /^(?:formato\s*:?\s*)?\d+(?:[.,]\d+)?\s*(?:mm|cm|m)?(?:\s*[x×✕*]\s*\d+(?:[.,]\d+)?\s*(?:mm|cm|m)?){1,2}$/i.test(
    tag.trim()
  );
}

// Esclude i formati e mette prima i tag maiuscoli.
const orderedTags = [...new Set(tags)]
  .filter(tag =>
    typeof tag === "string" &&
    tag.trim() &&
    !isFormatTag(tag)
  )
  .sort((a, b) =>
    Number(isUppercase(b)) - Number(isUppercase(a))
  );

      if (!orderedTags.length) return;

      const box = document.createElement("nav");
      box.id = BOX_ID;
      box.className = "kerapho-product-tags";
      box.setAttribute("aria-label", "Tag del prodotto");

      orderedTags.forEach(tag => {
        const link = document.createElement("a");
        const destination = new URL(collection, location.origin);

        destination.search = "";
        destination.hash = "";
        destination.searchParams.set("tag", tag);

        link.className = "kerapho-product-tag";
        link.textContent = tag;
        link.href = destination.href;

        box.appendChild(link);
      });

      description.insertAdjacentElement("afterend", box);

      console.log("[Kerapho Tag] Etichette inserite.");

    } catch (error) {
      console.error("[Kerapho Tag]", error);
    }
  }

  // ==========================================
  // 4. INIZIALIZZAZIONE
  // ==========================================

  injectStyles();
  showProductTags();

  window.addEventListener("mercury:load", showProductTags);
  window.addEventListener("pageshow", showProductTags);

})();

