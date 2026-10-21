# Filtri tag Arredo bagno — v1.2.2

Pannello compatto con checkbox e combinazioni di categorie e tag. Il componente riusa la
cloud tag e le schede prodotto già presenti su `/arredo-bagno`; non esegue fetch,
non legge le singole pagine prodotto e non modifica il catalogo.

## Collegamento Squarespace

Sostituire il precedente blocco in **Impostazioni → Avanzate → Iniezione codice → Footer**:

```html
<!-- Kerapho: filtri tag Arredo bagno -->
<link rel="stylesheet" href="https://godisintheradio.github.io/kerapho-custom-code/css/product-tag-filters.css?v=1.2.2">
<script defer src="https://godisintheradio.github.io/kerapho-custom-code/js/product-tag-filters.js?v=1.2.2"></script>
```

Mantenere il blocco tag Squarespace nella pagina: fornisce le voci del pannello.
Non duplicare i collegamenti. Dopo l'aggiornamento ricaricare con Ctrl+F5.

## Design

- Pannello inserito dentro `.ProductList-filter.ProductList-filter--categories`.
- Il contenitore nativo resta nella sua posizione e mantiene la larghezza
  stabilita dal template; vengono nascosti solo i controlli originali al suo interno.
- La griglia prodotti mantiene il layout e le dimensioni native.
- Da 768 px pannello aperto; Categorie aperte su tutti gli schermi.
- Gli altri gruppi partono chiusi. Su mobile il pannello parte chiuso;
  aprendolo, le categorie sono già espanse.
- Gruppi disposti su una colonna nel contenitore nativo.
- Opzioni affiancate con larghezza naturale e ritorno a capo automatico.
- Checkbox native, spaziatura compatta e area di tocco da 44 px su mobile.
- Conteggio prodotti visibile anche con pannello chiuso; conteggio selezioni per gruppo.
- Pulsante Azzera filtri e messaggio quando non ci sono corrispondenze.

## Combinazioni

Nello stesso gruppo le selezioni sono alternative (OR); tra gruppi sono
condizioni combinate (AND).

Esempio: Marchi = CIPI + VALDAMA e Materiale lavabo = Ceramica mostra i prodotti
in ceramica di Cipì oppure Valdama. Azzera filtri rimuove tutte le selezioni e
rimuove anche le categorie selezionate.

Categorie: selezioni alternative (Lavabi oppure Sanitari), combinate con gli
altri gruppi. Per esempio Lavabi + Sanitari e CIPI mostra i prodotti Cipì
appartenenti ad almeno una delle due categorie.

I filtri si applicano alle classi `category-*` e `tag-*` delle schede esistenti, mantenendone
ordine, immagini, prezzi e collegamenti. Non deducono attributi dalle varianti.
Un prodotto corrisponde solo ai tag effettivamente assegnati nel catalogo.

Le selezioni sono salvate nei parametri URL `kf` (tag) e `kc` (categorie),
come array JSON, ripristinate all'apertura di un link condiviso e propagate ai
link di paginazione.
Il parametro non richiede supporto lato Squarespace: il filtro viene applicato
dallo script dopo il caricamento. Non è memoria permanente del browser.

Se si parte da una pagina nativa con `?tag=...` o `?category=...`, il filtro
riconosce la selezione iniziale. Al primo cambiamento si ricarica una volta
la raccolta senza questi parametri, conservando le checkbox in `kf` e `kc`.
Questo permette di aggiungere altri segmenti senza restare nel sottoinsieme
ristretto dal server. Azzera filtri torna quindi all'intero catalogo.

## Copertura e manutenzione

Alla verifica del 21 ottobre 2026 la pagina principale contiene 151 schede
prodotto e non presenta paginazione. Il filtro può quindi usare l'intero elenco
attuale senza richieste aggiuntive.

Se in futuro viene attivata la paginazione, il filtro agisce sui prodotti presenti
nella pagina e il conteggio lo dichiara con “in questa pagina”. I link di
paginazione conservano le selezioni. Non scarica in background le altre pagine.

Le categorie vengono lette dai link nativi del catalogo. I gruppi di tag
dipendono dai tag presenti nella cloud. Colori con prefisso Colore e
misure numeriche vengono classificati automaticamente; nuovi marchi vanno
aggiunti alla mappa. Le altre voci compaiono in Altri filtri.

Le classi devono seguire le convenzioni Squarespace `tag-nome-del-tag` e
`category-nome-della-categoria`.
Per tag nuovi con caratteri speciali verificare la corrispondenza con le classi
prodotte dal template prima di pubblicarli.

## Rimozione

Eliminare i due collegamenti dall'iniezione codice e ricaricare la pagina.
La cloud originale torna visibile e le schede non sono più filtrate.
