(function () {

  'use strict';

  /* ==========================================================
     KERAPHO — GLOBAL PRODUCT SEARCH BAR
     Squarespace 7.0
     ========================================================== */

  /* ==========================================================
     1. CONFIGURAZIONE
     ========================================================== */

  const CONFIG = {

    collections: [

      {
        path: '/shop',
        label: 'Pavimenti e Rivestimenti'
      },

      {
        path: '/arredo-bagno',
        label: 'Arredo Bagno'
      },

      {
        path: '/detergenti',
        label: 'Detergenti'
      }

    ],

    minCharacters: 2,

    maxResults: 6,

    searchDelay: 180,

    preloadDelay: 800,

    mobileBreakpoint: 640,

    cacheKey: 'kerapho-global-product-search-v2',

    /* Cache: 1 ora */
    cacheTTL: 60 * 60 * 1000

  };

  /* ==========================================================
     2. STATO
     ========================================================== */

  let productIndex = [];

  let loadingPromise = null;

  let searchContainer = null;

  let searchInput = null;

  let searchPanel = null;

  /* ==========================================================
     3. NORMALIZZAZIONE TESTO

     Cipì → cipi
     Grès → gres
     ========================================================== */

  function normalize(text) {

    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  }

  /* ==========================================================
     4. IMMAGINE PRODOTTO
     ========================================================== */

  function getImage(img) {

    if (!img) return '';

    return (
      img.getAttribute('data-src') ||
      img.getAttribute('data-image') ||
      img.getAttribute('src') ||
      ''
    );

  }

  /* ==========================================================
     5. CONTENITORE PRODOTTO
     ========================================================== */

  function findProductContainer(link) {

    const selectors = [

      '.ProductList-item',

      '.product-list-item',

      '.product-item',

      '.ProductItem',

      '.summary-item',

      '[data-item-id]',

      'article',

      'li'

    ];

    for (const selector of selectors) {

      const element =
        link.closest(selector);

      if (element) {

        return element;

      }

    }

    return (
      link.parentElement &&
      link.parentElement.parentElement
    ) || link.parentElement;

  }

  /* ==========================================================
     6. TITOLO PRODOTTO
     ========================================================== */

  function getProductTitle(container, link) {

    const titleElement =
      container
        ? container.querySelector(
            '.ProductList-title,' +
            '.product-title,' +
            '.ProductItem-details-title,' +
            '.summary-title,' +
            'h1, h2, h3, h4'
          )
        : null;

    if (titleElement) {

      const title =
        titleElement.textContent
          .replace(/\s+/g, ' ')
          .trim();

      if (title) {

        return title;

      }

    }

    const image =
      container
        ? container.querySelector('img')
        : link.querySelector('img');

    if (image) {

      const alt =
        image.getAttribute('alt');

      if (alt) {

        return alt.trim();

      }

    }

    return link.textContent
      .replace(/\s+/g, ' ')
      .trim();

  }

  /* ==========================================================
     7. PREZZO PRODOTTO
     ========================================================== */

  function getProductPrice(container) {

    if (!container) {

      return '';

    }

    const priceElement =
      container.querySelector(

        '.ProductList-item-price,' +

        '.product-price,' +

        '.ProductItem-details-price,' +

        '.sqs-money-native,' +

        '[class*="price" i]'

      );

    if (priceElement) {

      const price =
        priceElement.textContent
          .replace(/\s+/g, ' ')
          .trim();

      if (price) {

        return price;

      }

    }

    /*
     * Fallback:
     * cerca un prezzo direttamente
     * nel testo del prodotto.
     */

    const text =
      container.textContent
        .replace(/\s+/g, ' ');

    const prices =
      text.match(
        /(?:da\s*)?\d{1,4}(?:\.\d{3})*,\d{2}\s*€/gi
      );

    if (
      prices &&
      prices.length
    ) {

      return prices[
        prices.length - 1
      ].trim();

    }

    return '';

  }

  /* ==========================================================
     8. CARICAMENTO COLLECTION
     ========================================================== */

  async function loadCollection(collection) {

    const response =
      await fetch(
        collection.path,
        {
          credentials: 'same-origin'
        }
      );

    if (!response.ok) {

      throw new Error(
        'Errore caricamento: ' +
        collection.path
      );

    }

    const html =
      await response.text();

    const parsedDocument =
      new DOMParser()
        .parseFromString(
          html,
          'text/html'
        );

    const links =
      Array.from(
        parsedDocument.querySelectorAll(
          'a[href]'
        )
      );

    const products =
      new Map();

    links.forEach(function (link) {

      let url;

      try {

        url =
          new URL(
            link.getAttribute('href'),
            window.location.origin
          );

      }

      catch (error) {

        return;

      }

      /*
       * Il link deve appartenere
       * alla collection corrente.
       *
       * /shop/...
       * /arredo-bagno/...
       * /detergenti/...
       */

      if (
        !url.pathname.startsWith(
          collection.path + '/'
        )
      ) {

        return;

      }

      /*
       * Evita duplicati.
       */

      if (
        products.has(
          url.pathname
        )
      ) {

        return;

      }

      const container =
        findProductContainer(link);

      const title =
        getProductTitle(
          container,
          link
        );

      if (!title) {

        return;

      }

      const imageElement =
        container
          ? container.querySelector('img')
          : link.querySelector('img');

      const image =
        getImage(
          imageElement
        );

      const price =
        getProductPrice(
          container
        );

      /*
       * Testo aggiuntivo utilizzato
       * soltanto per il motore di ricerca.
       */

      const extraText =
        container
          ? container.textContent
              .replace(/\s+/g, ' ')
              .trim()
          : '';

      products.set(
        url.pathname,
        {

          title: title,

          url:
            url.pathname +
            url.search,

          image: image,

          price: price,

          collection:
            collection.label,

          searchText:
            normalize(
              title +
              ' ' +
              collection.label +
              ' ' +
              extraText
            )

        }
      );

    });

    return Array.from(
      products.values()
    );

  }

  /* ==========================================================
     9. CACHE
     ========================================================== */

  function readCache() {

    try {

      const cached =
        JSON.parse(
          localStorage.getItem(
            CONFIG.cacheKey
          )
        );

      if (!cached) {

        return null;

      }

      if (
        Date.now() -
        cached.timestamp >
        CONFIG.cacheTTL
      ) {

        localStorage.removeItem(
          CONFIG.cacheKey
        );

        return null;

      }

      if (
        !Array.isArray(
          cached.products
        )
      ) {

        return null;

      }

      return cached.products;

    }

    catch (error) {

      return null;

    }

  }

  function saveCache(products) {

    try {

      localStorage.setItem(

        CONFIG.cacheKey,

        JSON.stringify({

          timestamp:
            Date.now(),

          products:
            products

        })

      );

    }

    catch (error) {

      /*
       * La ricerca continua a funzionare
       * anche senza localStorage.
       */

    }

  }

  /* ==========================================================
     10. INDICE GLOBALE PRODOTTI
     ========================================================== */

  async function loadProductIndex() {

    /*
     * Indice già disponibile.
     */

    if (
      productIndex.length
    ) {

      return productIndex;

    }

    /*
     * Prova cache.
     */

    const cache =
      readCache();

    if (
      cache &&
      cache.length
    ) {

      productIndex =
        cache;

      console.log(
        '[Kerapho Search] Cache:',
        productIndex.length,
        'prodotti'
      );

      return productIndex;

    }

    /*
     * Evita richieste multiple contemporanee.
     */

    if (
      loadingPromise
    ) {

      return loadingPromise;

    }

    loadingPromise =
      Promise.allSettled(

        CONFIG.collections.map(
          loadCollection
        )

      )
      .then(function (results) {

        const productMap =
          new Map();

        results.forEach(
          function (result, index) {

            if (
              result.status ===
              'fulfilled'
            ) {

              result.value.forEach(
                function (product) {

                  productMap.set(
                    product.url,
                    product
                  );

                }
              );

            }

            else {

              console.warn(
                '[Kerapho Search] Collection non caricata:',
                CONFIG.collections[index].path,
                result.reason
              );

            }

          }
        );

        productIndex =
          Array.from(
            productMap.values()
          );

        saveCache(
          productIndex
        );

        console.log(
          '[Kerapho Search] Indicizzati:',
          productIndex.length,
          'prodotti'
        );

        return productIndex;

      })
      .catch(function (error) {

        /*
         * Permette un nuovo tentativo
         * dopo un eventuale errore.
         */

        loadingPromise = null;

        console.error(
          '[Kerapho Search]',
          error
        );

        throw error;

      });

    return loadingPromise;

  }

  /* ==========================================================
     11. MOTORE DI RICERCA / RANKING
     ========================================================== */

  function searchProducts(query) {

    const normalizedQuery =
      normalize(query);

    if (!normalizedQuery) {

      return [];

    }

    const tokens =
      normalizedQuery
        .split(' ')
        .filter(Boolean);

    const results = [];

    productIndex.forEach(
      function (product) {

        const title =
          normalize(
            product.title
          );

        const fullText =
          product.searchText;

        let score = 0;

        let matches = 0;

        tokens.forEach(
          function (token) {

            /*
             * Match nel titolo:
             * peso maggiore.
             */

            if (
              title.includes(token)
            ) {

              score += 25;

              matches++;

            }

            /*
             * Match nel resto
             * delle informazioni.
             */

            else if (
              fullText.includes(token)
            ) {

              score += 8;

              matches++;

            }

          }
        );

        /*
         * Titolo esatto.
         */

        if (
          title ===
          normalizedQuery
        ) {

          score += 120;

        }

        /*
         * Titolo che inizia
         * con la ricerca.
         */

        else if (
          title.startsWith(
            normalizedQuery
          )
        ) {

          score += 70;

        }

        /*
         * Frase completa presente
         * nel titolo.
         */

        else if (
          title.includes(
            normalizedQuery
          )
        ) {

          score += 50;

        }

        const coverage =
          matches /
          tokens.length;

        /*
         * 1-2 parole:
         * devono essere trovate tutte.
         *
         * 3+ parole:
         * è sufficiente il 60%.
         *
         * Esempio:
         * "mobile bagno cipi"
         */

        const minimumCoverage =
          tokens.length <= 2
            ? 1
            : 0.6;

        if (
          matches &&
          coverage >=
          minimumCoverage
        ) {

          results.push({

            product:
              product,

            score:
              score

          });

        }

      }
    );

    results.sort(
      function (a, b) {

        return (
          b.score -
          a.score
        );

      }
    );

    return results.map(
      function (result) {

        return result.product;

      }
    );

  }

  /* ==========================================================
     12. PANNELLO RISULTATI
     ========================================================== */

  function createPanel() {

    /*
     * Evita duplicazioni.
     */

    const existingPanel =
      searchContainer.querySelector(
        '.ag-product-search'
      );

    if (existingPanel) {

      searchPanel =
        existingPanel;

      return;

    }

    searchPanel =
      document.createElement(
        'div'
      );

    searchPanel.className =
      'ag-product-search';

    searchContainer.appendChild(
      searchPanel
    );

  }

  function openPanel() {

    if (!searchPanel) {

      return;

    }

    searchPanel.classList.add(
      'is-open'
    );

  }

  function closePanel() {

    if (!searchPanel) {

      return;

    }

    searchPanel.classList.remove(
      'is-open'
    );

  }

  /* ==========================================================
     13. HTML SICURO
     ========================================================== */

  function escapeHTML(text) {

    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }

  /* ==========================================================
     14. VISUALIZZAZIONE RISULTATI
     ========================================================== */

  function renderResults(query) {

    const results =
      searchProducts(query);

    searchPanel.innerHTML = '';

    /*
     * Nessun risultato.
     */

    if (
      !results.length
    ) {

      searchPanel.innerHTML =

        '<div class="ag-search-status">' +

        'Nessun prodotto trovato per “' +

        escapeHTML(query) +

        '”' +

        '</div>';

      openPanel();

      return;

    }

    /*
     * Prodotti.
     */

    results
      .slice(
        0,
        CONFIG.maxResults
      )
      .forEach(
        function (product) {

          const link =
            document.createElement(
              'a'
            );

          link.className =
            'ag-search-result';

          link.href =
            product.url;

          /* ------------------------------
             IMMAGINE
             ------------------------------ */

          if (
            product.image
          ) {

            const image =
              document.createElement(
                'img'
              );

            image.className =
              'ag-search-image';

            image.src =
              product.image;

            image.alt =
              product.title;

            image.loading =
              'lazy';

            link.appendChild(
              image
            );

          }

          else {

            const placeholder =
              document.createElement(
                'div'
              );

            placeholder.className =
              'ag-search-image';

            link.appendChild(
              placeholder
            );

          }

          /* ------------------------------
             INFO
             ------------------------------ */

          const info =
            document.createElement(
              'div'
            );

          info.className =
            'ag-search-info';

          /* Collection */

          const collection =
            document.createElement(
              'span'
            );

          collection.className =
            'ag-search-collection';

          collection.textContent =
            product.collection;

          info.appendChild(
            collection
          );

          /* Titolo */

          const title =
            document.createElement(
              'span'
            );

          title.className =
            'ag-search-title';

          title.textContent =
            product.title;

          info.appendChild(
            title
          );

          /* Prezzo */

          if (
            product.price
          ) {

            const price =
              document.createElement(
                'span'
              );

            price.className =
              'ag-search-price';

            price.textContent =
              product.price;

            info.appendChild(
              price
            );

          }

          link.appendChild(
            info
          );

          searchPanel.appendChild(
            link
          );

        }
      );

    /* ------------------------------
       FOOTER
       ------------------------------ */

    const footer =
      document.createElement(
        'div'
      );

    footer.className =
      'ag-search-footer';

    if (
      results.length >
      CONFIG.maxResults
    ) {

      footer.textContent =

        results.length +

        ' prodotti trovati · ' +

        'mostrati i primi ' +

        CONFIG.maxResults;

    }

    else {

      footer.textContent =

        results.length === 1
          ? '1 prodotto trovato'
          : results.length +
            ' prodotti trovati';

    }

    searchPanel.appendChild(
      footer
    );

    openPanel();

  }

  /* ==========================================================
     15. RICERCA LIVE
     ========================================================== */

  function setupLiveSearch() {

    let timer = null;

    searchInput.addEventListener(
      'input',
      function () {

        clearTimeout(
          timer
        );

        const query =
          searchInput.value
            .trim();

        /*
         * Query troppo corta.
         */

        if (
          query.length <
          CONFIG.minCharacters
        ) {

          closePanel();

          return;

        }

        /*
         * Stato caricamento.
         */

        searchPanel.innerHTML =

          '<div class="ag-search-status">' +

          'Ricerca prodotti...' +

          '</div>';

        openPanel();

        /*
         * Debounce.
         */

        timer =
          setTimeout(
            async function () {

              try {

                await loadProductIndex();

                /*
                 * Il testo potrebbe essere cambiato
                 * durante il caricamento.
                 */

                const currentQuery =
                  searchInput.value
                    .trim();

                if (
                  currentQuery.length <
                  CONFIG.minCharacters
                ) {

                  closePanel();

                  return;

                }

                renderResults(
                  currentQuery
                );

              }

              catch (error) {

                searchPanel.innerHTML =

                  '<div class="ag-search-status">' +

                  'Impossibile caricare il catalogo.' +

                  '</div>';

              }

            },

            CONFIG.searchDelay

          );

      }
    );

    /* Click esterno */

    document.addEventListener(
      'click',
      function (event) {

        if (
          !searchContainer.contains(
            event.target
          )
        ) {

          closePanel();

        }

      }
    );

    /* ESC */

    searchInput.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key ===
          'Escape'
        ) {

          searchInput.value = '';

          closePanel();

          searchInput.blur();

        }

      }
    );

  }
/* ==========================================================
   16. POSIZIONE MOBILE
   ========================================================== */

/* ==========================================================
   16. POSIZIONE MOBILE

   Desktop:
   utilizza la .Header-search originale.

   Mobile:
   se Squarespace non rende disponibile
   .Header-search, crea una versione
   equivalente collegata allo stesso motore.
   ========================================================== */

function setupMobilePosition() {

  const mobileMedia =
    window.matchMedia(
      '(max-width: ' +
      CONFIG.mobileBreakpoint +
      'px)'
    );


  /*
   * Se siamo su desktop utilizziamo
   * esclusivamente la Search originale.
   */

  if (
    !mobileMedia.matches
  ) {

    return;

  }



  /*
   * Cerca la Mobile Bar nativa Squarespace.
   */

  const mobileSearchReference =
    document.querySelector(
      '.Mobile-bar-search'
    );


  const mobileBar =
    mobileSearchReference
      ?.closest('.Mobile-bar')
    ||
    document.querySelector(
      '.Mobile-bar'
    );


  if (!mobileBar) {

    console.log(
      '[Kerapho Search] Mobile-bar non trovata'
    );

    return;

  }



  /*
   * Recupera la riga dedicata.
   */

  let mobileRow =
    document.querySelector(
      '.ag-mobile-search-row'
    );


  if (!mobileRow) {

    mobileRow =
      document.createElement(
        'div'
      );

    mobileRow.className =
      'ag-mobile-search-row';

  }



  /*
   * Posiziona la riga subito sotto
   * la Mobile Bar.
   */

  if (
    mobileRow.previousElementSibling !==
    mobileBar
  ) {

    mobileBar.insertAdjacentElement(
      'afterend',
      mobileRow
    );

  }



  /*
   * Se la .Header-search originale
   * esiste, la utilizziamo.
   */

  let mobileSearch =
    mobileRow.querySelector(
      '.Header-search'
    );


  if (
    !mobileSearch
  ) {

    /*
     * Crea la stessa struttura logica
     * della Search originale.
     */

    mobileSearch =
      document.createElement(
        'div'
      );

    mobileSearch.className =
      'Header-search';

    mobileSearch.setAttribute(
      'data-kerapho-mobile-search',
      'true'
    );



    /*
     * FORM
     */

    const form =
      document.createElement(
        'form'
      );

    form.setAttribute(
      'role',
      'search'
    );

    form.setAttribute(
      'novalidate',
      'true'
    );



    /*
     * Evita il submit nativo.
     */

    form.addEventListener(
      'submit',
      function(event) {

        event.preventDefault();

      }
    );



    /*
     * INPUT
     */

    const input =
      document.createElement(
        'input'
      );

    input.type =
      'search';

    input.placeholder =
      'Cerca prodotti...';

    input.setAttribute(
      'aria-label',
      'Cerca prodotti'
    );

    input.setAttribute(
      'autocomplete',
      'off'
    );

    input.setAttribute(
      'spellcheck',
      'false'
    );



    form.appendChild(
      input
    );


    mobileSearch.appendChild(
      form
    );


    mobileRow.appendChild(
      mobileSearch
    );

  }



  /*
   * IMPORTANTE:
   * da questo punto in poi il motore
   * utilizza la Search mobile appena creata.
   */

  searchContainer =
    mobileSearch;


  searchInput =
    mobileSearch.querySelector(
      'input'
    );



  if (
    !searchInput
  ) {

    console.log(
      '[Kerapho Search] Input mobile non trovato'
    );

    return;

  }



  /*
   * Placeholder.
   */

  searchInput.setAttribute(
    'placeholder',
    'Cerca prodotti...'
  );



  /*
   * Crea il pannello risultati.
   */

  createPanel();



  /*
   * Attiva lo stesso identico
   * motore Live Search.
   */

  setupLiveSearch();



  /*
   * Cambio breakpoint.
   *
   * Non facciamo nuovi fetch.
   */

  if (
    typeof mobileMedia.addEventListener ===
    'function'
  ) {

    mobileMedia.addEventListener(
      'change',
      function() {

        if (
          !mobileMedia.matches &&
          mobileSearch.getAttribute(
            'data-kerapho-mobile-search'
          ) === 'true'
        ) {

          mobileSearch.style.display =
            'none';

        }

      }
    );

  }

}

/* ==========================================================
   17. INIT
   ========================================================== */

function init() {

  /*
   * Prima prova a trovare la Search originale.
   */

  searchContainer =
    document.querySelector(
      '.Header-search'
    );



  /*
   * Se siamo su MOBILE e Squarespace
   * non ha fornito .Header-search,
   * creiamo la nostra versione mobile.
   */

  const mobileMedia =
    window.matchMedia(
      '(max-width: ' +
      CONFIG.mobileBreakpoint +
      'px)'
    );


  if (
    !searchContainer &&
    mobileMedia.matches
  ) {

    setupMobilePosition();

  }



  /*
   * Se dopo il tentativo non abbiamo
   * una Search, usciamo.
   */

  if (
    !searchContainer
  ) {

    console.log(
      '[Kerapho Search] Search non disponibile'
    );

    return;

  }



  /*
   * Recupera input.
   */

  searchInput =
    searchContainer.querySelector(
      'input'
    );


  if (
    !searchInput
  ) {

    console.log(
      '[Kerapho Search] Input non trovato'
    );

    return;

  }



  /*
   * Placeholder.
   */

  searchInput.setAttribute(
    'placeholder',
    'Cerca prodotti...'
  );



  /*
   * Pannello.
   */

  createPanel();



  /*
   * Ricerca live.
   */

  setupLiveSearch();



  /*
   * Su desktop manteniamo
   * la gestione originale.
   *
   * Su mobile setupMobilePosition()
   * ha già creato la Search.
   */

  if (
    !mobileMedia.matches
  ) {

    setupMobilePosition();

  }



  /*
   * PRELOAD ORIGINALE.
   *
   * Non viene modificato.
   */

  setTimeout(
    function() {

      loadProductIndex();

    },

    CONFIG.preloadDelay

  );

}

  /* ==========================================================
     18. START
     ========================================================== */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  }

  else {

    init();

  }

})();

