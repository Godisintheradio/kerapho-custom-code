/*!
 * KERAPHO BREADCRUMB ENGINE V2.1 — GitHub Edition
 * Squarespace 7.0
 * V2.0 collaudata + CSS fade-in integrato.
 * Stili tipografici e separatori gestiti dal template Squarespace.
 */
(function () {
  "use strict";

  if (window.KeraphoBreadcrumbV2) return;
  window.KeraphoBreadcrumbV2 = true;

  const CONFIG = {
    maxTitleLength: 15,
    cacheTTL: 30 * 60 * 1000,
    navigationTTL: 5 * 60 * 1000,
    selector: ".ProductItem-nav-breadcrumb",
    debug: false
  };

  const CACHE_PREFIX = "kb-v2-product:";
  const NAV_KEY = "kb-v2-navigation";

  // Solo la dissolvenza: font, colore e separatore restano nativi.
  function injectStyles() {
    if (document.getElementById("kb-v2-fade-style")) return;
    const style = document.createElement("style");
    style.id = "kb-v2-fade-style";
    style.textContent = [
      "html.kb-product-page .ProductItem-nav-breadcrumb:not(.kb-ready) {",
      "  opacity: 0 !important;",
      "  visibility: hidden !important;",
      "}",
      "html.kb-product-page .ProductItem-nav-breadcrumb.kb-ready {",
      "  opacity: 1;",
      "  visibility: visible;",
      "  animation: kb-v2-fade-in 220ms ease-out both;",
      "}",
      "@keyframes kb-v2-fade-in {",
      "  from { opacity: 0; }",
      "  to { opacity: 1; }",
      "}",
      "@media (prefers-reduced-motion: reduce) {",
      "  html.kb-product-page .ProductItem-nav-breadcrumb.kb-ready { animation: none; }",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  const log = (...args) => {
    if (CONFIG.debug) {
      console.log("[Kerapho Breadcrumb]", ...args);
    }
  };

  function normalizePath(value) {
    if (!value) return "";
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin) return "";
      return (url.pathname.replace(/\/+$/, "") || "/");
    } catch {
      return "";
    }
  }

  function normalizeCategory(value) {
    return String(value || "")
      .normalize("NFC")
      .trim()
      .toLocaleLowerCase("it");
  }

  function shortenTitle(value) {
    const title = String(value || "")
      .replace(/\s+/g, " ")
      .trim();
    if (title.length <= CONFIG.maxTitleLength) return title;
    return title.slice(0, CONFIG.maxTitleLength).trim() + "...";
  }

  function readStorage(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function getCategoryFromURL(value) {
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin) return null;
      return url.searchParams.get("category");
    } catch {
      return null;
    }
  }

  function getProductContext() {
    const context = window.Static?.SQUARESPACE_CONTEXT;
    if (!context) return null;
    const collection = context.collection;
    const item = context.item;
    if (
      collection?.type !== 13 ||
      !collection.fullUrl ||
      !item?.id ||
      !item?.fullUrl
    ) return null;

    const collectionPath = normalizePath(collection.fullUrl);
    const productPath = normalizePath(item.fullUrl);

    if (
      !collectionPath ||
      !productPath ||
      productPath === collectionPath ||
      normalizePath(location.href) !== productPath
    ) return null;

    return {
      collectionPath,
      productPath,
      collectionTitle:
        collection.navigationTitle ||
        collection.title ||
        "Prodotti",
      productTitle: item.title || ""
    };
  }

  // Registra la categoria quando l'utente clicca sul link filtrato.
  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");
      if (!link) return;
      let url;
      try {
        url = new URL(link.href, location.origin);
      } catch {
        return;
      }

      if (url.origin !== location.origin) return;
      const category = url.searchParams.get("category");
      if (!category) return;

      writeStorage(NAV_KEY, {
        category,
        collectionPath: normalizePath(url.pathname),
        sourceURL: url.href,
        timestamp: Date.now()
      });
    },
    true
  );

  function findNavigationCategory(product) {
    const referrer = document.referrer;

    if (referrer) {
      const referrerPath = normalizePath(referrer);
      if (referrerPath === product.collectionPath) {
        const category = getCategoryFromURL(referrer);
        if (category) return category;
      }
    }

    const navigation = readStorage(NAV_KEY);
    if (!navigation) return null;
    if (Date.now() - navigation.timestamp > CONFIG.navigationTTL) return null;
    if (navigation.collectionPath !== product.collectionPath) return null;
    if (!referrer || !navigation.sourceURL) return null;

    try {
      const previousURL = new URL(referrer);
      const savedURL = new URL(navigation.sourceURL);
      if (
        previousURL.origin !== savedURL.origin ||
        previousURL.pathname !== savedURL.pathname ||
        previousURL.search !== savedURL.search
      ) return null;
    } catch {
      return null;
    }

    return navigation.category || null;
  }

  function selectCategory(categories, product) {
    if (!categories.length) return null;
    const preferred = findNavigationCategory(product);
    if (preferred) {
      const match = categories.find(
        category => normalizeCategory(category) === normalizeCategory(preferred)
      );
      if (match) {
        log("Categoria di provenienza:", match);
        return match;
      }
    }
    log("Categoria predefinita:", categories[0]);
    return categories[0];
  }

  async function fetchProductData(product) {
    const cacheKey = CACHE_PREFIX + product.productPath;
    const cached = readStorage(cacheKey);

    if (
      cached &&
      Date.now() - cached.timestamp < CONFIG.cacheTTL &&
      cached.itemId
    ) {
      log("Dati recuperati dalla cache");
      return cached.data;
    }

    const url = new URL(product.productPath, location.origin);
    url.searchParams.set("format", "json");

    const response = await fetch(url.href, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error("Product JSON HTTP " + response.status);
    }

    const json = await response.json();

    if (
      !json.item ||
      !json.collection ||
      json.collection.type !== 13 ||
      normalizePath(json.item.fullUrl) !== product.productPath ||
      normalizePath(json.collection.fullUrl) !== product.collectionPath
    ) {
      throw new Error("Dati prodotto o collection non validi");
    }

    const data = {
      title: json.item.title || product.productTitle,
      collectionTitle:
        json.collection.navigationTitle ||
        json.collection.title ||
        product.collectionTitle,
      categories: Array.isArray(json.item.categories)
        ? json.item.categories.filter(
            value => typeof value === "string" && value.trim()
          )
        : []
    };

    writeStorage(cacheKey, {
      timestamp: Date.now(),
      itemId: json.item.id,
      data
    });

    return data;
  }

  function createLink(text, href) {
    const link = document.createElement("a");
    link.className = "ProductItem-nav-breadcrumb-link kb-link";
    link.href = href;
    link.textContent = text;
    return link;
  }

  function createSeparator() {
    const separator = document.createElement("span");
    separator.className =
      "ProductItem-nav-breadcrumb-separator kb-separator";
    separator.textContent = "";
    separator.setAttribute("aria-hidden", "true");
    return separator;
  }

  function createCurrent(text) {
    const element = document.createElement("span");
    element.className = "kb-current";
    element.textContent = shortenTitle(text);
    element.title = text;
    element.setAttribute("aria-current", "page");
    return element;
  }

  function renderBreadcrumb(container, product, data) {
    const categories = data.categories || [];
    const category = selectCategory(categories, product);
    const collectionTitle = data.collectionTitle || product.collectionTitle;
    const productTitle = data.title || product.productTitle;
    const fragment = document.createDocumentFragment();

    fragment.appendChild(createLink(collectionTitle, product.collectionPath));
    if (category) {
      fragment.appendChild(createSeparator());
      const categoryURL = new URL(product.collectionPath, location.origin);
      categoryURL.searchParams.set("category", category);
      fragment.appendChild(
        createLink(category, categoryURL.pathname + categoryURL.search)
      );
    }

    fragment.appendChild(createSeparator());
    fragment.appendChild(createCurrent(productTitle));
    container.replaceChildren(fragment);
    container.classList.add("kb-ready");
    container.setAttribute("aria-label", "Percorso di navigazione");

    log("Breadcrumb aggiornata", {
      collection: collectionTitle,
      category,
      product: productTitle
    });
  }

  function waitForBreadcrumb(timeout = 5000) {
    return new Promise(resolve => {
      const existing = document.querySelector(CONFIG.selector);
      if (existing) {
        resolve(existing);
        return;
      }
      let observer;
      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
      observer = new MutationObserver(() => {
        const element = document.querySelector(CONFIG.selector);
        if (!element) return;
        clearTimeout(timer);
        observer.disconnect();
        resolve(element);
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    });
  }

  async function init() {
    const product = getProductContext();
    if (!product) return;

    injectStyles();
    document.documentElement.classList.add("kb-product-page");

    const container = await waitForBreadcrumb();
    if (!container) {
      log("Breadcrumb nativa non trovata");
      return;
    }
    container.classList.add("kb-loading");

    try {
      const data = await fetchProductData(product);
      renderBreadcrumb(container, product, data);
    } catch (error) {
      console.warn("[Kerapho Breadcrumb V2]", error);
      container.classList.remove("kb-loading");
      container.classList.add("kb-ready");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
