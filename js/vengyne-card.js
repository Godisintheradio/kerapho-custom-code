(function () {

    "use strict";


    /* =====================================================
       V-ENGINE CARD V2
       KERAPHO.IT

       SCOPO:

       Mostrare nelle Product Card:

       €/m²
       formato
       m²/confezione


       FUNZIONAMENTO:

       1. PRODOTTO CONFIGURABILE
          Varianti Squarespace
          +
          Packaging excerpt
          ↓
          €/m²


       2. PRODOTTO SEMPLICE
          Una variante tecnica
          +
          Packaging excerpt
          ↓
          €/m²


       3. PRODOTTO NON COMPATIBILE
          Nessun dato sufficiente
          ↓
          Nessuna modifica alla card
       ===================================================== */


    /* =====================================================
       1. CONFIGURAZIONE
       ===================================================== */

    const CARD_SELECTOR =
        ".ProductList-item";

    const PRICE_SELECTOR =
        ".product-price.confezione-prezzo";

    const INFO_CLASS =
        "ag-vengine-card-info";

    const LOADED_ATTRIBUTE =
        "agVengineCardLoaded";


    /* =====================================================
       2. UTILITY
       ===================================================== */

    function normalizeText(
        value
    ) {

        return String(
            value || ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[“”"']/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }


    function normalizeNumber(
        value
    ) {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return NaN;

        }


        const number =
            parseFloat(
                String(
                    value
                )
                    .replace(
                        /\s/g,
                        ""
                    )
                    .replace(
                        ",",
                        "."
                    )
            );


        return Number.isFinite(
            number
        )
            ? number
            : NaN;

    }


    function normalizeFormat(
        value
    ) {

        if (
            !value
        ) {

            return null;

        }


        let text =
            String(
                value
            )
                .trim()
                .toLowerCase()
                .replace(
                    /×/g,
                    "x"
                )
                .replace(
                    /\s+/g,
                    ""
                )
                .replace(
                    /cm$/i,
                    ""
                );


        const match =
            text.match(
                /^(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)$/i
            );


        if (
            !match
        ) {

            return null;

        }


        return (
            match[1]
                .replace(
                    ",",
                    "."
                ) +
            "x" +
            match[2]
                .replace(
                    ",",
                    "."
                ) +
            "cm"
        );

    }


    function formatDisplay(
        value
    ) {

        if (
            !value
        ) {

            return "";

        }


        return String(
            value
        )
            .replace(
                /cm$/i,
                " cm"
            );

    }


    function normalizeSemantic(
        value
    ) {

        return normalizeText(
            value
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                ""
            );

    }


    /* =====================================================
       2.1. RICONOSCIMENTO MARCA DAI TAG
       ===================================================== */

    function getBrandTag(
        tags
    ) {

        if (
            !Array.isArray(
                tags
            )
        ) {

            return null;

        }

        const candidates =
            tags.filter(
                tag => {

                    const value =
                        String(
                            tag || ""
                        ).trim();

                    if (!value) {
                        return false;
                    }

                    /*
                     * Esclude i tag che rappresentano
                     * formati / misure.
                     */

                    const isFormat =
                        /^\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?\s*(?:cm)?$/i
                            .test(
                                value
                            );

                    if (isFormat) {
                        return false;
                    }

                    /*
                     * La marca deve contenere almeno
                     * una lettera ed essere interamente
                     * maiuscola.
                     */

                    return (
                        /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(
                            value
                        ) &&
                        value ===
                            value.toUpperCase()
                    );

                }
            );

        return (
            candidates[0] ||
            null
        );

    }


    /* =====================================================
       3. PREZZO VARIANTE
       ===================================================== */

    function getVariantPrice(
        variant
    ) {

        if (
            !variant
        ) {

            return NaN;

        }


        const normalPrice =
            normalizeNumber(
                variant?.price
                    ?.decimalValue ??
                variant?.price
                    ?.value ??
                variant?.price
            );


        const salePrice =
            normalizeNumber(
                variant?.salePrice
                    ?.decimalValue ??
                variant?.salePrice
                    ?.value ??
                variant?.salePrice
            );


        /*
         * IMPORTANTISSIMO
         *
         * Il prezzo scontato viene utilizzato
         * solo quando Squarespace dichiara
         * realmente onSale === true.
         */

        if (
            variant.onSale ===
            true &&
            Number.isFinite(
                salePrice
            ) &&
            salePrice > 0
        ) {

            return salePrice;

        }


        return normalPrice;

    }


    /* =====================================================
       4. ESTRAZIONE FORMATI
       ===================================================== */

    function extractFormats(
        text
    ) {

        const formats =
            [];


        const regex =
            /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/gi;


        let match;


        while (
            (
                match =
                    regex.exec(
                        text ||
                        ""
                    )
            ) !== null
        ) {

            const formato =
                normalizeFormat(
                    match[1] +
                    "x" +
                    match[2]
                );


            if (
                formato &&
                !formats.includes(
                    formato
                )
            ) {

                formats.push(
                    formato
                );

            }

        }


        return formats;

    }


    /* =====================================================
       5. PACKAGING PARSER
       ===================================================== */

    function extractPackaging(
        text
    ) {

        const packaging =
            [];


        const source =
            String(
                text ||
                ""
            );


        let match;


        /*
         * -------------------------------------------------
         * PATTERN 1
         *
         * SCATOLA DEL FORMATO 60X120 "opaco"
         * SVILUPPA = 1,44 m²
         *
         * Compatibile anche con:
         *
         * FOMATO
         *
         * e con numeri:
         *
         * 1,44
         * 1.44
         * 1 ,44
         * 1 .44
         * -------------------------------------------------
         */

        const regex1 =
            /SCATOLA\s+(?:DEL\s+)?(?:FORMATO|FOMATO)\s+(\d+(?:\s*[.,]\s*\d+)?)\s*[x×]\s*(\d+(?:\s*[.,]\s*\d+)?)\s*(?:cm)?\s*(?:["“”']\s*)?([^=\n\r]{0,70}?)\s*(?:["“”']\s*)?(?:SVILUPPA|=)\s*=?\s*(\d+(?:\s*[.,]\s*\d+)?)\s*(?:m²|m2|mq)/gi;


        while (
            (
                match =
                    regex1.exec(
                        source
                    )
            ) !== null
        ) {

            const formato =
                normalizeFormat(
                    match[1] +
                    "x" +
                    match[2]
                );


            const descrittore =
                normalizeSemantic(
                    match[3]
                );


            const mq =
                normalizeNumber(
                    match[4]
                );


            if (
                formato &&
                Number.isFinite(
                    mq
                ) &&
                mq > 0
            ) {

                packaging.push({

                    formato:
                        formato,

                    mq:
                        mq,

                    descrittore:
                        descrittore ||
                        null

                });

            }

        }


        /*
         * -------------------------------------------------
         * PATTERN 2
         *
         * Misure: 60x120cm
         *
         * m² sviluppati a confezione: 1,44 m²
         * -------------------------------------------------
         */

        const misuraMatch =
            source.match(
                /Misure?\s*:\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i
            );


        const mqMatch =
            source.match(
                /(?:m²|m2|mq)\s*(?:\([^)]*\))?\s*(?:sviluppati?|sviluppate?)\s*(?:a|per)\s*confezione\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:m²|m2|mq)/i
            );


        if (
            misuraMatch &&
            mqMatch
        ) {

            const formato =
                normalizeFormat(
                    misuraMatch[1] +
                    "x" +
                    misuraMatch[2]
                );


            const mq =
                normalizeNumber(
                    mqMatch[1]
                );


            if (
                formato &&
                Number.isFinite(
                    mq
                ) &&
                mq > 0
            ) {

                packaging.push({

                    formato:
                        formato,

                    mq:
                        mq,

                    descrittore:
                        null

                });

            }

        }


        /*
         * -------------------------------------------------
         * PATTERN 3
         *
         * Formato + sviluppo
         *
         * Esempi:
         *
         * Formato: 60x120cm
         * sviluppa = 1,44 m²
         * -------------------------------------------------
         */

        if (
            packaging.length ===
            0
        ) {

            const formatoMatch =
                source.match(
                    /(?:Misure?|Formato)\s*:\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i
                );


            const sviluppoMatch =
                source.match(
                    /(?:sviluppa|sviluppati|sviluppate)\s*(?:=|:)?\s*(\d+(?:[.,]\d+)?)\s*(?:m²|m2|mq)/i
                );


            if (
                formatoMatch &&
                sviluppoMatch
            ) {

                const formato =
                    normalizeFormat(
                        formatoMatch[1] +
                        "x" +
                        formatoMatch[2]
                    );


                const mq =
                    normalizeNumber(
                        sviluppoMatch[1]
                    );


                if (
                    formato &&
                    Number.isFinite(
                        mq
                    ) &&
                    mq > 0
                ) {

                    packaging.push({

                        formato:
                            formato,

                        mq:
                            mq,

                        descrittore:
                            null

                    });

                }

            }

        }


        /*
         * -------------------------------------------------
         * PATTERN 4
         *
         * 1 QUANTITÀ = X m²
         * -------------------------------------------------
         */

        const quantityRegex =
            /(?:1\s+)?QUANTIT(?:À|A|A')\s*(?:=|:)\s*(\d+(?:[.,]\d+)?)\s*(?:m²|m2|mq)/gi;


        while (
            (
                match =
                    quantityRegex.exec(
                        source
                    )
            ) !== null
        ) {

            const mq =
                normalizeNumber(
                    match[1]
                );


            if (
                Number.isFinite(
                    mq
                ) &&
                mq > 0
            ) {

                packaging.push({

                    formato:
                        null,

                    mq:
                        mq,

                    descrittore:
                        null

                });

            }

        }


        /*
         * -------------------------------------------------
         * PATTERN 5
         *
         * m² sviluppati a confezione
         * -------------------------------------------------
         */

        const developedRegex =
            /(?:m²|m2|mq)[\s\S]{0,100}?sviluppat[oaie][\s\S]{0,60}?(?:a|per)\s+confezione\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:m²|m2|mq)?/gi;


        while (
            (
                match =
                    developedRegex.exec(
                        source
                    )
            ) !== null
        ) {

            const mq =
                normalizeNumber(
                    match[1]
                );


            if (
                Number.isFinite(
                    mq
                ) &&
                mq > 0
            ) {

                packaging.push({

                    formato:
                        null,

                    mq:
                        mq,

                    descrittore:
                        null

                });

            }

        }


        /*
         * -------------------------------------------------
         * ELIMINA DUPLICATI
         * -------------------------------------------------
         */

        const unique =
            [];


        packaging.forEach(
            item => {

                const exists =
                    unique.some(
                        existing =>
                            existing.formato ===
                                item.formato &&
                            existing.mq ===
                                item.mq &&
                            existing.descrittore ===
                                item.descrittore
                    );


                if (
                    !exists
                ) {

                    unique.push(
                        item
                    );

                }

            }
        );


        return unique;

    }


    /* =====================================================
       6. FORMATO VARIANTE
       ===================================================== */

    function getVariantFormat(
        variant
    ) {

        const attributes =
            variant?.attributes ||
            {};


        for (
            const value of
            Object.values(
                attributes
            )
        ) {

            const format =
                String(
                    value ||
                    ""
                ).match(
                    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:cm)?/i
                );


            if (
                format
            ) {

                return normalizeFormat(
                    format[1] +
                    "x" +
                    format[2]
                );

            }

        }


        return null;

    }


    /* =====================================================
       7. MATCH PACKAGING
       ===================================================== */

    function findPackaging(
        formato,
        packaging,
        variant
    ) {

        if (
            !Array.isArray(
                packaging
            ) ||
            !packaging.length
        ) {

            return null;

        }


        /*
         * =================================================
         * 1. MATCH DIRETTO DEL FORMATO
         * =================================================
         */

        if (
            formato
        ) {

            const normalized =
                normalizeSemantic(
                    formato
                );


            const formatMatch =
                packaging.find(
                    item =>
                        item.formato &&
                        normalizeSemantic(
                            item.formato
                        ) ===
                        normalized
                );


            if (
                formatMatch
            ) {

                return formatMatch;

            }

        }


        /*
         * =================================================
         * 2. MATCH TRAMITE ATTRIBUTI VARIANTE
         *
         * Esempio Charme:
         *
         * Finitura = Opaco
         *
         * packaging:
         *
         * 60x120 → opaco
         *
         * oppure:
         *
         * Finitura = Lappato
         *
         * packaging:
         *
         * 59x118 → lappato
         * =================================================
         */

        const attributes =
            variant?.attributes ||
            {};


        const variantSemantics =
            Object.values(
                attributes
            )
            .filter(
                value =>
                    value !==
                        null &&
                    value !==
                        undefined
            )
            .map(
                value =>
                    normalizeSemantic(
                        value
                    )
            )
            .filter(
                Boolean
            );


        if (
            variantSemantics.length
        ) {

            const descriptorMatch =
                packaging.find(
                    item => {

                        if (
                            !item.descrittore
                        ) {

                            return false;

                        }


                        const descriptor =
                            normalizeSemantic(
                                item.descrittore
                            );


                        return variantSemantics.includes(
                            descriptor
                        );

                    }
                );


            if (
                descriptorMatch
            ) {

                return descriptorMatch;

            }

        }


        return null;

    }


    /* =====================================================
       8. RECUPERA DATI PRODOTTO
       ===================================================== */

    async function getProductData(
        url
    ) {

        try {

            const response =
                await fetch(
                    url,
                    {
                        credentials:
                            "same-origin"
                    }
                );


            if (
                !response.ok
            ) {

                return null;

            }


            const html =
                await response.text();


            const parser =
                new DOMParser();


            const page =
                parser.parseFromString(
                    html,
                    "text/html"
                );


            /*
             * EXCERPT
             */

            const excerptElement =
                page.querySelector(
                    ".ProductItem-details-excerpt"
                );


            const excerpt =
                excerptElement
                    ?.textContent ||
                "";


            if (
                !excerpt.trim()
            ) {

                return null;

            }


            /*
             * PRODUCT CONTEXT
             */

            let product =
                null;


            /*
             * Metodo principale:
             *
             * cerchiamo il context Squarespace
             * direttamente negli script.
             */

            const scripts =
                page.querySelectorAll(
                    "script"
                );


            for (
                const script of
                scripts
            ) {

                const text =
                    script.textContent ||
                    "";


                if (
                    !text.includes(
                        "SQUARESPACE_CONTEXT"
                    )
                ) {

                    continue;

                }


                const match =
                    text.match(
                        /SQUARESPACE_CONTEXT\s*=\s*(\{[\s\S]*?\});/
                    );


                if (
                    !match
                ) {

                    continue;

                }


                try {

                    const context =
                        JSON.parse(
                            match[1]
                        );


                    product =
                        context?.product ||
                        null;

                }
                catch (
                    error
                ) {

                    product =
                        null;

                }


                if (
                    product
                ) {

                    break;

                }

            }


            /*
             * Fallback DOM:
             *
             * Squarespace può esporre
             * le varianti direttamente
             * nell'elemento data-variants.
             */

            let variants =
                Array.isArray(
                    product?.variants
                )
                    ? product.variants
                    : [];


            if (
                !variants.length
            ) {

                const variantsElement =
                    page.querySelector(
                        ".product-variants[data-variants]"
                    );


                if (
                    variantsElement
                ) {

                    try {

                        const parsed =
                            JSON.parse(
                                variantsElement
                                    .dataset
                                    .variants
                            );


                        if (
                            Array.isArray(
                                parsed
                            )
                        ) {

                            variants =
                                parsed;

                        }

                    }
                    catch (
                        error
                    ) {

                        variants =
                            [];

                    }

                }

            }


            /*
             * Se non troviamo varianti,
             * restituiamo comunque l'excerpt.
             *
             * Questo permette di gestire
             * il prodotto semplice anche
             * quando Squarespace non espone
             * la variante nel context.
             */

            /*
             * TAG PRODOTTO
             *
             * In Squarespace 7.0 i tag vengono
             * esposti nel JSON della pagina
             * come data.item.tags.
             */

            let tags =
                [];

            try {

                const jsonUrl =
                    new URL(
                        url,
                        location.origin
                    );

                jsonUrl.searchParams.set(
                    "format",
                    "json"
                );


                const jsonResponse =
                    await fetch(
                        jsonUrl.href,
                        {
                            credentials:
                                "same-origin",

                            headers: {
                                Accept:
                                    "application/json"
                            }
                        }
                    );


                if (
                    jsonResponse.ok
                ) {

                    const jsonData =
                        await jsonResponse.json();


                    if (
                        Array.isArray(
                            jsonData?.item?.tags
                        )
                    ) {

                        tags =
                            jsonData.item.tags;

                    }

                }

            }
            catch (
                error
            ) {

                tags =
                    [];

            }


            return {

                excerpt:
                    excerpt,

                variants:
                    variants,

                tags:
                    tags

            };

        }
        catch (
            error
        ) {

            return null;

        }

    }


    /* =====================================================
       9. COSTRUISCE DATI CARD
       ===================================================== */

    function buildCardData(
        productData
    ) {

        if (
            !productData
        ) {

            return null;

        }


        const excerpt =
            productData.excerpt ||
            "";


        const brand =
            getBrandTag(
                productData.tags
            );


        const variants =
            Array.isArray(
                productData.variants
            )
                ? productData.variants
                : [];


        /*
         * PACKAGING
         */

        const packaging =
            extractPackaging(
                excerpt
            );


        const validPackaging =
            packaging.filter(
                item =>
                    Number.isFinite(
                        item.mq
                    ) &&
                    item.mq > 0
            );


        if (
            !validPackaging.length
        ) {

            return null;

        }


        /*
         * FORMATI DICHIARATI NELL'EXCERPT
         */

        const formats =
            extractFormats(
                excerpt
            );


        /*
         * =================================================
         * PRODOTTO SEMPLICE
         * =================================================
         */

        const attributeNames =
            [
                ...new Set(
                    variants.flatMap(
                        variant =>
                            Object.keys(
                                variant.attributes ||
                                {}
                            )
                    )
                )
            ];


        const isSimpleProduct =
            (
                variants.length === 1 &&
                attributeNames.length === 0
            ) ||
            variants.length === 0;


        if (
            isSimpleProduct
        ) {

            const variant =
                variants[0] ||
                {};


            const prezzo =
                getVariantPrice(
                    variant
                );


            let formato =
                null;


            /*
             * Prima scelta:
             *
             * Misure: 60x120cm
             */

            const misura =
                excerpt.match(
                    /Misure?\s*:\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i
                );


            if (
                misura
            ) {

                formato =
                    normalizeFormat(
                        misura[1] +
                        "x" +
                        misura[2]
                    );

            }


            /*
             * Seconda scelta:
             *
             * un solo formato nell'excerpt.
             */

            if (
                !formato &&
                formats.length === 1
            ) {

                formato =
                    formats[0];

            }


            /*
             * Terza scelta:
             *
             * il packaging contiene
             * un solo formato.
             */

            if (
                !formato &&
                validPackaging.length === 1 &&
                validPackaging[0].formato
            ) {

                formato =
                    validPackaging[0]
                        .formato;

            }


            /*
             * Cerca il m² associato
             * al formato.
             */

            let mq =
                null;


            if (
                formato
            ) {

                const matchingPackaging =
                    findPackaging(
                        formato,
                        validPackaging,
                        variant
                    );


                if (
                    matchingPackaging
                ) {

                    mq =
                        matchingPackaging.mq;

                }

            }


            /*
             * Fallback:
             *
             * un solo packaging.
             */

            if (
                !mq &&
                validPackaging.length === 1
            ) {

                mq =
                    validPackaging[0]
                        .mq;

            }


            /*
             * Prezzo:
             *
             * prima dalla variante.
             */

            let prezzoFinale =
                prezzo;


            /*
             * Se il prodotto semplice
             * non espone correttamente
             * la variante, prendiamo il prezzo
             * nativo della card più avanti.
             */

            if (
                !Number.isFinite(
                    prezzoFinale
                ) ||
                prezzoFinale <= 0
            ) {

                return {

                    simpleProduct:
                        true,

                    brand:
                        brand,

                    price:
                        null,

                    priceMq:
                        null,

                    formato:
                        formato,

                    formatLabel:
                        formato,

                    mq:
                        mq,

                    formats:
                        formato
                            ? [formato]
                            : [],

                    multipleFormats:
                        false

                };

            }


            /*
             * Calcolo €/m².
             */

            if (
                Number.isFinite(
                    mq
                ) &&
                mq > 0
            ) {

                return {

                    simpleProduct:
                        true,

                    brand:
                        brand,

                    price:
                        prezzoFinale,

                    priceMq:
                        prezzoFinale /
                        mq,

                    formato:
                        formato,

                    formatLabel:
                        formato,

                    mq:
                        mq,

                    formats:
                        formato
                            ? [formato]
                            : [],

                    multipleFormats:
                        false

                };

            }


            return null;

        }


        /*
         * =================================================
         * PRODOTTO CONFIGURABILE
         * =================================================
         */

        const combinations =
            [];


        variants.forEach(
            variant => {

                const prezzo =
                    getVariantPrice(
                        variant
                    );


                if (
                    !Number.isFinite(
                        prezzo
                    ) ||
                    prezzo <= 0
                ) {

                    return;

                }


                let formato =
                    getVariantFormat(
                        variant
                    );


                /*
                 * Se la variante non contiene
                 * il formato e il prodotto
                 * possiede un solo formato,
                 * utilizziamo quello globale.
                 */

                if (
                    !formato &&
                    formats.length === 1
                ) {

                    formato =
                        formats[0];

                }


                /*
                 * MATCH PACKAGING
                 *
                 * Prima:
                 * formato
                 *
                 * Poi:
                 * attributi variante
                 * → descrittore packaging
                 */

                let pack =
                    findPackaging(
                        formato,
                        validPackaging,
                        variant
                    );


                /*
                 * Se esiste un solo packaging,
                 * è il riferimento della variante.
                 */

                if (
                    !pack &&
                    validPackaging.length === 1
                ) {

                    pack =
                        validPackaging[0];

                }


                if (
                    !pack
                ) {

                    return;

                }


                const priceMq =
                    prezzo /
                    pack.mq;


                if (
                    !Number.isFinite(
                        priceMq
                    ) ||
                    priceMq <= 0
                ) {

                    return;

                }


                combinations.push({

                    variant:
                        variant,

                    formato:
                        formato ||
                        pack.formato ||
                        null,

                    mq:
                        pack.mq,

                    prezzo:
                        prezzo,

                    priceMq:
                        priceMq

                });

            }
        );


        if (
            !combinations.length
        ) {

            return null;

        }


        /*
         * FORMATI UNICI
         */

        const uniqueFormats =
            [
                ...new Set(
                    combinations
                        .map(
                            item =>
                                item.formato
                        )
                        .filter(
                            Boolean
                        )
                )
            ];


        /*
         * €/m²
         */

        const priceMqValues =
            combinations
                .map(
                    item =>
                        item.priceMq
                )
                .filter(
                    value =>
                        Number.isFinite(
                            value
                        )
                );


        if (
            !priceMqValues.length
        ) {

            return null;

        }


        const minPriceMq =
            Math.min(
                ...priceMqValues
            );


        const maxPriceMq =
            Math.max(
                ...priceMqValues
            );


        const samePriceMq =
            Math.abs(
                maxPriceMq -
                minPriceMq
            ) < 0.01;


        /*
         * Prezzo confezione.
         *
         * Lo mostriamo soltanto quando
         * esiste un solo formato.
         */

        let cardPrice =
            null;


        let cardMq =
            null;


        let cardFormat =
            null;


        if (
            uniqueFormats.length === 1
        ) {

            const first =
                combinations[0];


            cardPrice =
                first.prezzo;


            cardMq =
                first.mq;


            cardFormat =
                first.formato;

        }


        /*
         * LABEL FORMATO
         */

        let formatLabel =
            null;


        if (
            uniqueFormats.length === 1
        ) {

            formatLabel =
                uniqueFormats[0];

        }
        else if (
            uniqueFormats.length > 1
        ) {

            formatLabel =
                uniqueFormats.length +
                " formati disponibili";

        }
        else if (
            formats.length === 1
        ) {

            formatLabel =
                formats[0];

        }


        return {

            simpleProduct:
                false,

            price:
                cardPrice,

            priceMq:
                samePriceMq
                    ? minPriceMq
                    : minPriceMq,

            formato:
                cardFormat,

            formatLabel:
                formatLabel,

            mq:
                cardMq,

            formats:
                uniqueFormats,

            multipleFormats:
                uniqueFormats.length > 1,

            priceMqRange:
                !samePriceMq,

            combinations:
                combinations

        };

    }


    /* =====================================================
       10. PREZZO DALLA CARD
       ===================================================== */

    function getCardPrice(
        card
    ) {

        const priceElement =
            card.querySelector(
                PRICE_SELECTOR
            );


        if (
            !priceElement
        ) {

            return NaN;

        }


        const text =
            priceElement.textContent ||
            "";


        const match =
            text.match(
                /(\d+(?:[.,]\d+)?)/g
            );


        if (
            !match ||
            !match.length
        ) {

            return NaN;

        }


        return normalizeNumber(
            match[
                match.length - 1
            ]
        );

    }


    /* =====================================================
       11. FORMATTA EURO
       ===================================================== */

    function formatEuro(
        value
    ) {

        if (
            !Number.isFinite(
                value
            )
        ) {

            return "";

        }


        return new Intl.NumberFormat(
            "it-IT",
            {
                style:
                    "currency",

                currency:
                    "EUR",

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ).format(
            value
        );

    }


    /* =====================================================
       12. RENDER CARD
       ===================================================== */

    function renderCard(
        card,
        data
    ) {

        if (
            !card ||
            !data
        ) {

            return;

        }


        /*
         * Evita duplicazioni.
         */

        if (
            card.querySelector(
                "." +
                INFO_CLASS
            )
        ) {

            return;

        }


        const priceElement =
            card.querySelector(
                PRICE_SELECTOR
            );


        if (
            !priceElement
        ) {

            return;

        }


        /*
         * Prezzo €/m².
         *
         * Se il prodotto semplice
         * non aveva il prezzo nella variante,
         * utilizziamo il prezzo della card.
         */

        let priceMq =
            data.priceMq;


        if (
            data.simpleProduct &&
            !Number.isFinite(
                priceMq
            )
        ) {

            const cardPrice =
                getCardPrice(
                    card
                );


            if (
                Number.isFinite(
                    cardPrice
                ) &&
                Number.isFinite(
                    data.mq
                ) &&
                data.mq > 0
            ) {

                priceMq =
                    cardPrice /
                    data.mq;

            }

        }


        /*
         * Se ancora non abbiamo
         * €/m² non visualizziamo nulla.
         */

        if (
            !Number.isFinite(
                priceMq
            ) ||
            priceMq <= 0
        ) {

            return;

        }


        const info =
            document.createElement(
                "div"
            );


        info.className =
            INFO_CLASS;


        let html =
            "";

        /*
         * MARCA
         */

        if (
            data.brand
        ) {

            html += `
                <div class="ag-vengine-card-brand">
                    ${data.brand}
                </div>
            `;

        }





        /*
         * €/m²
         */

        html += `
            <div class="ag-vengine-card-price-mq">
                ${formatEuro(priceMq)} / m²
            </div>
        `;


        /*
         * FORMATO + M²
         */

        if (
            data.multipleFormats
        ) {

            html += `
                <div class="ag-vengine-card-specs">
                    <span class="ag-vengine-card-formato">
                        ${data.formatLabel}
                    </span>
                </div>
            `;

        }
        else if (
            data.formato ||
            Number.isFinite(
                data.mq
            )
        ) {

            html += `
                <div class="ag-vengine-card-specs">
            `;


            if (
                data.formato
            ) {

                html += `
                    <span class="ag-vengine-card-formato">
                        ${formatDisplay(
                            data.formato
                        )}
                    </span>
                `;

            }


            if (
                data.formato &&
                Number.isFinite(
                    data.mq
                )
            ) {

                html += `
                    <span class="ag-vengine-card-separator">
                        ·
                    </span>
                `;

            }


            if (
                Number.isFinite(
                    data.mq
                )
            ) {

                html += `
                    <span class="ag-vengine-card-mq">
                        ${data.mq.toLocaleString(
                            "it-IT",
                            {
                                minimumFractionDigits:
                                    2,

                                maximumFractionDigits:
                                    3
                            }
                        )} m²/conf.
                    </span>
                `;

            }


            html += `
                </div>
            `;

        }


        if (
            !html
        ) {

            return;

        }


        info.innerHTML =
            html;


        /*
         * Inserimento dopo il prezzo.
         */

        priceElement.insertAdjacentElement(
            "afterend",
            info
        );

    }


    /* =====================================================
       13. TROVA CARD ATTUALE
       ===================================================== */

    function findCurrentCard(
        url
    ) {

        const cards =
            [
                ...
                document.querySelectorAll(
                    CARD_SELECTOR
                )
            ];


        return (
            cards.find(
                card => {

                    const link =
                        card.querySelector(
                            "a.ProductList-item-link"
                        );


                    if (
                        !link
                    ) {

                        return false;

                    }


                    const cardUrl =
                        new URL(
                            link.href,
                            location.origin
                        ).href;


                    return (
                        cardUrl ===
                        url
                    );

                }
            ) ||
            null
        );

    }


    /* =====================================================
       14. PROCESSA CARD
       ===================================================== */

    async function processCard(
        originalCard
    ) {

        if (
            !originalCard
        ) {

            return;

        }


        /*
         * Recuperiamo subito il link.
         */

        const link =
            originalCard.querySelector(
                "a.ProductList-item-link"
            );


        if (
            !link
        ) {

            return;

        }


        const url =
            new URL(
                link.href,
                location.origin
            ).href;


        /*
         * Evita duplicazioni.
         */

        if (
            originalCard.dataset[
                LOADED_ATTRIBUTE
            ] ===
            "true"
        ) {

            return;

        }


        originalCard.dataset[
            LOADED_ATTRIBUTE
        ] =
            "true";


        /*
         * Recupero dati.
         */

        const productData =
            await getProductData(
                url
            );


        if (
            !productData
        ) {

            return;

        }


        /*
         * Costruzione dati.
         */

        const cardData =
            buildCardData(
                productData
            );


        if (
            !cardData
        ) {

            return;

        }


        /*
         * IMPORTANTE:
         *
         * Dopo il fetch non utilizziamo
         * più la reference originale.
         *
         * Cerchiamo la card attualmente
         * presente nel DOM tramite URL.
         */

        const currentCard =
            findCurrentCard(
                url
            );


        if (
            !currentCard
        ) {

            return;

        }


        /*
         * Render.
         */

        renderCard(
            currentCard,
            cardData
        );

    }


    /* =====================================================
       15. AVVIO
       ===================================================== */

    async function init() {

        const cards =
            [
                ...
                document.querySelectorAll(
                    CARD_SELECTOR
                )
            ];


        if (
            !cards.length
        ) {

            return;

        }


        /*
         * Elaborazione a gruppi.
         */

        const batchSize =
            4;


        for (
            let i = 0;
            i < cards.length;
            i += batchSize
        ) {

            const batch =
                cards.slice(
                    i,
                    i +
                    batchSize
                );


            await Promise.all(
                batch.map(
                    card =>
                        processCard(
                            card
                        )
                )
            );

        }

    }


    /* =====================================================
       16. AVVIO DOM
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }
    else {

        init();

    }


})();
