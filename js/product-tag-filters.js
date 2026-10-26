/* Kerapho — compact checkbox tag filters, v1.5.0. Uses native tag blocks; no network requests. */
(function () {
  "use strict";
  const VERSION = "1.5.0";
  if (window.KeraphoTagFilters?.version === VERSION) {
    window.KeraphoTagFilters.refresh();
    return;
  }
  window.KeraphoTagFilters?.destroy?.();
  const normalize = value => value.trim().normalize("NFC").toLocaleLowerCase("it");
  const groups = [
    ["Marchi", ["ACQUALIFE", "ARCADIA", "CIPI", "GB GROUP", "GEBERIT", "GSG", "PONTEGIULIO", "RELAX", "TREEMME", "VALDAMA", "IMPRONTA CERAMICHE", "SICHENIA", "SINTESI", "FAP CERAMICHE", "COTTO PETRUS", "GAMBINI", "DADO CERAMICA"]],
    ["Materiale lavabo", ["Lavabi in Cemento", "Lavabi in Ceramica", "Lavabi in Legno", "Lavabi in Metallo", "Lavabi in Resina", "Lavabi in Vetro"]],
    ["Installazione lavabo", ["Lavabi da Appoggio", "Lavabi Freestanding", "Freestanding"]],
    ["Installazione mobile", ["Mobili a Terra", "Mobili Sospesi"]],
    ["Sanitari", ["Sanitari a Terra", "WC Filoparete", "WC Sospesi", "WC Traslato"]],
    ["Rubinetteria", ["Miscelatori per Docce", "Miscelatori per Vasche"]],
    ["Colori", []], ["Misure", []], ["Altri filtri", []]
  ];
  const mapping = new Map();
  groups.forEach(([title, tags], index) => tags.forEach(tag => mapping.set(normalize(tag), index)));
  const dimensions = /^\d+(?:[.,]\d+)?\s*(?:[x×]\s*\d+(?:[.,]\d+)?\s*){1,2}(?:cm|mm|m)?$/i;
  const collator = new Intl.Collator("it", { numeric: true, sensitivity: "base" });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function label(tag, group) {
    if (group === "Colori") return tag.replace(/^colore\s+/i, "");
    if (group === "Materiale lavabo") return tag.replace(/^lavabi in\s+/i, "");
    if (group === "Installazione lavabo") return tag.replace(/^lavabi\s+/i, "");
    if (group === "Installazione mobile") return tag.replace(/^mobili\s+/i, "");
    if (group === "Misure") return tag.replace(/\s*[x×]\s*/gi, " × ").replace(/\s*(cm|mm|m)$/i, " $1");
    return normalize(tag) === "cipi" ? "Cipì" : tag;
  }

  const controllers = new Set();
  function slug(tag) {
    return normalize(tag)
      .replace(/[^a-z0-9_\s-]/g, "").replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
  }
  function readSelection(known) {
    const url = new URL(location.href);
    const values = [];
    for (const [parameter, prefix] of [["kf", ""], ["kc", "category:"]]) {
      try {
        const parsed = JSON.parse(url.searchParams.get(parameter) || "[]");
        if (Array.isArray(parsed)) parsed.filter(value => typeof value === "string")
          .forEach(value => values.push(prefix + normalize(value)));
      } catch (_) { /* Ignore malformed shared filter URLs. */ }
    }
    const nativeTag = url.searchParams.get("tag");
    const nativeCategory = url.searchParams.get("category");
    if (nativeTag) values.push(normalize(nativeTag));
    if (nativeCategory) values.push("category:" + normalize(nativeCategory));
    return new Set(values.filter(key => known.has(key)));
  }

  function mount() {
    [...controllers].forEach(cleanup => { if (!cleanup.target.isConnected) cleanup(); });
    const target = document.querySelector(".Main.Main--products-list .ProductList.products-collection-v2.sqs-pinterest-products-wrapper");
    const productGrid = target?.querySelector(".ProductList-grid");
    if (!target || !productGrid) return;
    const host = target.querySelector(".ProductList-filter.ProductList-filter--categories");
    if (!host) return;
    const baseLink = host.querySelector("a[href]");
    const collectionURL = new URL(baseLink?.getAttribute("href") || location.href, location.origin);
    if (collectionURL.origin !== location.origin) return;
    const collectionPath = collectionURL.pathname.replace(/\/+$/, "");
    const previous = host.querySelector(":scope > .kf-panel");
    for (const source of document.querySelectorAll(".sqs-tagcloud")) {
      if (previous?._kfUpdate && previous._keraphoSource === source && previous.dataset.category === (new URL(location.href).searchParams.get("category") || "")) {
        previous._kfUpdate?.();
        return;
      }
      const buckets = groups.map(() => []);
      const known = new Map();
      source.querySelectorAll("a[href]").forEach(link => {
        let url;
        try { url = new URL(link.getAttribute("href"), location.origin); } catch (_) { return; }
        if (url.origin !== location.origin || url.pathname.replace(/\/+$/, "") !== collectionPath) return;
        const tag = url.searchParams.get("tag");
        if (!tag || known.has(normalize(tag))) return;
        const key = normalize(tag);
        const group = /^colore\s+/i.test(tag) ? 6 : dimensions.test(tag) ? 7 : (mapping.get(key) ?? 8);
        const entry = { tag, key, group, kind: "tag", className: "tag-" + slug(tag) };
        known.set(key, entry);
        buckets[group].push(entry);
      });
      if (!known.size) continue;
      const categoryItems = [];
      target.querySelectorAll(".ProductList-filter--categories a[href]").forEach(link => {
        let url;
        try { url = new URL(link.getAttribute("href"), location.origin); } catch (_) { return; }
        if (url.origin !== location.origin || url.pathname.replace(/\/+$/, "") !== collectionPath) return;
        const tag = url.searchParams.get("category");
        if (!tag) return;
        const key = "category:" + normalize(tag);
        if (known.has(key)) return;
        const entry = { tag, key, group: "category", kind: "category", className: "category-" + slug(tag) };
        known.set(key, entry);
        categoryItems.push(entry);
      });
      if (!known.size) continue;
      let selected = readSelection(known);
      const panel = element("details", "kf-panel");
      panel.dataset.category = new URL(location.href).searchParams.get("category") || "";
      panel._keraphoSource = source;
      const initiallyOpen = window.matchMedia("(min-width: 768px)").matches;
      panel.open = initiallyOpen;
      const heading = element("summary", "kf-heading");
      const counter = element("span", "kf-hint");
      heading.append(element("span", "kf-title", "Filtra prodotti"), counter, element("span", "kf-chevron"));
      const body = element("div", "kf-body");
      const grid = element("div", "kf-grid");
      const inputs = [];
      const sections = [["Categorie", categoryItems], ...groups.map(([name], index) => [name, buckets[index]])];
      sections.forEach(([name, items], index) => {
        if (!items.length) return;
        items.sort((a, b) => collator.compare(a.tag, b.tag));
        const section = element("details", name === "Categorie" ? "kf-group kf-group--categories" : "kf-group");
        section.open = initiallyOpen;
        const summary = element("summary", "kf-group-heading", name);
        const badge = element("span", "kf-group-count");
        summary.append(badge, element("span", "kf-chevron"));
        const list = element("ul", "kf-list");
        items.forEach(item => {
          const li = element("li", "kf-item");
          const option = element("label", "kf-option");
          const input = element("input", "kf-checkbox");
          input.type = "checkbox";
          input.value = item.key;
          input.name = "kerapho-filter-" + index;
          input.checked = selected.has(item.key);
          inputs.push(input);
          option.append(input, element("span", "kf-option-text", label(item.tag, name)));
          li.append(option);
          list.append(li);
        });
        section.append(summary, list);
        grid.append(section);
      });
      const toolbar = element("div", "kf-toolbar");
      const status = element("span", "kf-status");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
      const reset = element("button", "kf-reset", "Azzera filtri");
      reset.type = "button";
      toolbar.append(status, reset);
      body.append(grid, toolbar, element("p", "kf-explanation", "Più opzioni nello stesso gruppo: una oppure l’altra. Gruppi diversi: condizioni combinate."));
      panel.append(heading, body);
      const empty = element("p", "kf-empty", "Nessun prodotto corrisponde ai filtri selezionati. Prova a rimuovere una selezione.");
      empty.hidden = true;
      productGrid.append(empty);
      const originalLinks = new Map();

      function selectedValues(kind) {
        return [...selected].map(key => known.get(key)).filter(entry => entry?.kind === kind).map(entry => entry.tag);
      }
      function writeSelection(url) {
        for (const [parameter, kind] of [["kf", "tag"], ["kc", "category"]]) {
          const values = selectedValues(kind);
          if (values.length) url.searchParams.set(parameter, JSON.stringify(values));
          else url.searchParams.delete(parameter);
        }
      }
      function updateLinks() {
        target.querySelectorAll(".ProductList-pagination a[href]").forEach(link => {
          if (!originalLinks.has(link)) originalLinks.set(link, link.getAttribute("href"));
          const url = new URL(originalLinks.get(link), location.origin);
          writeSelection(url);
          link.href = url.href;
        });
      }
      function updateAvailableTags(cards, prune = true) {
        const categories = [...selected].map(key => known.get(key))
          .filter(entry => entry?.kind === "category").map(entry => entry.className);
        const available = new Set();
        cards.forEach(card => {
          if (!categories.length || categories.some(name => card.classList.contains(name))) {
            card.classList.forEach(name => { if (name.startsWith("tag-")) available.add(name); });
          }
        });
        let removed = 0;
        inputs.forEach(input => {
          const entry = known.get(input.value);
          if (entry.kind !== "tag") return;
          // With no categories selected, restore every tag from the collection cloud.
          const exists = !categories.length || available.has(entry.className);
          input.closest(".kf-item").hidden = !exists;
          if (!exists && prune && selected.delete(entry.key)) removed++;
        });
        grid.querySelectorAll(".kf-group:not(.kf-group--categories)").forEach(section => {
          section.hidden = ![...section.querySelectorAll(".kf-item")].some(item => !item.hidden);
        });
        return removed;
      }
      function updateContextualTags(cards, activeGroups) {
        const availableByGroup = new Map();
        known.forEach(entry => {
          if (entry.kind !== "tag" || availableByGroup.has(entry.group)) return;
          const available = new Set();
          cards.forEach(card => {
            const matchesOthers = [...activeGroups].every(([group, names]) =>
              group === entry.group || names.some(name => card.classList.contains(name)));
            if (matchesOthers) card.classList.forEach(name => {
              if (name.startsWith("tag-")) available.add(name);
            });
          });
          availableByGroup.set(entry.group, available);
        });
        inputs.forEach(input => {
          const entry = known.get(input.value);
          if (entry.kind !== "tag") return;
          // Ignore this option's own group so alternatives can still be added (OR).
          // Keep selected options reachable even when other filters give zero matches.
          const available = !selected.size || availableByGroup.get(entry.group).has(entry.className);
          input.closest(".kf-item").hidden = !available && !selected.has(entry.key);
        });
        grid.querySelectorAll(".kf-group:not(.kf-group--categories)").forEach(section => {
          section.hidden = ![...section.querySelectorAll(".kf-item")].some(item => !item.hidden);
        });
      }
      function apply() {
        const cards = [...productGrid.querySelectorAll(".ProductList-item")];
        const currentURL = new URL(location.href);
        // A native filtered page is a server-side subset. Do not discard selections
        // until commitSelection has reloaded the base collection.
        const nativeFiltered = currentURL.searchParams.has("tag") || currentURL.searchParams.has("category");
        if (updateAvailableTags(cards, !nativeFiltered)) {
          writeSelection(currentURL);
          window.history.replaceState(window.history.state, "", currentURL.href);
        }
        const activeGroups = new Map();
        selected.forEach(key => {
          const entry = known.get(key);
          if (!entry) return;
          if (!activeGroups.has(entry.group)) activeGroups.set(entry.group, []);
          activeGroups.get(entry.group).push(entry.className);
        });
        updateContextualTags(cards, activeGroups);
        let visible = 0;
        cards.forEach(card => {
          const matches = [...activeGroups.values()].every(tags => tags.some(tag => card.classList.contains(tag)));
          card.classList.toggle("kf-hidden", !matches);
          if (matches) visible++;
        });
        const paginated = Boolean(target.querySelector(".ProductList-pagination a[href]"));
        const scope = paginated ? " in questa pagina" : "";
        counter.textContent = visible + (visible === 1 ? " prodotto" : " prodotti") + scope;
        status.textContent = counter.textContent + (selected.size ? " · " + selected.size + " filtri selezionati" : "");
        reset.disabled = !selected.size;
        empty.hidden = visible > 0;
        inputs.forEach(input => { input.checked = selected.has(input.value); });
        grid.querySelectorAll(".kf-group").forEach(section => {
          const count = [...section.querySelectorAll("input")].filter(input => selected.has(input.value)).length;
          section.querySelector(".kf-group-count").textContent = count ? String(count) : "";
        });
        updateLinks();
      }
      function commitSelection() {
        const url = new URL(location.href);
        const nativeFiltered = url.searchParams.has("tag") || url.searchParams.has("category");
        if (!nativeFiltered) updateAvailableTags([...productGrid.querySelectorAll(".ProductList-item")]);
        url.searchParams.delete("tag");
        url.searchParams.delete("category");
        writeSelection(url);
        // Native category/tag pages contain a subset: reload the base collection
        // once so checkbox OR selections can use all matching segments.
        if (nativeFiltered) {
          url.searchParams.delete("page");
          url.searchParams.delete("offset");
          window.location.assign(url.href);
          return;
        }
        window.history.replaceState(window.history.state, "", url.href);
        apply();
        window.dispatchEvent(new Event("resize"));
      }
      panel.addEventListener("change", event => {
        if (!event.target.matches(".kf-checkbox")) return;
        if (event.target.checked) selected.add(event.target.value);
        else selected.delete(event.target.value);
        commitSelection();
      });
      reset.addEventListener("click", () => { selected.clear(); commitSelection(); });
      panel._kfUpdate = () => { selected = readSelection(known); apply(); };
      function cleanup() {
        productGrid.querySelectorAll(".kf-hidden").forEach(card => card.classList.remove("kf-hidden"));
        originalLinks.forEach((href, link) => { if (link.isConnected) link.setAttribute("href", href); });
        host.classList.remove("kf-filter-host");
        productGrid.classList.remove("kf-product-grid");
        empty.remove();
        panel.remove();
        source.classList.remove("kf-source");
        source.closest(".sqs-block-tagcloud")?.classList.remove("kf-source-block");
        controllers.delete(cleanup);
      }
      cleanup.target = target;
      previous?._kfCleanup?.();
      if (previous?.isConnected) previous.remove();
      panel._kfCleanup = cleanup;
      controllers.add(cleanup);
      productGrid.classList.add("kf-product-grid");
      host.append(panel);
      host.classList.add("kf-filter-host");
      source.classList.add("kf-source");
      source.closest(".sqs-block-tagcloud")?.classList.add("kf-source-block");
      apply();
      break;
    }
  }

  let queued = false;
  let stopped = false;
  function refresh() {
    if (queued || stopped) return;
    queued = true;
    window.requestAnimationFrame(() => { queued = false; if (!stopped) mount(); });
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 &&
      !node.matches(".kf-panel, .kf-panel *, .kf-empty") &&
      (node.matches(".sqs-tagcloud, .Main.Main--products-list, .ProductList.products-collection-v2, .ProductList-item") ||
        node.querySelector(".sqs-tagcloud, .Main.Main--products-list, .ProductList.products-collection-v2, .ProductList-item"))))) refresh();
  });
  window.KeraphoTagFilters = {
    refresh, version: VERSION,
    destroy() {
      stopped = true;
      observer.disconnect();
      window.removeEventListener("mercury:load", refresh);
      window.removeEventListener("popstate", refresh);
      document.removeEventListener("DOMContentLoaded", refresh);
      [...controllers].forEach(cleanup => cleanup());
      delete window.KeraphoTagFilters;
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh, { once: true });
  else refresh();
  window.addEventListener("mercury:load", refresh);
  window.addEventListener("popstate", refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
