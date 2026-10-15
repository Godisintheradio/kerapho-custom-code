
/**
 * KERAPHO — SMART BREADCRUMB V1.1
 * Squarespace 7.0 | GitHub Edition
 *
 * - Mantiene il rilevamento HTML della V1
 * - Legge le categorie dal JSON del prodotto
 * - Nessun elenco manuale di categorie merceologiche
 * - Preferisce la categoria di provenienza
 * - Declassa le categorie promozionali
 * - Supporta la navigazione Mercury
 * - CSS integrato
 */

(function () {
  "use strict";

  // Evita registrazioni duplicate.
  if (window.__keraphoBreadcrumbV11) return;
  window.__keraphoBreadcrumbV11 = true;

  const SHOP_PATH = "/shop";
  const MAX_PRODUCT_LENGTH = 35;
  const STORAGE_KEY = "kerapho_breadcrumb_origin_v11";
  const STYLE_ID = "kerapho-breadcrumb-style-v11";

  // Solo categorie da considerare promozionali.
  const PROMOTIONAL_CATEGORIES = [
    "Offerte"
  ];

  let currentRun = 0;

  // ==========================================
  // 1. CSS INTEGRATO
  // ==========================================

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      body.kerapho-breadcrumb-loading
      .ProductItem-breadcrumbs,
      body.kerapho-breadcrumb-loading
      .product-breadcrumbs,
      body.kerapho-breadcrumb-loading
      .breadcrumbs {
        visibility: hidden !important;
      }
    `;

    document.head.appendChild(style);
  }

  // ==========================================
  // 2. UTILITÀ
  // ==========================================

  function normalizePath(url) {
    try {
      return new URL(url, location.origin)
        .pathname
        .replace(/\/+$/, "")
        .toLowerCase();
    } catch (error) {
      return "";
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .normalize("NFC")
      .toLowerCase();
  }

  function shortenProductName(name) {
    const cleanName = String(name || "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanName.length <= MAX_PRODUCT_LENGTH) {
      return cleanName;
    }

    return cleanName
      .substring(0, MAX_PRODUCT_LENGTH)
      .trim() + "...";
  }

  function isProductPage(path) {
    return path.startsWith(SHOP_PATH + "/");
  }

  // ==========================================
  // 3. MEMORIZZA LA PROVENIENZA
  // ==========================================

  function rememberOrigin(productPath, category) {
    if (!category) return;

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          product: productPath,
          category: category
        })
      );
    } catch (error) {}
  }

  function getSavedOrigin(path) {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) || "null"
      );

      if (saved && saved.product === path) {
        return saved.category;
      }
    } catch (error) {}

    return null;
  }

  function getCategoryFromURL(url) {
    try {
      const parsed = new URL(url, location.origin);

      if (normalizePath(parsed.href) !== SHOP_PATH) {
        return null;
      }

      return parsed.searchParams.get("category");
    } catch (error) {
      return null;
    }
  }

  // Memorizza la categoria quando viene cliccato
  // un prodotto da una pagina Shop filtrata.
  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const category = getCategoryFromURL(location.href);
    if (!category) return;

    const destination = normalizePath(link.href);

    if (isProductPage(destination)) {
      rememberOrigin(destination, category);
    }
  }, true);

  // ==========================================
  // 4. CATEGORIE DAL JSON SQUARESPACE
  // ==========================================

  async function getProductData(path) {
    const url = new URL(path, location.origin);
    url.searchParams.set("format", "json");

    const response = await fetch(url.href, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    return response.json();
  }

  function getCategories(data) {
    const categories = data?.item?.categories;

    if (!Array.isArray(categories)) return [];

    return [...new Set(
      categories.filter(category =>
        typeof category === "string" &&
        category.trim()
      )
    )];
  }

  // ==========================================
  // 5. SELEZIONE INTELLIGENTE
  // ==========================================

  function selectCategory(categories, path) {
    if (!categories.length) return null;

    const origin =
      getSavedOrigin(path) ||
      getCategoryFromURL(document.referrer);

    // Prima scelta: categoria di provenienza,
    // ma soltanto se appartiene al prodotto.
    if (origin) {
      const match = categories.find(category =>
        normalizeText(category) === normalizeText(origin)
      );

      if (match) return match;
    }

    // Seconda scelta: prima categoria
    // non promozionale restituita da Squarespace.
    const commercial = categories.find(category =>
      !PROMOTIONAL_CATEGORIES.some(promo =>
        normalizeText(promo) === normalizeText(category)
      )
    );

    return commercial || categories[0];
  }

  // ==========================================
  // 6. BREADCRUMB NATIVA — LOGICA V1
  // ==========================================

  function findNativeBreadcrumb(currentPath) {
    const links = document.querySelectorAll("a[href]");

    for (const currentLink of links) {
      if (
        normalizePath(currentLink.getAttribute("href")) !==
        currentPath
      ) {
        continue;
      }

      let parent = currentLink.parentElement;
      let depth = 0;

      while (parent && depth < 6) {
        const parentLinks = parent.querySelectorAll("a[href]");
        let shopLink = null;

        for (const link of parentLinks) {
          if (
            normalizePath(link.getAttribute("href")) ===
            SHOP_PATH
          ) {
            shopLink = link;
            break;
          }
        }

        if (shopLink) {
          return {
            container: parent,
            currentLink: currentLink
          };
        }

        parent = parent.parentElement;
        depth++;
      }
    }

    return null;
  }

  // ==========================================
  // 7. COSTRUZIONE BREADCRUMB
  // ==========================================

  function renderBreadcrumb(
    container,
    productName,
    category
  ) {
    container.replaceChildren();

    const shop = document.createElement("a");
    shop.href = SHOP_PATH;
    shop.textContent = "Shop";

    container.appendChild(shop);

    if (category) {
      container.appendChild(
        document.createTextNode(" / ")
      );

      const categoryLink = document.createElement("a");

      categoryLink.href =
        SHOP_PATH +
        "?category=" +
        encodeURIComponent(category);

      categoryLink.textContent = category;

      container.appendChild(categoryLink);
    }

    container.appendChild(
      document.createTextNode(" / ")
    );

    const current = document.createElement("span");

    current.textContent = shortenProductName(productName);
    current.setAttribute("aria-current", "page");
    current.setAttribute("title", productName);

    container.appendChild(current);
  }

  // ==========================================
  // 8. AGGIORNAMENTO
  // ==========================================

  async function updateBreadcrumb() {
    const run = ++currentRun;
    const path = normalizePath(location.href);

    document.body.classList.remove(
      "kerapho-breadcrumb-loading"
    );

    if (!isProductPage(path)) return;

    // Aspetta la breadcrumb nativa,
    // mantenendo il rilevamento originale.
    let breadcrumb = null;

    for (let attempt = 0; attempt < 40; attempt++) {
      if (
        run !== currentRun ||
        normalizePath(location.href) !== path
      ) return;

      breadcrumb = findNativeBreadcrumb(path);

      if (breadcrumb) break;

      await new Promise(resolve =>
        setTimeout(resolve, 250)
      );
    }

    if (!breadcrumb) {
      console.warn(
        "[Kerapho Breadcrumb] Breadcrumb nativa non trovata."
      );
      return;
    }

    const container = breadcrumb.container;
    const originalProductName =
      breadcrumb.currentLink.textContent.trim();

    document.body.classList.add(
      "kerapho-breadcrumb-loading"
    );

    try {
      const data = await getProductData(path);

      if (
        run !== currentRun ||
        normalizePath(location.href) !== path ||
        !container.isConnected
      ) return;

      const categories = getCategories(data);
      const category = selectCategory(categories, path);

      renderBreadcrumb(
        container,
        originalProductName,
        category
      );

      console.log("[Kerapho Breadcrumb V1.1]", {
        prodotto: originalProductName,
        categorie: categories,
        categoriaSelezionata: category
      });

    } catch (error) {
      console.error(
        "[Kerapho Breadcrumb V1.1]",
        error
      );
    } finally {
      if (run === currentRun) {
        document.body.classList.remove(
          "kerapho-breadcrumb-loading"
        );
      }
    }
  }

  // ==========================================
  // 9. INIZIALIZZAZIONE
  // ==========================================

  function start() {
    injectStyles();
    updateBreadcrumb();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    start();
  }

  window.addEventListener(
    "mercury:load",
    updateBreadcrumb
  );

  window.addEventListener(
    "pageshow",
    updateBreadcrumb
  );

})();

