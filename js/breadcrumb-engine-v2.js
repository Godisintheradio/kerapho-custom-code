/*!
 * KERAPHO — BREADCRUMB ENGINE V2.3
 * Squarespace 7.0 | Automatic ecommerce collections/categories
 * Native appearance; integrated 220ms fade-in.
 */
(function () {
  "use strict";
  if (window.__keraphoBreadcrumbEngineV23) return;
  window.__keraphoBreadcrumbEngineV23 = true;

  const SELECTOR = ".ProductItem-nav-breadcrumb";
  const STYLE_ID = "kerapho-breadcrumb-v23-style";
  const ORIGIN_PREFIX = "kerapho-breadcrumb-origin-v23:";
  const CACHE_PREFIX = "kerapho-breadcrumb-product-v23:";
  const MAX_TITLE = 15;
  const CACHE_TTL = 30 * 60 * 1000;
  const ORIGIN_TTL = 10 * 60 * 1000;
  let runId = 0;

  function pathOf(value) {
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin) return "";
      return url.pathname.replace(/\/+$/, "") || "/";
    } catch { return ""; }
  }

  function categoryKey(value) {
    return String(value || "").trim().normalize("NFC").toLocaleLowerCase("it");
  }

  function storageGet(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || "null"); }
    catch { return null; }
  }
  function storageSet(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); }
    catch {}
  }

  function productContext() {
    const ctx = window.Static?.SQUARESPACE_CONTEXT;
    const collection = ctx?.collection;
    const item = ctx?.item;
    if (collection?.type !== 13 || !collection.fullUrl || !item?.id || !item.fullUrl) return null;
    const collectionPath = pathOf(collection.fullUrl);
    const productPath = pathOf(item.fullUrl);
    if (!collectionPath || !productPath || productPath === collectionPath ||
        productPath !== pathOf(location.href)) return null;
    return {
      collectionPath, productPath, itemId: item.id,
      collectionTitle: collection.navigationTitle || collection.title || "Prodotti",
      productTitle: item.title || ""
    };
  }

  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.kb-v23-product ${SELECTOR}:not(.kb-v23-ready) {
        opacity: 0 !important;
        visibility: hidden !important;
      }
      html.kb-v23-product ${SELECTOR}.kb-v23-ready {
        opacity: 1;
        visibility: visible;
        animation: kb-v23-fade 220ms ease-out both;
      }
      @keyframes kb-v23-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        html.kb-v23-product ${SELECTOR}.kb-v23-ready { animation: none; }
      }
    `;
    document.head.appendChild(style);
  }

  // Capture the actual clicked product from a category-filtered collection.
  document.addEventListener("click", event => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;
    const ctx = window.Static?.SQUARESPACE_CONTEXT;
    const collection = ctx?.collection;
    if (collection?.type !== 13 || !collection.fullUrl) return;
    const collectionPath = pathOf(collection.fullUrl);
    if (pathOf(location.href) !== collectionPath) return;
    const category = new URL(location.href).searchParams.get("category");
    if (!category) return;
    const destination = pathOf(link.href);
    if (!destination || destination === collectionPath ||
        !destination.startsWith(collectionPath + "/")) return;
    storageSet(ORIGIN_PREFIX + destination, {
      category, collectionPath, timestamp: Date.now()
    });
  }, true);

  function originCategory(product) {
    // A direct referrer is preferred and must belong to the same collection.
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && pathOf(ref.href) === product.collectionPath) {
          const category = ref.searchParams.get("category");
          if (category) return category;
        }
      }
    } catch {}

    const saved = storageGet(ORIGIN_PREFIX + product.productPath);
    if (!saved || saved.collectionPath !== product.collectionPath ||
        Date.now() - saved.timestamp > ORIGIN_TTL) return null;
    // A saved origin is only trusted on a same-collection navigation.
    if (document.referrer && pathOf(document.referrer) === product.collectionPath) {
      return saved.category;
    }
    return null;
  }

  async function productData(product) {
    const key = CACHE_PREFIX + product.productPath;
    const cached = storageGet(key);
    if (cached?.itemId === product.itemId && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const url = new URL(product.productPath, location.origin);
    url.searchParams.set("format", "json");
    const response = await fetch(url.href, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error("JSON HTTP " + response.status);
    const json = await response.json();
    if (json.item?.id !== product.itemId ||
        pathOf(json.item?.fullUrl) !== product.productPath ||
        pathOf(json.collection?.fullUrl) !== product.collectionPath ||
        json.collection?.type !== 13) {
      throw new Error("Unexpected product JSON");
    }
    const data = {
      title: json.item.title || product.productTitle,
      collectionTitle: json.collection.navigationTitle ||
        json.collection.title || product.collectionTitle,
      categories: Array.isArray(json.item.categories)
        ? json.item.categories.filter(v => typeof v === "string" && v.trim())
        : []
    };
    storageSet(key, { itemId: product.itemId, timestamp: Date.now(), data });
    return data;
  }

  function nativeLink(title, href) {
    const a = document.createElement("a");
    a.className = "ProductItem-nav-breadcrumb-link";
    a.href = href;
    a.textContent = title;
    return a;
  }
  function separator() {
    const span = document.createElement("span");
    span.className = "ProductItem-nav-breadcrumb-separator";
    span.setAttribute("aria-hidden", "true");
    return span; // Native Squarespace CSS supplies the > symbol.
  }

  function render(container, product, data) {
    const preferred = originCategory(product);
    const categories = data.categories;
    const category = categories.find(c => categoryKey(c) === categoryKey(preferred)) ||
      categories[0] || null;
    const fragment = document.createDocumentFragment();
    fragment.appendChild(nativeLink(data.collectionTitle, product.collectionPath));
    if (category) {
      const url = new URL(product.collectionPath, location.origin);
      url.searchParams.set("category", category);
      fragment.appendChild(separator());
      fragment.appendChild(nativeLink(category, url.pathname + url.search));
    }
    fragment.appendChild(separator());
    const current = document.createElement("span");
    current.className = "ProductItem-nav-breadcrumb-link";
    const fullTitle = data.title || product.productTitle;
    const compact = fullTitle.replace(/\s+/g, " ").trim();
    current.textContent = compact.length > MAX_TITLE
      ? compact.slice(0, MAX_TITLE).trim() + "..." : compact;
    current.title = fullTitle;
    current.setAttribute("aria-current", "page");
    fragment.appendChild(current);
    container.replaceChildren(fragment);
    container.classList.remove("kb-v23-ready");
    // Force a fresh transition for Mercury navigation.
    void container.offsetWidth;
    container.classList.add("kb-v23-ready");
  }

  function waitForNative(run) {
    return new Promise(resolve => {
      const existing = document.querySelector(SELECTOR);
      if (existing) return resolve(existing);
      const observer = new MutationObserver(() => {
        if (run !== runId) { observer.disconnect(); clearTimeout(timer); resolve(null); return; }
        const el = document.querySelector(SELECTOR);
        if (el) { observer.disconnect(); clearTimeout(timer); resolve(el); }
      });
      const timer = setTimeout(() => { observer.disconnect(); resolve(null); }, 5000);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  async function start() {
    const run = ++runId;
    document.documentElement.classList.remove("kb-v23-product");
    const product = productContext();
    if (!product) return;
    injectCSS();
    document.documentElement.classList.add("kb-v23-product");
    const container = await waitForNative(run);
    if (!container || run !== runId) return;
    container.classList.remove("kb-v23-ready");
    try {
      const data = await productData(product);
      if (run !== runId || pathOf(location.href) !== product.productPath ||
          !container.isConnected) return;
      render(container, product, data);
    } catch (error) {
      console.warn("[Kerapho Breadcrumb V2.3]", error);
      if (run === runId && container.isConnected) container.classList.add("kb-v23-ready");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else { start(); }
  window.addEventListener("mercury:load", start);
  window.addEventListener("pageshow", start);
})();
