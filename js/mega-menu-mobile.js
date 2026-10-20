/* Kerapho: mobile mega menu extension. Desktop remains in mega-menu.js. */
(function () {
  "use strict";
  function init() {
    const menu = document.querySelector(".Mobile-overlay-nav");
    if (!menu || document.getElementById("kerapho-mobile-mega")) return;
    const trigger = Array.from(menu.querySelectorAll("a[href]")).find(function (a) {
      const u = new URL(a.href, location.origin);
      return u.origin === location.origin && u.pathname.replace(/\/+$/, "") === "/mega-menu";
    });
    if (!trigger) return;
    if (!document.getElementById("kerapho-mobile-mega-style")) {
      const style = document.createElement("style");
      style.id = "kerapho-mobile-mega-style";
      style.textContent = `
.kerapho-mobile-mega-trigger{display:flex!important;align-items:center;justify-content:space-between;gap:16px}
.kerapho-mobile-mega-trigger::after{content:"+";flex:0 0 auto;font-size:24px;font-weight:400;line-height:1}
.kerapho-mobile-mega-trigger[aria-expanded="true"]::after{content:"−"}
.kerapho-mobile-mega-trigger[aria-expanded="true"]{color:hsl(0,100%,36%)!important}
#kerapho-mobile-mega[hidden]{display:none!important}
#kerapho-mobile-mega{box-sizing:border-box;width:100%;min-width:0;margin:8px 0 20px;padding:16px;background:#f7f7f7;color:#222;border-radius:10px;text-align:left}
#kerapho-mobile-mega .Main-content{width:100%;max-width:none;margin:0;padding:0;box-sizing:border-box}
#kerapho-mobile-mega .sqs-layout>.sqs-row{margin-left:0;margin-right:0}
#kerapho-mobile-mega .sqs-row>[class*="sqs-col-"]{float:none;width:100%!important}
#kerapho-mobile-mega .sqs-block{padding:10px 0}
#kerapho-mobile-mega .sqs-block-spacer{display:none}
#kerapho-mobile-mega h1,#kerapho-mobile-mega h2,#kerapho-mobile-mega h3{margin:8px 0 12px;font-size:18px;line-height:1.3}
#kerapho-mobile-mega p,#kerapho-mobile-mega li{font-size:15px;line-height:1.6}
#kerapho-mobile-mega a{color:#000!important;text-decoration:none!important;border-bottom:none!important;background-image:none!important;overflow-wrap:anywhere}
#kerapho-mobile-mega a:hover,#kerapho-mobile-mega a:focus-visible{color:hsl(0,100%,36%)!important}
#kerapho-mobile-mega a:focus-visible,.kerapho-mobile-mega-trigger:focus-visible{outline:2px solid currentColor;outline-offset:3px}
`;
      document.head.appendChild(style);
    }
    const panel = document.createElement("div");
    panel.id = "kerapho-mobile-mega";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Categorie prodotti");
    trigger.insertAdjacentElement("afterend", panel);
    trigger.classList.add("kerapho-mobile-mega-trigger");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-controls", panel.id);
    trigger.setAttribute("aria-expanded", "false");
    let loaded = false;
    let loading = null;
    function setOpen(open) {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    }
    function load() {
      if (loaded) return Promise.resolve();
      if (loading) return loading;
      panel.textContent = "Caricamento…";
      panel.setAttribute("aria-busy", "true");
      loading = fetch("/mega-menu", {credentials:"same-origin"})
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (html) {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const content = doc.querySelector("main.Main .Main-content");
          if (!content) throw new Error("Contenuto mega menu non trovato");
          const copy = content.cloneNode(true);
          copy.querySelectorAll("script").forEach(function (el) {el.remove();});
          copy.querySelectorAll("img[data-src]").forEach(function (img) {
            img.src = img.getAttribute("data-src");
            img.loading = "lazy";
          });
          panel.replaceChildren(copy);
          loaded = true;
        })
        .catch(function (error) {
          loading = null;
          const fallback = document.createElement("a");
          fallback.href = "/mega-menu";
          fallback.textContent = "Apri tutte le categorie";
          panel.replaceChildren(fallback);
          console.warn("Kerapho mega menu mobile:", error);
        })
        .finally(function () {panel.removeAttribute("aria-busy");});
      return loading;
    }
    trigger.addEventListener("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const open = trigger.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (open) load();
    });
    trigger.addEventListener("keydown", function (event) {
      if (event.key !== " ") return;
      event.preventDefault();
      trigger.click();
    });
    panel.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.focus();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
