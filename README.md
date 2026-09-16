# Terra Italica — RTS Mobile

RTS sandbox mobile-first ambientato nell'Italia preromana. Il progetto è una riscrittura indipendente ispirata alle premesse di simulazione della versione PC `rts`, ma con visuale top-down e interazione progettata per smartphone.

## Avvio
Non richiede build, Node o installazioni. GitHub Pages pubblica direttamente la branch `main` tramite GitHub Actions.

## Controlli touch
- Tocca un abitante per selezionarlo; trascina un dito per selezionare un gruppo con il riquadro.
- Tieni premuto **MOD** e tocca un bersaglio per impartire un ordine contestuale a tutta la selezione.
- Tieni premuto **MOD** e trascina per muovere la mappa.
- Usa due dita senza MOD oppure `+ / −` per lo zoom.
- In **Comunità**, tocca una scheda per selezionare soltanto quell'abitante.
- In **Ordini**, scegli un'azione e tocca il bersaglio: vale per tutto il gruppo selezionato. **Libera** annulla i compiti del gruppo.
- In **Costruisci**, scegli una struttura e tocca il terreno.
- In **Mondo**, salva/carica la partita locale, genera un territorio o torna al villaggio.

## Stato attuale
La build contiene già la vertical slice completa del loop di base: mondo procedurale, cinque abitanti individuali, inventari, skill, risorse fisiche, logistica di deposito, costruzioni, strade, agricoltura stagionale, fauna, domesticazione, combattimento, incursioni, crescita della popolazione e salvataggi.

Vedi `DESIGN.md` per i principi che devono guidare le prossime iterazioni.


## Verifica dei controlli
Con Node.js: `node tests/controls.cjs`. Il test verifica i controlli e la selezione con DOM/canvas simulati; non sostituisce una prova touch su dispositivo.
