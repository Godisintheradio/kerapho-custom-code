# Filtri prodotti globali — v1.4.0

Pannello compatto con checkbox e combinazioni di categorie e tag. Il componente riusa la
cloud tag e le schede prodotto già presenti nelle pagine elenco prodotti; non esegue fetch,
non legge le singole pagine prodotto e non modifica il catalogo.

## Collegamento Squarespace

Sostituire il precedente blocco in **Impostazioni → Avanzate → Iniezione codice → Footer**:

```html
<!-- Kerapho: filtri prodotti globali -->
<link rel="stylesheet" href="https://godisintheradio.github.io/kerapho-custom-code/css/product-tag-filters.css?v=1.4.0">
<script defer src="https://godisintheradio.github.io/kerapho-custom-code/js/product-tag-filters.js?v=1.4.0"></script>
```

Mantenere un blocco tag Squarespace collegato alla raccolta corrente in ogni pagina elenco: fornisce le voci del pannello. Senza un blocco corrispondente il componente lascia intatta la navigazione nativa.
Non duplicare i collegamenti. Dopo l'aggiornamento ricaricare con Ctrl+F5.

## Design

- Pannello inserito dentro `.ProductList-filter.ProductList-filter--categories`.
- Il contenitore nativo resta nella sua posizione e mantiene la larghezza
  stabilita dal template; vengono nascosti solo i controlli originali al suo interno.
- Il contenitore della griglia mantiene la larghezza nativa. Le schede usano
  CSS Grid per ricompattare i risultati visibili, senza float o clear basati
  sulla posizione originale nel DOM. Il numero di colonne segue
  `data-items-per-row` e i breakpoint del template (960 e 640 px).
- Da 768 px pannello e tutti i gruppi inizialmente aperti, richiudibili manualmente.
- Sotto 768 px pannello e tutti i gruppi inizialmente chiusi; l’utente apre solo quelli necessari.
- Da 768 px il contenitore del filtro è sticky a 120 px dall’alto su tutte le raccolte gestite.
- Altezza naturale senza limite massimo e senza scrollbar interna: il filtro usa lo scorrimento della pagina. Su desktop resta sticky; se supera lo schermo, parte del pannello può rimanere fuori vista finché non si raggiunge il limite del contenitore.
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

## Correzione griglia v1.2.3

Il template usa float e `nth-child` per iniziare le righe. I prodotti esclusi
dal filtro rimangono nel DOM con display none, quindi le vecchie regole
continuano a contare anche le schede nascoste. Il risultato sono righe vuote
o parziali e allineamenti irregolari.

La classe `kf-product-grid` viene applicata soltanto alla griglia gestita dal
filtro. Su questa griglia CSS Grid dispone le sole schede visibili, annullando
float, clear, larghezze percentuali e margini delle singole schede. Mantiene
10 px tra colonne e 30 px tra righe. La correzione si applica alle sole raccolte con il filtro montato.

Nel CSS allegato sono inoltre presenti due dichiarazioni di padding della
ProductList-grid (una globale e una desktop). Non sono la causa del conteggio
nth-child: non occorre modificarle per applicare questa correzione.

## Estensione globale v1.4.0

Il componente individua la raccolta dai collegamenti della navigazione categorie e usa esclusivamente la cloud tag collegata allo stesso percorso. Non esegue richieste di rete, nemmeno quando il blocco tag manca. Schede prodotto e altre pagine sono escluse. I marchi ceramici presenti nello Shop sono inclusi nella mappa; i tag non classificati restano disponibili in Altri filtri.

## Tag pertinenti alle categorie — v1.4.0

Se vengono selezionate categorie, il pannello mostra solo i tag presenti nelle schede appartenenti ad almeno una categoria selezionata. I gruppi senza opzioni vengono nascosti. La scelta di un tag non riduce le altre opzioni: la disponibilità dipende solo dalle categorie. Senza categorie selezionate vengono ripristinati tutti i tag della cloud. Cambiando categorie, i tag selezionati non più pertinenti vengono rimossi anche da URL e conteggi. Su pagine native filtrate, la pulizia delle selezioni avviene solo dopo il ritorno alla raccolta base, per evitare di dedurre la disponibilità da un sottoinsieme ristretto. Con paginazione, la disponibilità riflette le sole schede caricate nella pagina. Nessuna richiesta aggiuntiva.
