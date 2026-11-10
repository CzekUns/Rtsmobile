# PARITY-HUD-2026-11-10-REPORT-STATE

**Componente:** stato interattivo dei nove pulsanti Rapporti nella barra superiore.

**Originale:** interfaccia originale 7KAA, riferimento sorgente generale `the3dfxdude/7kaa`; l'esatta grafica e la semantica dei pulsanti non sono state certificate con screenshot. Non si dichiara parità grafica.

**HTML:** `seven-kingdoms-html/index.html` contiene nove pulsanti `data-report`; `game.js` apriva il rapporto e gestiva `.active`, ma non esponeva `aria-pressed`. Il tasto Escape chiudeva il menu senza sincronizzare `aria-expanded`.

**Correzione:** `game.js` sincronizza `aria-pressed` con la classe visiva in apertura, chiusura e chiusura nativa del dialogo; Escape riporta `aria-expanded=false`. La geometria e la grafica esistenti non cambiano, come i controlli mobile approvati.

**Stato:** DA CORREGGERE per parità grafica, correzione funzionale implementata sul branch. Test statici: `node --test tests/ui/report-hud-state.test.js`; test browser, screenshot 1×/2×, CI e deploy da verificare. Nessun asset aggiunto o copiato; PR Asset #13 intatta.

**Prossimo:** confronto verificabile della texture e delle icone della barra superiore originale prima di sostituire elementi visivi.
