# Filtri tag Arredo bagno — v1.0.1

Il componente riorganizza la tag cloud già presente su `/arredo-bagno`.
Il blocco tag Squarespace deve rimanere nella pagina: è la sorgente dei link.
Non esegue fetch, non legge le schede prodotto e non modifica il catalogo.

## Collegamento Squarespace

Inserire una sola volta in **Impostazioni → Avanzate → Iniezione codice → Footer**:

```html
<!-- Kerapho: filtri tag Arredo bagno -->
<link rel="stylesheet" href="https://godisintheradio.github.io/kerapho-custom-code/css/product-tag-filters.css?v=1.0.1">
<script defer src="https://godisintheradio.github.io/kerapho-custom-code/js/product-tag-filters.js?v=1.0.1"></script>
```

Non copiare anche il contenuto dei file nel CSS personalizzato o in altri blocchi.
Lo script interviene solo su `/arredo-bagno`, anche con parametri tag/category.
Per gli aggiornamenti incrementare la versione di entrambi i collegamenti.

## Comportamento

- Pannello inserito come primo elemento di `.Main.Main--products-list`.
- Pannello e gruppi inizialmente chiusi su desktop e mobile, anche con tag attivo.
- Il blocco tag sorgente viene nascosto; mantenerlo nella pagina.
- Se il contenitore prodotti non è disponibile, il blocco originale resta visibile.
- Desktop: griglia a quattro colonne, due su schermi intermedi.
- Mobile: pulsante Filtra prodotti e gruppi richiudibili.
- Materiali, installazioni, sanitari, rubinetteria, marchi, colori e misure separati.
- Misure ordinate numericamente; tag sconosciuti visibili in Altri filtri.
- Filtro attivo evidenziato, con collegamento per rimuoverlo.
- Destinazioni originali dei tag conservate: una selezione tag alla volta,
  secondo il comportamento dei link esistenti. Non è un filtro multiplo.
- Le categorie native non vengono modificate.
- Il comando di rimozione elimina tag e paginazione dall'URL corrente,
  mantenendo eventuali altri parametri, compresa la categoria.
- Supporto a inserimento tardivo del blocco e navigazione Squarespace.

I raggruppamenti dipendono dai tag esistenti. La sezione non deduce materiali,
dimensioni o disponibilità dalle varianti prodotto. I nomi di nuovi marchi
si aggiungono alla mappa nello script; colori con prefisso Colore e misure
numeriche vengono riconosciuti automaticamente.

## Rimozione

Eliminare i due collegamenti dall'iniezione codice e ricaricare la pagina.
La tag cloud originale torna visibile.
