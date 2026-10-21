/* Kerapho — compact checkbox tag filters, v1.1.0. No product requests. */
(function () {
  "use strict";
  const VERSION = "1.1.0";
  if (window.KeraphoTagFilters?.version === VERSION) {
    window.KeraphoTagFilters.refresh();
    return;
  }
  window.KeraphoTagFilters?.destroy?.();
  const normalize = value => value.trim().normalize("NFC").toLocaleLowerCase("it");
  const groups = [
    ["Marchi", ["ACQUALIFE", "ARCADIA", "CIPI", "GB GROUP", "GEBERIT", "GSG", "PONTEGIULIO", "RELAX", "TREEMME", "VALDAMA"]],
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
    return normalize(tag).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function readSelection(known) {
    const url = new URL(location.href);
    let values = [];
    try {
      const parsed = JSON.parse(url.searchParams.get("kf") || "[]");
      if (Array.isArray(parsed)) values = parsed;
    } catch (_) { /* Ignore malformed shared filter URLs. */ }
    const nativeTag = url.searchParams.get("tag");
    if (nativeTag) values.push(nativeTag);
    return new Set(values.filter(tag => typeof tag === "string")
      .map(normalize).filter(tag => known.has(tag)));
  }

  function mount() {
    [...controllers].forEach(cleanup => { if (!cleanup.target.isConnected) cleanup(); });
    if (location.pathname.replace(/\/+$/, "") !== "/arredo-bagno") return;
    const target = document.querySelector(".Main.Main--products-list .ProductList.products-collection-v2.sqs-pinterest-products-wrapper");
    const productGrid = target?.querySelector(".ProductList-grid");
    if (!target || !productGrid) return;
    const previous = target.querySelector(":scope > .kf-panel");
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
        if (url.origin !== location.origin || url.pathname.replace(/\/+$/, "") !== "/arredo-bagno") return;
        const tag = url.searchParams.get("tag");
        if (!tag || known.has(normalize(tag))) return;
        const key = normalize(tag);
        const group = /^colore\s+/i.test(tag) ? 6 : dimensions.test(tag) ? 7 : (mapping.get(key) ?? 8);
        const entry = { tag, key, group, className: "tag-" + slug(tag) };
        known.set(key, entry);
        buckets[group].push(entry);
      });
      if (!known.size) continue;
      let selected = readSelection(known);
      const panel = element("details", "kf-panel");
      panel.dataset.category = new URL(location.href).searchParams.get("category") || "";
      panel._keraphoSource = source;
      panel.open = false;
      const heading = element("summary", "kf-heading");
      const counter = element("span", "kf-hint");
      heading.append(element("span", "kf-title", "Filtra prodotti"), counter, element("span", "kf-chevron"));
      const body = element("div", "kf-body");
      const grid = element("div", "kf-grid");
      const inputs = [];
      groups.forEach(([name], index) => {
        const items = buckets[index];
        if (!items.length) return;
        items.sort((a, b) => collator.compare(a.tag, b.tag));
        const section = element("details", "kf-group");
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

      function updateLinks() {
        target.querySelectorAll(".ProductList-filter a[href], .ProductList-pagination a[href]").forEach(link => {
          if (!originalLinks.has(link)) originalLinks.set(link, link.getAttribute("href"));
          const url = new URL(originalLinks.get(link), location.origin);
          if (selected.size) url.searchParams.set("kf", JSON.stringify([...selected].map(key => known.get(key).tag)));
          else url.searchParams.delete("kf");
          link.href = url.href;
        });
      }
      function apply() {
        const activeGroups = new Map();
        selected.forEach(key => {
          const entry = known.get(key);
          if (!entry) return;
          if (!activeGroups.has(entry.group)) activeGroups.set(entry.group, []);
          activeGroups.get(entry.group).push(entry.className);
        });
        const cards = [...productGrid.querySelectorAll(".ProductList-item")];
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
        const nativeFiltered = url.searchParams.has("tag");
        url.searchParams.delete("tag");
        if (selected.size) url.searchParams.set("kf", JSON.stringify([...selected].map(key => known.get(key).tag)));
        else url.searchParams.delete("kf");
        // A native tag page contains only a subset: reload the category/base page
        // once so OR selections can include products outside that original tag.
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
      target.prepend(panel);
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
