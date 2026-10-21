# Filtri tag Arredo bagno — v1.1.0

Pannello compatto con checkbox e combinazioni di tag. Il componente riusa la
cloud tag e le schede prodotto già presenti su `/arredo-bagno`; non esegue fetch,
non legge le singole pagine prodotto e non modifica il catalogo.

## Collegamento Squarespace

Sostituire il precedente blocco in **Impostazioni → Avanzate → Iniezione codice → Footer**:

```html
<!-- Kerapho: filtri tag Arredo bagno -->
<link rel="stylesheet" href="https://godisintheradio.github.io/kerapho-custom-code/css/product-tag-filters.css?v=1.1.0">
<script defer src="https://godisintheradio.github.io/kerapho-custom-code/js/product-tag-filters.js?v=1.1.0"></script>
```

Mantenere il blocco tag Squarespace nella pagina: fornisce le voci del pannello.
Non duplicare i collegamenti. Dopo l'aggiornamento ricaricare con Ctrl+F5.

## Design

- Pannello dentro `.ProductList.products-collection-v2.sqs-pinterest-products-wrapper`,
  prima delle categorie e dei prodotti, allineato alla larghezza del catalogo.
- Pannello e gruppi inizialmente chiusi.
- Due colonne di gruppi su desktop, una su mobile.
- Opzioni affiancate con larghezza naturale e ritorno a capo automatico.
- Checkbox native, spaziatura compatta e area di tocco da 44 px su mobile.
- Conteggio prodotti visibile anche con pannello chiuso; conteggio selezioni per gruppo.
- Pulsante Azzera filtri e messaggio quando non ci sono corrispondenze.

## Combinazioni

Nello stesso gruppo le selezioni sono alternative (OR); tra gruppi sono
condizioni combinate (AND).

Esempio: Marchi = CIPI + VALDAMA e Materiale lavabo = Ceramica mostra i prodotti
in ceramica di Cipì oppure Valdama. Azzera filtri rimuove tutte le selezioni e
mantiene la categoria corrente.

I filtri si applicano alle classi `tag-*` delle schede esistenti, mantenendone
ordine, immagini, prezzi e collegamenti. Non deducono attributi dalle varianti.
Un prodotto corrisponde solo ai tag effettivamente assegnati nel catalogo.

Le selezioni sono salvate nel parametro URL `kf` (array JSON), ripristinate
all'apertura di un link condiviso e propagate ai link di categoria/paginazione.
Il parametro non richiede supporto lato Squarespace: il filtro viene applicato
dallo script dopo il caricamento. Non è memoria permanente del browser.

Se si parte da una pagina nativa `?tag=...`, al primo cambiamento si ricarica
una volta la categoria/raccolta senza quel parametro, conservando le checkbox
in `kf`. Questo evita di combinare i filtri su un catalogo già ristretto dal server.

## Copertura e manutenzione

Alla verifica del 21 ottobre 2026 la pagina principale contiene 151 schede
prodotto e non presenta paginazione. Il filtro può quindi usare l'intero elenco
attuale senza richieste aggiuntive.

Se in futuro viene attivata la paginazione, il filtro agisce sui prodotti presenti
nella pagina e il conteggio lo dichiara con “in questa pagina”. I link di
paginazione conservano le selezioni. Non scarica in background le altre pagine.

I gruppi dipendono dai tag presenti nella cloud. Colori con prefisso Colore e
misure numeriche vengono classificati automaticamente; nuovi marchi vanno
aggiunti alla mappa. Le altre voci compaiono in Altri filtri.

Le classi tag devono seguire la convenzione Squarespace `tag-nome-del-tag`.
Per tag nuovi con caratteri speciali verificare la corrispondenza con le classi
prodotte dal template prima di pubblicarli.

## Rimozione

Eliminare i due collegamenti dall'iniezione codice e ricaricare la pagina.
La cloud originale torna visibile e le schede non sono più filtrate.
