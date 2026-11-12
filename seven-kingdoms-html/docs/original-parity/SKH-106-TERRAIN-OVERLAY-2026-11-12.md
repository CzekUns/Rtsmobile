# SKH-106-TERRAIN-OVERLAY-2026-11-12

**Componente:** composizione dei tile originali e decorazioni procedurali della mappa.

**Fonte originale / licenza:** anteprima dell'atlante originale 7KAA `I_TERN1.RES` già descritta in `playtest/original-terrain.js` (32 tessere pure, 32×32, GPL-2.0-only dichiarata dal progetto); sorgente di riferimento `the3dfxdude/7kaa`. Non sono stati introdotti o copiati nuovi asset. Le texture, le coste e la generazione del mondo non sono ancora in parità con 7KAA.

**HTML prima:** `view.js:WorldView.tileDraw` disegnava la tessera dall'atlante e poi vi sovrapponeva alberi triangolari, colline geometriche, linee d'acqua o erba della demo, alterando il contenuto pittorico della risorsa originale.

**Correzione:** quando `OriginalTerrainPreview.drawTile` restituisce `true`, interrompe il rendering del tile prima di aggiungere le decorazioni procedurali. Se la risorsa non è disponibile, rimane intatto il fallback disegnato in Canvas, anche alle scale piccole. Nessun intervento alla pipeline Asset #13, ai controlli touch o alle regole.

**Test:** `node --test tests/integration/terrain-overlay-parity.test.js`; quattro casi che eseguono il vero `WorldView.tileDraw` con Canvas simulato. Verifica automatica GitHub Actions richiesta; confronto Chromium 1×/2×, Android e screenshot originale ancora da eseguire.

**Commit:** `19e5946` (renderer), `25517b0` (test). **Stato: DA CORREGGERE / DA VERIFICARE VISIVAMENTE.** La rimozione delle decorazioni sovrapposte è verificabile nel codice; la parità complessiva della mappa non è certificata.

**Dipendenza successiva precisa:** confronto delle transizioni coste/terreno e delle bitmap originali con screenshot 7KAA, coordinato con la corsia Asset senza modificarne gli archivi o i manifest.
