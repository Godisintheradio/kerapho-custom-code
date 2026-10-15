(function () {
  "use strict";

  async function correggiFiltri() {
    const url = new URL(window.location.href);
    const filtri = [
      { parametro: "tag", elenco: "tags" },
      { parametro: "category", elenco: "categories" }
    ];

    if (!filtri.some(filtro => url.searchParams.has(filtro.parametro))) {
      return;
    }

    const normalizza = testo =>
      testo.trim().normalize("NFC").toLowerCase();

    // Legge la raccolta corrente senza applicare filtri.
    const endpoint = new URL(url.pathname, url.origin);
    endpoint.searchParams.set("format", "json");

    try {
      const risposta = await fetch(endpoint.href, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      if (!risposta.ok) return;

      const dati = await risposta.json();
      const raccolta = dati.collection;

      if (!raccolta) return;

      // Evita di intervenire se nel frattempo cambia pagina.
      if (window.location.href !== url.href) return;

      let modificato = false;

      for (const filtro of filtri) {
        const valore = url.searchParams.get(filtro.parametro);
        const elenco = raccolta[filtro.elenco];

        if (!valore || !Array.isArray(elenco)) continue;

        const nomi = [...new Set(
          elenco.filter(nome => typeof nome === "string")
        )];

        // Il nome è già esatto.
        if (nomi.includes(valore)) continue;

        const corrispondenze = nomi.filter(
          nome => normalizza(nome) === normalizza(valore)
        );

        // Corregge solo quando la corrispondenza è univoca.
        if (corrispondenze.length !== 1) continue;

        url.searchParams.set(
          filtro.parametro,
          corrispondenze[0]
        );

        modificato = true;
      }

      if (modificato) {
        window.location.replace(url.href);
      }
    } catch (errore) {
      console.warn(
        "[Filtri Squarespace] Lettura non riuscita:",
        errore
      );
    }
  }

  correggiFiltri();
})();
