/* KERAPHO mobile navigation v2 — H3 groups from /mega-menu.
 * Keep the native drawer/close/scroll handling and desktop mega-menu.js.
 */
(function () {
  "use strict";
  if (window.__keraphoMobileMenuV2) return;
  window.__keraphoMobileMenuV2 = true;
  let request = null;
  let installed = false;
  const smallScreen = window.matchMedia("(max-width: 1024px)");

  function safeLink(source) {
    const raw = source.getAttribute("href");
    if (!raw) return null;
    let url;
    try { url = new URL(raw, location.origin); } catch (_) { return null; }
    if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return null;
    const link = document.createElement("a");
    link.href = url.href;
    link.textContent = source.textContent.trim();
    if (!link.textContent) return null;
    if (source.getAttribute("target") === "_blank") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    return link;
  }

  function extract(content) {
    const groups = [];
    let current = null;
    content.querySelectorAll(".sqs-block-html h3, .sqs-block-html a[href]").forEach(function (node) {
      if (node.tagName === "H3") {
        const title = node.textContent.trim();
        if (!title) return;
        const source = node.querySelector("a[href]");
        current = {title: title, link: source ? safeLink(source) : null, links: []};
        groups.push(current);
      } else if (current && !node.closest("h3")) {
        const link = safeLink(node);
        if (link) current.links.push(link);
      }
    });
    return groups;
  }

  function styles() {
    if (document.getElementById("kerapho-mobile-accordion-style")) return;
    const style = document.createElement("style");
    style.id = "kerapho-mobile-accordion-style";
    style.textContent = `
#kerapho-mobile-accordion{width:100%;box-sizing:border-box;text-align:left;color:#111;background:#fff;margin:10px 0 22px}
#kerapho-mobile-accordion *{box-sizing:border-box}
#kerapho-mobile-accordion .km-group{border-bottom:1px solid #e9e9e9}
#kerapho-mobile-accordion .km-row{display:flex;align-items:center;min-height:56px;gap:8px}
#kerapho-mobile-accordion a{color:#111!important;text-decoration:none!important;border:0!important;background-image:none!important;overflow-wrap:anywhere}
#kerapho-mobile-accordion .km-title{display:block;flex:1;min-width:0;margin:0;padding:16px 4px;font:600 17px/1.35 inherit; font-family:inherit;font-size:17px;font-weight:600;line-height:1.35}
#kerapho-mobile-accordion button{appearance:none;border:0;background:transparent;color:inherit;cursor:pointer;font-family:inherit}
#kerapho-mobile-accordion button.km-title{text-align:left}
#kerapho-mobile-accordion .km-toggle{flex:0 0 48px;width:48px;min-height:48px;font-size:26px;line-height:1}
#kerapho-mobile-accordion .km-links{margin:0;padding:0 12px 14px;list-style:none}
#kerapho-mobile-accordion .km-links a{display:flex;align-items:center;min-height:44px;padding:10px 4px;font-size:15px;line-height:1.4}
#kerapho-mobile-accordion [hidden]{display:none!important}
#kerapho-mobile-accordion .km-group.is-open .km-title,#kerapho-mobile-accordion .km-group.is-open .km-toggle,#kerapho-mobile-accordion a:hover{color:hsl(0,100%,36%)!important}
#kerapho-mobile-accordion a:focus-visible,#kerapho-mobile-accordion button:focus-visible{outline:2px solid hsl(0,100%,36%);outline-offset:2px}
`;
    document.head.appendChild(style);
  }

  function build(groups) {
    const root = document.createElement("nav");
    root.id = "kerapho-mobile-accordion";
    root.setAttribute("aria-label", "Categorie prodotti");
    groups.forEach(function (data, index) {
      const group = document.createElement("div");
      group.className = "km-group";
      const row = document.createElement("div");
      row.className = "km-row";
      const list = document.createElement("ul");
      list.className = "km-links";
      list.id = "km-category-" + index;
      list.hidden = true;
      const title = data.link || document.createElement(data.links.length ? "button" : "span");
      if (!data.link) title.textContent = data.title;
      title.className = "km-title";
      if (title.tagName === "BUTTON") title.type = "button";
      row.appendChild(title);
      if (data.links.length) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "km-toggle";
        toggle.textContent = "+";
        toggle.setAttribute("aria-controls", list.id);
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Espandi " + data.title);
        function setOpen(open) {
          group.classList.toggle("is-open", open);
          list.hidden = !open;
          toggle.textContent = open ? "−" : "+";
          toggle.setAttribute("aria-expanded", String(open));
          toggle.setAttribute("aria-label", (open ? "Chiudi " : "Espandi ") + data.title);
          if (title.tagName === "BUTTON") title.setAttribute("aria-expanded", String(open));
        }
        group.kmClose = function () {setOpen(false);};
        function change(event) {
          event.preventDefault();
          event.stopPropagation();
          const open = list.hidden;
          Array.from(root.children).forEach(function (other) {
            if (other !== group && other.kmClose) other.kmClose();
          });
          setOpen(open);
        }
        toggle.addEventListener("click", change);
        row.appendChild(toggle);
        if (title.tagName === "BUTTON") {
          title.setAttribute("aria-controls", list.id);
          title.setAttribute("aria-expanded", "false");
          title.addEventListener("click", change);
        }
        data.links.forEach(function (link) {
          const li = document.createElement("li");
          li.appendChild(link);
          list.appendChild(li);
        });
        list.addEventListener("keydown", function (event) {
          if (event.key !== "Escape" || list.hidden) return;
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.focus();
        });
      }
      group.append(row, list);
      root.appendChild(group);
    });
    return root;
  }

  function start() {
    if (installed || request || !smallScreen.matches) return;
    const menu = document.querySelector(".Mobile-overlay-nav");
    if (!menu) return;
    const trigger = Array.from(menu.querySelectorAll("a[href]")).find(function (a) {
      const url = new URL(a.href, location.origin);
      return url.origin === location.origin && url.pathname.replace(/\/+$/, "") === "/mega-menu";
    });
    if (!trigger) return;
    request = fetch("/mega-menu", {credentials: "same-origin"})
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const content = doc.querySelector("main.Main .Main-content");
        if (!content) throw new Error("Contenuto /mega-menu non trovato");
        const groups = extract(content);
        if (!groups.length) throw new Error("Nessun gruppo H3 trovato");
        if (!trigger.isConnected || document.getElementById("kerapho-mobile-accordion")) return;
        const root = build(groups);
        styles();
        trigger.insertAdjacentElement("afterend", root);
        // Only hide the source link after a complete menu is available.
        trigger.hidden = true;
        trigger.style.setProperty("display", "none", "important");
        const old = document.getElementById("kerapho-mobile-mega");
        if (old) old.remove();
        installed = true;
        document.removeEventListener("pointerdown", start);
        document.removeEventListener("click", start);
        observer.disconnect();
      })
      .catch(function (error) {
        // Keep the native Products link usable; no automatic request loop.
        console.warn("Kerapho mobile menu v2:", error);
      });
  }
  const observer = new MutationObserver(function () {
    if (!request && !installed) start();
  });
  function init() {
    observer.observe(document.body, {childList:true, subtree:true});
    document.addEventListener("pointerdown", start, {passive:true});
    document.addEventListener("click", start, {passive:true});
    smallScreen.addEventListener("change", start);
    start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
