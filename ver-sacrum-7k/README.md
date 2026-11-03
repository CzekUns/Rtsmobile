# Ver Sacrum · Le Genti — RTS JavaScript

Questo è un **prototipo strategico indipendente**, ospitato nella repository Ver Sacrum ma completamente contenuto in `ver-sacrum-7k/`. Parte da alcuni principi di **Seven Kingdoms** (villaggi con popolazione, unità mobilitabili, risorse, edifici, comunità indipendenti e influenza diplomatica) per sviluppare in futuro un'identità propria.

**Non è la conversione integrale di Seven Kingdoms**: il gioco originale è scritto principalmente in C++ e compilato in WebAssembly nella repository Seven Kingdoms Mobile. Questo prototipo è un motore originale, scritto direttamente in JavaScript moderno e modificabile senza compilare nulla. Non incorpora dati, codice, grafica o audio del gioco originale.

## Avvio

Apri il percorso pubblicato su GitHub Pages:

https://czekuns.github.io/Rtsmobile/ver-sacrum-7k/

Oppure avvia un server statico dalla root della repository:

```bash
python3 -m http.server 8000
```

Apri poi `http://localhost:8000/ver-sacrum-7k/`. I moduli JavaScript ES richiedono un server HTTP, non l'apertura di `index.html` direttamente come file.

## Struttura separabile

```text
ver-sacrum-7k/
├── index.html    # Layout orizzontale stile 7K, top bar, mappa e pannello destro
├── manifest.webmanifest # Schermo orizzontale in modalità PWA
├── style.css     # UI classica RTS orizzontale, con blocco portrait
├── game.js       # Comandi touch, menu e rapporti, orientamento e salvataggio
├── sim.js        # Regole, mondo, abitanti, risorse, costruzioni, diplomazia
├── render.js     # Rendering top-down su Canvas 2D, minimappa e camera
├── tests/
│   └── sim.test.mjs
└── README.md
```

Per staccare il progetto in futuro sarà sufficiente spostare **tutta questa cartella** in una nuova repository e pubblicare la relativa `index.html`. Il percorso non dipende dai file alla root di Ver Sacrum.

## Dove modificare le regole

- `sim.js → BUILDINGS`: nuovi edifici, costi e ingombri.
- `sim.js → FACTIONS`: nomi e colori delle genti.
- `sim.js → Strategy.createInitialWorld`: disposizione e contenuti iniziali della partita.
- `sim.js → Strategy.updatePerson`: lavori, trasporto fisico, produzione e movimento.
- `sim.js → Strategy.gift / annex`: influenza e annessione pacifica.
- `render.js`: stile grafico, prospettiva, token ed edifici.
- `game.js`: comandi, UX mobile, interfaccia e selezione.

## Funzionalità della prima versione

- Mappa 64×48 con terreno procedurale, panoramica, zoom e minimappa.
- Tre comunità, con villaggi distinti e colori di fazione.
- Dieci abitanti persistenti, cinque già fuori dal villaggio, cinque residenti.
- Selezione di un singolo abitante, spostamento, rientro e mobilitazione.
- Alberi, pietra e cibo raccolti da un abitante fisicamente presente, caricati e trasportati in magazzino.
- Costruzione di villaggio, campo, mercato e magazzino, con terreno scelto prima della conferma.
- Il cantiere viene costruito progressivamente da un lavoratore.
- Campi coltivati e consegna dei raccolti.
- Inventari locali, consumo alimentare giornaliero e crescita della popolazione.
- Influenza e fiducia verso le comunità indipendenti; doni alimentari e unione pacifica al raggiungimento delle soglie.
- Pausa, diario degli eventi, salvataggio locale automatico e ripristino.

## Interfaccia Seven Kingdoms — orizzontale obbligatorio (UI v3)

Il gioco riprende la **geometria dell'interfaccia classica di Seven Kingdoms** (non il motore originale o le sue texture): barra superiore con otto rapporti su due righe, risorse e data, tre modalità della minimappa e pulsante MENU; grande mappa principale a sinistra; minimappa navigabile nell'angolo alto destro e scheda di selezione/azioni nella colonna destra.

- **Solo orizzontale.** In verticale la pagina mostra una schermata di rotazione e la simulazione si ferma, senza alterare i dati.
- Il manifest dell'app richiede `landscape`; il pulsante a schermo intero prova anche a bloccare l'orientamento, dove il browser lo permette.
- In ogni finestra orizzontale l'interfaccia mantiene la disposizione 7K con pannello laterale destro, invece di spostarlo sotto la mappa.
- Gli otto rapporti sono `Regni`, `Villaggi`, `Economia`, `Scambi`, `Militari`, `Saperi`, `Costruisci`, `Cronache`. I rapporti non inventano funzionalità non implementate: commercio automatizzato e combattimenti sono indicati come futuri.
- Le tre viste della minimappa sono `Terreno`, `Confini` e `Villaggi`.
- `MENU` contiene pausa/riprendi, salva, nuova partita, schermo intero e guida.
- Nessun file del Ver Sacrum principale o di Seven Kingdoms originale è stato modificato.

## Comandi

**Smartphone:** un tocco seleziona; dopo aver selezionato una persona, tocca la risorsa per raccoglierla, un cantiere per costruire, un campo per coltivarlo, oppure il terreno per muoverti. Trascina per scorrere la mappa; con due dita puoi ingrandire o ridurre.

**PC:** clic sinistro per selezionare e impartire ordini, trascinamento per la camera. Tasti `Esc` per annullare il piazzamento, `Spazio` per pausa e `Ctrl+S` per salvare.

## Perimetro del prototipo

Questo primo nucleo **non comprende ancora** tutto Seven Kingdoms: AI strategica completa, guerra fra regni, assedi, ricerca tecnologica, formazione di eserciti, commercio automatizzato, produzione complessa e pathfinding con ostacoli restano da sviluppare. Il pulsante di mobilitazione distingue i soldati ma non implementa ancora il combattimento.

Non si alterano i salvataggi o i file del Ver Sacrum principale. La chiave di salvataggio è `ver-sacrum-le-genti-save-v1`, distinta da `terra-italica-save-v*`. Per la versione futura autonoma, conservare una migrazione dati quando cambia il formato del salvataggio.

## Test

```bash
node --test ver-sacrum-7k/tests/sim.test.mjs
```

## Scelta progettuale

**Seven Kingdoms è il modello di partenza, non il risultato finale.** L'evoluzione prevista per Ver Sacrum approfondirà persone persistenti, economia fisica locale, specializzazioni, logistica e sviluppo organico delle comunità senza copiare i sistemi 1:1.
