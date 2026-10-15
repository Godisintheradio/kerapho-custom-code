


(function () {
  "use strict";

  const SOURCE = "/mega-menu";
  const PANEL_ID = "kerapho-mega-menu";
  const desktop = window.matchMedia("(min-width: 768px)");

  function init() {
    if (document.getElementById(PANEL_ID)) return;

    const triggers = Array.from(
      document.querySelectorAll(".Header-nav a[href]")
    ).filter(function (link) {
      const url = new URL(link.href, location.origin);

      return (
        url.origin === location.origin &&
        url.pathname.replace(/\/+$/, "") === SOURCE
      );
    });

    if (!triggers.length) return;

    const panel = document.createElement("div");

    panel.id = PANEL_ID;
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Categorie prodotti");

    document.body.appendChild(panel);

    let loading = null;
    let loaded = false;
    let activeTrigger = null;
    let closeTimer = null;
    let wantsOpen = false;

    triggers.forEach(function (link) {
      link.setAttribute("aria-controls", PANEL_ID);
      link.setAttribute("aria-expanded", "false");
    });

    function cancelClose() {
      window.clearTimeout(closeTimer);
    }

    function positionPanel() {
      if (!activeTrigger) return;

      const header = activeTrigger.closest("header");
      const anchor = header || activeTrigger;
      const bottom = anchor.getBoundingClientRect().bottom;

      const top = Math.max(
        0,
        Math.min(window.innerHeight, Math.round(bottom))
      );

      panel.style.top = top + "px";
      panel.style.maxHeight =
        Math.max(0, window.innerHeight - top) + "px";
    }

    function close() {
      cancelClose();
      wantsOpen = false;
      panel.hidden = true;

      triggers.forEach(function (link) {
        link.classList.remove("kerapho-mega-active");
        link.setAttribute("aria-expanded", "false");
      });
    }

    function scheduleClose() {
      cancelClose();

      closeTimer = window.setTimeout(function () {
        if (
          panel.contains(document.activeElement) ||
          triggers.includes(document.activeElement)
        ) return;

        close();
      }, 220);
    }

    function loadContent() {
      if (loaded) return Promise.resolve();
      if (loading) return loading;

      loading = fetch(SOURCE, {
        credentials: "same-origin"
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }

          return response.text();
        })
        .then(function (html) {
          const doc = new DOMParser().parseFromString(
            html,
            "text/html"
          );

          const content = doc.querySelector(
            "main.Main .Main-content"
          );

          if (!content) {
            throw new Error("Contenuto mega menu non trovato");
          }

          const copy = content.cloneNode(true);

          /* Il test supporta testi, link e immagini statiche. */
          copy.querySelectorAll("script").forEach(function (el) {
            el.remove();
          });

          /* Attiva le immagini caricate normalmente da Squarespace. */
          copy.querySelectorAll("img").forEach(function (img) {
            const source = img.getAttribute("data-src");

            if (source) {
              img.setAttribute("src", source);
            }

            img.setAttribute("loading", "eager");
          });

          panel.replaceChildren(copy);
          loaded = true;
        })
        .catch(function (error) {
          loading = null;
          console.warn("Kerapho mega menu:", error);
          throw error;
        });

      return loading;
    }

    async function open(link) {
      if (!desktop.matches) return;

      cancelClose();
      wantsOpen = true;
      activeTrigger = link;

      try {
        await loadContent();
      } catch (error) {
        close();
        return;
      }

      if (
        !wantsOpen ||
        !desktop.matches ||
        activeTrigger !== link
      ) return;

      triggers.forEach(function (item) {
        const active = item === link;

        item.classList.toggle("kerapho-mega-active", active);
        item.setAttribute(
          "aria-expanded",
          active ? "true" : "false"
        );
      });

      positionPanel();
      panel.hidden = false;
    }

    triggers.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        open(link);
      });

      link.addEventListener("mouseleave", scheduleClose);

      link.addEventListener("focus", function () {
        open(link);
      });

      link.addEventListener("blur", scheduleClose);

      link.addEventListener("click", function (event) {
        if (!desktop.matches) return;

        /* Conserva apertura in nuova scheda e clic modificati. */
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) return;

        /* Se il recupero fallisce, il link resta utilizzabile. */
        if (!loaded) return;

        event.preventDefault();
        open(link);
      });
    });

    panel.addEventListener("mouseenter", cancelClose);
    panel.addEventListener("mouseleave", scheduleClose);
    panel.addEventListener("focusin", cancelClose);
    panel.addEventListener("focusout", scheduleClose);

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || panel.hidden) return;

      const link = activeTrigger;

      if (link && panel.contains(document.activeElement)) {
        link.focus();
      }

      close();
    });

    document.addEventListener("click", function (event) {
      if (
        panel.hidden ||
        panel.contains(event.target) ||
        triggers.some(function (link) {
          return link.contains(event.target);
        })
      ) return;

      close();
    });

    window.addEventListener("resize", function () {
      if (!desktop.matches) {
        close();
      } else if (!panel.hidden) {
        positionPanel();
      }
    });

    window.addEventListener("scroll", function () {
      if (!panel.hidden) positionPanel();
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
