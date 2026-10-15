
/**
 * KERAPHO — SMART BREADCRUMB V2.0
 * Squarespace 7.0 — GitHub Edition
 *
 * - Categorie lette dal JSON prodotto
 * - Priorità alla categoria di provenienza
 * - Fallback deterministico
 * - Navigazione Mercury
 * - CSS integrato
 */

(function () {
  "use strict";

  const SHOP = "/shop";
  const MAX_LENGTH = 35;
  const STYLE_ID = "kerapho-breadcrumb-v2-style";
  const STORAGE_KEY = "kerapho-breadcrumb-origin";
  const SELECTORS = [
    ".ProductItem-breadcrumbs",
    ".product-breadcrumbs",
    ".breadcrumbs"
  ].join(", ");

  let currentRun = 0;
  let retryTimer = null;

  // ==========================================
  // CSS
  // ==========================================

  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      body.kerapho-breadcrumb-loading
      ${SELECTORS.split(", ").join(",\n      body.kerapho-breadcrumb-loading ")} {
        visibility: hidden !important;
      }
    `;

    document.head.appendChild(style);
  }

  // ==========================================
  // UTILITÀ
  // ==========================================

  function normalizePath(value) {
    try {
      return new URL(value, location.origin)
        .pathname.replace(/\/+$/, "").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function shorten(text) {
    const value = String(text || "")
      .replace(/\s+/g, " ").trim();

    return value.length > MAX_LENGTH
      ? value.slice(0, MAX_LENGTH).trim() + "..."
      : value;
  }

  function normalizeCategory(value) {
    if (typeof value === "string") {
      return value.trim();
    }

    if (value && typeof value === "object") {
      const name = value.name || value.title || value.label;
      return typeof name === "string" ? name.trim() : "";
    }

    return "";
  }

  function getCategories(data) {
    const item = data && data.item;
    if (!item) return [];

    const source = item.categories;
    if (!Array.isArray(source)) return [];

    return [...new Set(
      source.map(normalizeCategory).filter(Boolean)
    )];
  }

  // ==========================================
  // PROVENIENZA
  // ==========================================

  function readOrigin() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) || "null"
      );

      return saved && saved.product === normalizePath(location.href)
        ? saved.category
        : null;
    } catch (_) {
      return null;
    }
  }

  function rememberOrigin(product, category) {
    if (!product || !category) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        product: normalizePath(product),
        category: category
      }));
    } catch (_) {}
  }

  function getCategoryFromURL(value) {
    try {
      const url = new URL(value, location.origin);

      if (normalizePath(url.href) !== SHOP) return null;

      return url.searchParams.get("category");
    } catch (_) {
      return null;
    }
  }

  // Registra la provenienza dai link prodotto
  // quando il visitatore naviga da una categoria.
  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const category = getCategoryFromURL(location.href);
    if (!category) return;

    const destination = normalizePath(link.href);

    if (destination.startsWith(SHOP + "/")) {
      rememberOrigin(link.href, category);
    }
  }, true);

  // ==========================================
  // JSON SQUARESPACE
  // ==========================================

  async function fetchProduct(path) {
    const url = new URL(path, location.origin);
    url.searchParams.set("format", "json");

    const response = await fetch(url.href, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    return response.json();
  }

  // ==========================================
  // SELEZIONE CATEGORIA
  // ==========================================

  function selectCategory(categories) {
    if (!categories.length) return null;

    const preferred = readOrigin() ||
      getCategoryFromURL(document.referrer);

    if (preferred) {
      const match = categories.find(category =>
        category.normalize("NFC").toLowerCase() ===
        preferred.normalize("NFC").toLowerCase()
      );

      if (match) return match;
    }

    // Scelta stabile quando non conosciamo
    // la categoria di provenienza.
    return [...categories].sort((a, b) =>
      a.localeCompare(b, "it")
    )[0];
  }

  // ==========================================
  // BREADCRUMB
  // ==========================================

  function findBreadcrumb() {
    return document.querySelector(SELECTORS);
  }

  function getProductName(data) {
    const item = data && data.item;

    const name = item && (item.title || item.name);

    return name ||
      document.querySelector(".ProductItem-details-title")
        ?.textContent?.trim() ||
      document.title.split("|")[0].trim();
  }

  function addLink(container, text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    container.appendChild(link);
  }

  function addSeparator(container) {
    container.appendChild(
      document.createTextNode(" / ")
    );
  }

  function renderBreadcrumb(container, name, category) {
    container.replaceChildren();

    addLink(container, "Shop", SHOP);

    if (category) {
      addSeparator(container);

      addLink(
        container,
        category,
        SHOP + "?category=" + encodeURIComponent(category)
      );
    }

    addSeparator(container);

    const current = document.createElement("span");
    current.textContent = shorten(name);
    current.title = name;
    current.setAttribute("aria-current", "page");

    container.appendChild(current);
  }

  // ==========================================
  // INIZIALIZZAZIONE
  // ==========================================

  async function updateBreadcrumb() {
    const run = ++currentRun;
    const path = normalizePath(location.href);

    clearTimeout(retryTimer);

    document.body.classList.remove(
      "kerapho-breadcrumb-loading"
    );

    if (!path.startsWith(SHOP + "/")) return;

    let container = null;

    // Attende il rendering della breadcrumb nativa.
    for (let attempt = 0; attempt < 40; attempt++) {
      if (run !== currentRun ||
          normalizePath(location.href) !== path) return;

      container = findBreadcrumb();

      if (container) break;

      await new Promise(resolve =>
        setTimeout(resolve, 250)
      );
    }

    if (!container) return;

    document.body.classList.add(
      "kerapho-breadcrumb-loading"
    );

    try {
      const data = await fetchProduct(path);

      if (run !== currentRun ||
          normalizePath(location.href) !== path ||
          !container.isConnected) return;

      const categories = getCategories(data);
      const category = selectCategory(categories);
      const productName = getProductName(data);

      renderBreadcrumb(
        container,
        productName,
        category
      );

      console.log(
        "[Kerapho Breadcrumb V2]",
        { category, categories }
      );

    } catch (error) {
      console.warn(
        "[Kerapho Breadcrumb V2]",
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

  function scheduleUpdate() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(updateBreadcrumb, 80);
  }

  function start() {
    injectCSS();
    scheduleUpdate();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded", start, { once: true }
    );
  } else {
    start();
  }

  window.addEventListener("mercury:load", scheduleUpdate);
  window.addEventListener("pageshow", scheduleUpdate);

})();
