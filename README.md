# Terra Italica — RTS Mobile

RTS sandbox mobile-first ambientato nell'Italia preromana. La direzione funzionale è descritta nel handoff Ver Sacrum desktop Godot; questa PWA ha visuale top-down e controlli dedicati agli smartphone, e non ha ancora parità di funzioni con il desktop.

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

## Stato attuale — Build 30
Mondo procedurale, cinque abitanti, raccolta, costruzioni, fauna, combattimento e prima filiera fisica **campo → mulino → forno → Casa comune**. Gli edifici hanno scorte locali, gli abitanti trasportano le merci e il salvataggio conserva i viaggi in corso.

Apri **Mondo → Filiera** per inventari e rotte. Il pannello mette in pausa la simulazione. Dopo sospensione o caricamento premi ▶ per riprendere. I salvataggi precedenti vengono importati conservando l'originale.

Leggi [guida, stato e limiti della build](docs/BUILD_29.md) e [handoff funzionale](docs/HANDOFF_MOBILE.md). Villaggi evoluti, paperdoll, skill separate, mercati e carovane restano lavori successivi.

## Verifiche
Con Node.js:

```sh
node tests/controls.cjs
node tests/simulation.cjs
node tests/debug.cjs
```

I test usano DOM/canvas simulati; non sostituiscono una prova touch e prestazionale su dispositivo.

## Correzioni Build 30
- I sentieri non possono spendere legna prenotata dai trasporti.
- I percorsi controllano nuovi ostacoli prima di ogni passo: una nuova palizzata ferma il passaggio; i trasporti ricalcolano il percorso.
- Piazzare un edificio elimina la precedente selezione di gruppo e i relativi indicatori.
