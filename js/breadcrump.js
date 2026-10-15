/* Nasconde la breadcrumb nativa finché non è pronta */
body:not(.kerapho-breadcrumb-ready) .ProductItem-breadcrumbs,
body:not(.kerapho-breadcrumb-ready) .product-breadcrumbs,
body:not(.kerapho-breadcrumb-ready) .breadcrumbs {
  visibility: hidden !important;
}

/* Mostra la breadcrumb quando è stata aggiornata */
body.kerapho-breadcrumb-ready .ProductItem-breadcrumbs,
body.kerapho-breadcrumb-ready .product-breadcrumbs,
body.kerapho-breadcrumb-ready .breadcrumbs {
  visibility: visible !important;
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function () {

  const SHOP_PATH = "/shop";
  const MAX_PRODUCT_LENGTH = 35;
  const CACHE_PREFIX = "kerapho_breadcrumb_category_";

  const CATEGORIES = [
    "Wallpaper",
    "Cemento",
    "Cotto",
    "Gres Per Esterno",
    "Elementi e Listelli",
    "Legno",
    "Maioliche",
    "Marmo",
    "Metallo",
    "Mosaico",
    "Pietre e Muretti",
    "Resina",
    "Campione",
    "Offerte"
  ];


  /* =========================================
     NORMALIZZA URL
     ========================================= */

  function normalizePath(url) {

    try {

      return new URL(
        url,
        window.location.origin
      )
      .pathname
      .replace(/\/$/, "")
      .toLowerCase();

    } catch (e) {

      return "";

    }

  }


  const currentPath =
    normalizePath(window.location.href);


  /* =========================================
     SOLO PAGINE PRODOTTO
     ========================================= */

  if (
    !currentPath.startsWith("/shop/") ||
    currentPath === "/shop"
  ) {

    document.body.classList.add(
      "kerapho-breadcrumb-ready"
    );

    return;

  }


  /* =========================================
     CACHE
     ========================================= */

  function getCacheKey() {

    return (
      CACHE_PREFIX +
      currentPath
    );

  }


  function getCachedCategory() {

    try {

      return localStorage.getItem(
        getCacheKey()
      );

    } catch (e) {

      return null;

    }

  }


  function saveCachedCategory(category) {

    if (!category) return;

    try {

      localStorage.setItem(
        getCacheKey(),
        category
      );

    } catch (e) {}

  }


  /* =========================================
     CERCA IL PRODOTTO NELLA CATEGORIA
     ========================================= */

  async function productIsInCategory(category) {

    try {

      const url =
        SHOP_PATH +
        "?category=" +
        encodeURIComponent(category);

      const response =
        await fetch(
          url,
          {
            credentials: "same-origin"
          }
        );

      if (!response.ok) {

        return false;

      }


      const html =
        await response.text();


      const doc =
        new DOMParser()
        .parseFromString(
          html,
          "text/html"
        );


      const links =
        doc.querySelectorAll(
          "a[href]"
        );


      for (const link of links) {

        const linkPath =
          normalizePath(
            link.getAttribute("href")
          );


        if (
          linkPath === currentPath
        ) {

          return true;

        }

      }


      return false;

    } catch (e) {

      console.warn(
        "Kerapho breadcrumb - errore categoria:",
        category,
        e
      );

      return false;

    }

  }


  /* =========================================
     TROVA CATEGORIA IN PARALLELO
     ========================================= */

  async function findCategory() {

    /*
     * Prima prova la cache
     */

    const cachedCategory =
      getCachedCategory();

    if (cachedCategory) {

      return cachedCategory;

    }


    /*
     * Se non è in cache,
     * controlla tutte le categorie insieme
     */

    const checks =
      await Promise.all(

        CATEGORIES.map(
          async function (category) {

            const found =
              await productIsInCategory(
                category
              );

            return found
              ? category
              : null;

          }
        )

      );


    const category =
      checks.find(
        item => item !== null
      ) || null;


    if (category) {

      saveCachedCategory(
        category
      );

    }


    return category;

  }


  /* =========================================
     TROVA BREADCRUMB NATIVA
     ========================================= */

  function findNativeBreadcrumb() {

    const links =
      document.querySelectorAll(
        "a[href]"
      );


    for (const currentLink of links) {

      if (
        normalizePath(
          currentLink.getAttribute("href")
        ) !== currentPath
      ) {

        continue;

      }


      let parent =
        currentLink.parentElement;

      let depth = 0;


      while (
        parent &&
        depth < 6
      ) {

        const parentLinks =
          parent.querySelectorAll(
            "a[href]"
          );

        let shopLink =
          null;


        for (
          const link of parentLinks
        ) {

          if (
            normalizePath(
              link.getAttribute("href")
            ) === "/shop"
          ) {

            shopLink =
              link;

            break;

          }

        }


        if (shopLink) {

          return {
            container: parent,
            currentLink: currentLink
          };

        }


        parent =
          parent.parentElement;

        depth++;

      }

    }


    return null;

  }


  /* =========================================
     ACCORCIA NOME PRODOTTO
     ========================================= */

  function shortenProductName(name) {

    const cleanName =
      name
      .replace(/\s+/g, " ")
      .trim();


    if (
      cleanName.length <=
      MAX_PRODUCT_LENGTH
    ) {

      return cleanName;

    }


    return (
      cleanName
      .substring(
        0,
        MAX_PRODUCT_LENGTH
      )
      .trim() +
      "..."
    );

  }


  /* =========================================
     AGGIORNA BREADCRUMB
     ========================================= */

  async function updateBreadcrumb() {

    const breadcrumb =
      findNativeBreadcrumb();


    if (!breadcrumb) {

      /*
       * Squarespace potrebbe non averla
       * ancora renderizzata.
       */

      setTimeout(
        updateBreadcrumb,
        100
      );

      return;

    }


    /*
     * Salva il titolo originale prima
     * di modificare il contenitore.
     */

    const originalProductName =
      breadcrumb.currentLink
      .textContent
      .trim();


    const shortProductName =
      shortenProductName(
        originalProductName
      );


    /*
     * Trova categoria:
     * dalla cache è praticamente immediata.
     */

    const category =
      await findCategory();


    const container =
      breadcrumb.container;


    /*
     * Svuota breadcrumb nativa
     */

    container.innerHTML =
      "";


    /* =================================
       SHOP
       ================================= */

    const shop =
      document.createElement(
        "a"
      );

    shop.href =
      "/shop";

    shop.textContent =
      "Shop";

    container.appendChild(
      shop
    );


    /* =================================
       CATEGORIA
       ================================= */

    if (category) {

      container.appendChild(
        document.createTextNode(
          " / "
        )
      );


      const categoryLink =
        document.createElement(
          "a"
        );


      categoryLink.href =
        "/shop?category=" +
        encodeURIComponent(
          category
        );


      categoryLink.textContent =
        category;


      container.appendChild(
        categoryLink
      );

    }


    /* =================================
       PRODOTTO
       ================================= */

    container.appendChild(
      document.createTextNode(
        " / "
      )
    );


    const current =
      document.createElement(
        "span"
      );


    current.textContent =
      shortProductName;


    current.setAttribute(
      "aria-current",
      "page"
    );


    current.setAttribute(
      "title",
      originalProductName
    );


    container.appendChild(
      current
    );


    /*
     * Mostra breadcrumb aggiornata
     */

    document.body.classList.add(
      "kerapho-breadcrumb-ready"
    );

  }


  /* =========================================
     AVVIO IMMEDIATO
     ========================================= */

  updateBreadcrumb();

});
