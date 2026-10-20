/* KERAPHO mobile navigation v3 — H3 groups from /mega-menu.
 * Independent mobile drawer; preserve desktop mega-menu.js.
 */
(function () {
  "use strict";
  if (window.__keraphoMobileMenuV3) return;
  window.__keraphoMobileMenuV3 = true;
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


  function init() {
    if (document.getElementById("kerapho-mobile-drawer")) return;
    styles();
    const style = document.createElement("style");
    style.textContent = `
#kerapho-mobile-drawer[hidden]{display:none!important}
#kerapho-mobile-drawer{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.4);color:#111}
#kerapho-mobile-drawer .km-sheet{position:absolute;inset:0 auto 0 0;width:min(92vw,440px);background:#fff;display:flex;flex-direction:column;box-shadow:8px 0 30px #0002}
#kerapho-mobile-drawer .km-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #eee;flex-shrink:0}
#kerapho-mobile-drawer .km-head strong{font-size:20px}
#kerapho-mobile-drawer .km-close{border:0;background:transparent;color:#111;width:48px;height:48px;font-size:32px;cursor:pointer}
#kerapho-mobile-drawer .km-body{overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 20px 24px;padding-bottom:max(24px,env(safe-area-inset-bottom));flex:1;min-height:0}
#kerapho-mobile-drawer .km-status{padding:24px 0;font-size:16px}
#kerapho-mobile-drawer a:focus-visible,#kerapho-mobile-drawer button:focus-visible{outline:2px solid hsl(0,100%,36%);outline-offset:2px}
`;
    document.head.appendChild(style);
    const overlay = document.createElement("div");
    overlay.id = "kerapho-mobile-drawer";
    overlay.hidden = true;
    const sheet = document.createElement("div");
    sheet.className = "km-sheet";
    sheet.setAttribute("role","dialog");
    sheet.setAttribute("aria-modal","true");
    sheet.setAttribute("aria-label","Menu Kerapho");
    const head = document.createElement("div");
    head.className = "km-head";
    const label = document.createElement("strong");
    label.textContent = "Menu";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "km-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label","Chiudi il menu");
    const body = document.createElement("div");
    body.className = "km-body";
    head.append(label,closeButton);
    sheet.append(head,body);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    let opener = null;
    let pending = null;
    let ready = false;
    let savedOverflow = "";
    let background = [];
    function close() {
      if (overlay.hidden) return;
      overlay.hidden = true;
      document.body.style.overflow = savedOverflow;
      background.forEach(function (entry) {entry[0].inert = entry[1];});
      background = [];
      if (opener) {
        opener.setAttribute("aria-expanded","false");
        opener.focus();
      }
    }
    function load() {
      if (ready || pending) return;
      body.textContent = "Caricamento categorie…";
      body.setAttribute("aria-busy","true");
      pending = fetch("/mega-menu",{credentials:"same-origin"})
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (html) {
          const doc = new DOMParser().parseFromString(html,"text/html");
          const content = doc.querySelector("main.Main .Main-content") || doc.querySelector("main");
          if (!content) throw new Error("Pagina sorgente non trovata");
          const groups = extract(content);
          if (!groups.length) throw new Error("Nessun H3 riconosciuto");
          body.replaceChildren(build(groups));
          ready = true;
        })
        .catch(function (error) {
          body.replaceChildren();
          const message = document.createElement("p");
          message.className = "km-status";
          message.textContent = "Non è stato possibile caricare le categorie.";
          const fallback = document.createElement("a");
          fallback.href = "/mega-menu";
          fallback.textContent = "Apri la pagina prodotti";
          const retry = document.createElement("button");
          retry.type = "button";
          retry.textContent = "Riprova";
          retry.addEventListener("click",function () {pending = null;load();});
          body.append(message,fallback,document.createElement("br"),retry);
          console.warn("Kerapho menu mobile:",error);
        })
        .finally(function () {body.removeAttribute("aria-busy");});
    }
    document.addEventListener("click",function (event) {
      const button = event.target.closest && event.target.closest("button.Mobile-bar-menu");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!overlay.hidden) {close();return;}
      opener = button;
      button.setAttribute("aria-controls",overlay.id);
      button.setAttribute("aria-expanded","true");
      savedOverflow = document.body.style.overflow;
      background = Array.from(document.body.children).filter(function (el) {return el !== overlay;})
        .map(function (el) {const original = el.inert;el.inert = true;return [el,original];});
      document.body.style.overflow = "hidden";
      overlay.hidden = false;
      closeButton.focus();
      load();
    },true);
    closeButton.addEventListener("click",close);
    overlay.addEventListener("click",function (event) {
      if (event.target === overlay || event.target.closest("a[href]")) close();
    });
    document.addEventListener("keydown",function (event) {
      if (overlay.hidden) return;
      if (event.key === "Escape") {event.preventDefault();close();return;}
      if (event.key !== "Tab") return;
      const items = Array.from(sheet.querySelectorAll("a[href],button")).filter(function (el) {
        return !el.disabled && el.getClientRects().length > 0;
      });
      const first = items[0], last = items[items.length-1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();first.focus();
      }
    });
    window.addEventListener("resize",function () {
      if (!smallScreen.matches) close();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
