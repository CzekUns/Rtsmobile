# SKH-HUD-REPORT-STATE · 2026-11-11

Stato: **DA VERIFICARE** (implementazione e controllo statico effettuati; CI/browser non certificati).

## Fonte e differenza

HTML di partenza: `seven-kingdoms-html/index.html` (nove pulsanti `data-report`), `game.js` (`setReport`, `closeReport` e evento nativo `reportDialog.close`). I rapporti sono un'interfaccia della riscrittura: il comportamento accessibile `aria-pressed` è una miglioria HTML, **non** una proprietà attribuita al Seven Kingdoms originale.

Prima: la classe CSS `active` era aggiornata, ma lo stato del pulsante non era esposto semanticamente. In particolare la chiusura nativa del dialog (anche Escape) azzerava la classe senza sincronizzare `aria-pressed`.

Dopo: i nove pulsanti iniziano con `aria-pressed=false`; `setReport` assegna esattamente un pulsante attivo; sia `closeReport` sia l'evento nativo `close` azzerano classe e attributo. I controlli touchscreen COMANDI, MOD e levetta restano invariati.

## Modifiche

PR #105, branch `agent/skh-integration/topbar-date-responsive`, commit `69fca6a`, `99530ef`, `edaedce`, `f537bfd`. File: `index.html`, `game.js`, `tests/topbar-report-state.test.js`.

## Test

Controllo diretto sui contenuti GitHub: 9 pulsanti univoci con tipo e stato iniziale; percorso apertura; due percorsi chiusura; evento `close` presente. **PASS statico**. Test Node aggiunti ma esecuzione CI e prova reale Chromium/Android **non ancora certificate**.

## Parità originale e dipendenze

Cornici, texture, pulsanti originali: ancora **BLOCCATI** dalla necessità di riferimenti e asset con provenienza/licenza verificata; non alterata la draft PR #13. Prossimo lavoro: confronto grafico originale/HTML a 1×/2× e riporto fedele di un componente grafico autorizzato.
