/* Kerapho — grouped native tag links, v1.0.0. No product requests. */
(function () {
  "use strict";
  if (window.KeraphoTagFilters) {
    window.KeraphoTagFilters.refresh();
    return;
  }

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

  function mount() {
    if (location.pathname.replace(/\/+$/, "") !== "/arredo-bagno") return;
    const current = new URL(location.href);
    const active = normalize(current.searchParams.get("tag") || "");
    const desktop = window.matchMedia("(min-width: 768px)").matches;

    document.querySelectorAll(".sqs-tagcloud").forEach(source => {
      const previous = source.nextElementSibling;
      if (previous?.classList.contains("kf-panel") && previous.dataset.url === current.href) return;
      const buckets = groups.map(() => []);
      const seen = new Set();
      source.querySelectorAll("a[href]").forEach(link => {
        let url;
        try { url = new URL(link.getAttribute("href"), location.origin); } catch (_) { return; }
        if (url.origin !== location.origin || url.pathname.replace(/\/+$/, "") !== "/arredo-bagno") return;
        const tag = url.searchParams.get("tag");
        if (!tag || seen.has(normalize(tag))) return;
        seen.add(normalize(tag));
        const key = normalize(tag);
        const index = /^colore\s+/i.test(tag) ? 6 : dimensions.test(tag) ? 7 : (mapping.get(key) ?? 8);
        // Keep Squarespace's original destination: one native tag per navigation.
        buckets[index].push({ tag, href: url.href, selected: key === active });
      });
      if (!seen.size) return;

      const panel = element("details", "kf-panel");
      panel.dataset.url = current.href;
      panel.open = desktop || Boolean(active);
      const heading = element("summary", "kf-heading");
      const title = element("span", "kf-title", "Filtra prodotti");
      heading.append(title, element("span", "kf-hint", "Affina la tua ricerca"), element("span", "kf-chevron"));
      panel.append(heading);
      const body = element("div", "kf-body");
      if (active) {
        const bar = element("div", "kf-active");
        const selected = buckets.flat().find(item => item.selected);
        bar.append(element("span", "kf-active-label", "Filtro attivo"));
        const reset = element("a", "kf-reset", (selected?.tag || current.searchParams.get("tag")) + " ×");
        const resetURL = new URL(current.href);
        resetURL.searchParams.delete("tag");
        resetURL.searchParams.delete("page");
        resetURL.searchParams.delete("offset");
        reset.href = resetURL.href;
        reset.setAttribute("aria-label", "Rimuovi il filtro " + (selected?.tag || current.searchParams.get("tag")));
        bar.append(reset);
        body.append(bar);
      }
      const grid = element("div", "kf-grid");
      groups.forEach(([name], index) => {
        const items = buckets[index];
        if (!items.length) return;
        items.sort((a, b) => collator.compare(a.tag, b.tag));
        const section = element("details", "kf-group");
        section.open = desktop || items.some(item => item.selected);
        const summary = element("summary", "kf-group-heading", name);
        summary.append(element("span", "kf-chevron"));
        const list = element("ul", "kf-list");
        items.forEach(item => {
          const li = element("li", "kf-item");
          const link = element("a", "kf-link", label(item.tag, name));
          link.href = item.href;
          if (item.selected) link.setAttribute("aria-current", "page");
          li.append(link);
          list.append(li);
        });
        section.append(summary, list);
        grid.append(section);
      });
      body.append(grid);
      panel.append(body);
      if (previous?.classList.contains("kf-panel")) previous.remove();
      source.after(panel);
      // The stylesheet hides the source only after the replacement exists.
      source.classList.add("kf-source");
    });
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      mount();
    });
  }
  window.KeraphoTagFilters = { refresh, version: "1.0.0" };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh, { once: true });
  else refresh();
  window.addEventListener("mercury:load", refresh);
  window.addEventListener("popstate", refresh);
  // Handles Squarespace replacing page content, without polling or network calls.
  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 &&
      !node.matches(".kf-panel, .kf-panel *") &&
      (node.matches(".sqs-tagcloud, .sqs-tagcloud a") || node.querySelector(".sqs-tagcloud"))))) refresh();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
