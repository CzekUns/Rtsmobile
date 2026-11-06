# Seven Kingdoms — HTML Edition

> **Stato: riscrittura JavaScript nativa, fase 1 — incompleta.** Non è Ver Sacrum, non è il vecchio prototipo `ver-sacrum-7k` e non è una conversione integrale di Seven Kingdoms. Questa nuova base ricalca, per ora in scala ridotta, le meccaniche e l'interfaccia di **Seven Kingdoms: Ancient Adversaries**.

## Prova rapida della prima integrazione

**[Apri la build di prova Core + Movimento](https://czekuns.github.io/Rtsmobile/seven-kingdoms-html/?playtest=1)**

**Anteprima con i primi PNG originali, attiva anche senza parametri:** [Apri il gioco con gli sprite NORMAN](https://czekuns.github.io/Rtsmobile/seven-kingdoms-html/?sprites=1). Compatibile anche con `?playtest=1&sprites=1`. I due soldati e il forte del regno rosso sono soltanto *proxy grafici di prova*: asset normanni su entità ancora dimostrative, senza cambiamenti a gameplay, salvataggi e input. Per tornare alla grafica precedente usa `?sprites=0`. Gli altri elementi mantengono la grafica temporanea. Il confronto con la medesima scena originale 7KAA e il test Android sono ancora da completare.

Questa modalità è **opzionale**: la versione normale dello stesso indirizzo senza `?playtest=1` resta invariata. La partita di prova usa una diversa chiave di salvataggio (`seven-kingdoms-html-quick-playtest-v1`), quindi non sovrascrive la demo precedente.

Cosa testare in 2 minuti: aprire in orizzontale, chiudere la guida, toccare un soldato vicino a Corinto, quindi un terreno libero oltre un edificio o una striscia d'acqua; l'unità deve cercare un percorso senza attraversare il blocco. Verificare pausa/riprendi, costruzione e salvataggio. Se il punto è occupato, compare un messaggio: scegliere una casella libera.

**Cosa è integrato qui:** moduli Core e Movimento indipendenti, accumulatore temporale a passo fisso, A* di movimento locale limitato alle unità della demo, test regressione. **Cosa NON è ancora integrato:** sprite originali, UI pixel-perfect, popolazione multietnica completa, combattimento, commercio fisico, salvataggi C++ e reale parità 7KAA. L'assegnazione del lavoratore a un edificio conserva la scorciatoia della demo.

## Avvio

[Apri il prototipo HTML/JS](https://czekuns.github.io/Rtsmobile/seven-kingdoms-html/)

In locale, dalla radice della repository:

```bash
python3 -m http.server 8000
# http://localhost:8000/seven-kingdoms-html/
```

**Nessuna dipendenza, nessuna compilazione, nessun .wasm.** Richiede un browser moderno con moduli ES e Canvas 2D.

## Lavoro parallelo con agenti

**[AGENTS.md](./AGENTS.md)** — regole operative per ogni agente e file vietati/condivisi.
**[PARALLEL_WORK.md](./PARALLEL_WORK.md)** — sei filoni isolati, branch, contratti, worktree, handoff e sequenza di integrazione.
**[WORKSTREAMS.json](./WORKSTREAMS.json)** — definizione machine-readable dei path esclusivi, verificata su pull request dal workflow `Seven Kingdoms HTML - JS tests and stream scope`.
**[Issue SKH-101–106](https://github.com/CzekUns/Rtsmobile/issues)** — incarichi pronti da assegnare agli agenti; **la loro creazione non implica agenti attivi**.

Le altre attività `work/T*` appartengono al lavoro precedente sul gioco Ver Sacrum e NON vanno riutilizzate per la riscrittura Seven Kingdoms.

## Piano maestro di sviluppo e asset

**[PIANO_DI_SVILUPPO.md](./PIANO_DI_SVILUPPO.md)** — calendario per fasi, priorità, dipendenze, gate di collaudo, backlog completo di gioco, mod e asset da convertire/creare. È il documento da leggere per primo prima di implementare nuove funzionalità; include una checklist immediata e il registro di avanzamento.

**[PORTING_MAP.md](./PORTING_MAP.md)** — corrispondenze tra sorgenti C++ originali e moduli JavaScript per verificare che la conversione segua Seven Kingdoms e non Ver Sacrum.

## Cosa deve essere questo progetto

Si vuole **riscrivere Seven Kingdoms**, un modulo alla volta, per poter personalizzare in JavaScript il comportamento del gioco. Il riferimento è l'originale 7KAA GPLv2, non il game design di Ver Sacrum.

Questo sviluppo è ospitato temporaneamente in `CzekUns/Rtsmobile/seven-kingdoms-html/`, autonomo e facilmente spostabile in una nuova repository. I file dell'altra cartella `ver-sacrum-7k/` sono un esperimento precedente di un gioco differente, da non confondere con il porting di Seven Kingdoms.

- Riferimento giocabile originale: [CzekUns/sevenkindomsmobile](https://github.com/CzekUns/sevenkindomsmobile), ancora basato sul codice C++ 7KAA compilato a WebAssembly.
- Codice sorgente upstream 7kaa: https://sourceforge.net/p/skfans/7kaa/ci/master/tree/
- Manuale di Seven Kingdoms: https://7kfans.com/downloads/7kaa-manual.pdf
- Licenza del gioco, del suo sorgente e della maggior parte dei dati: **GPL-2.0-only**. Il marchio Seven Kingdoms appartiene a Enlight Software. La musica ha una licenza distinta e non è copiata in questa riscrittura.

## File modificabili

```text
seven-kingdoms-html/
  index.html    # Schermata 800×600, pannelli, minimappa, pulsanti
  style.css     # Aspetto dell'interfaccia
  rules.js      # MECCANICHE: villaggi, fedeltà, tasse, reclute, edifici, filiere
  view.js       # Rendering canvas, grafica unità e villaggi, minimappa
  game.js       # Interazione mouse/touch, rapporto F1–F9, salvataggi, fullscreen
  COPYING.txt   # Licenza GPL v2 (testo completo)
  README.md
```

**Per cambiare le regole** si lavora su `rules.js`; per sostituire la grafica temporanea con gli sprite originali e la loro decodifica si lavora su `view.js`; per i comandi e l'esperienza mobile su `game.js`.

## Stato della fase 1

Primi sistemi **funzionanti**, ma non ancora identici nei numeri o nel comportamento alla release originale:

- Mappa procedurale, camera, movimento delle unità, minimappa, zoom e scorrimento
- Layout classico 800×600, nove tasti dei rapporti, pannello destro
- Un regno giocabile, un regno rivale e tre villaggi indipendenti
- Villaggi con popolazione, fedeltà, resistenza, tasse, sussidi e reclutamento
- Influenza sui villaggi indipendenti tramite un forte collegato; unione pacifica dopo riduzione della resistenza
- Edifici collocabili: forte, miniera, fabbrica, mercato, torre della scienza, locanda
- Lavoratori assegnabili, produzione semplificata (miniera → fabbrica → mercato), ricerca progressiva
- Pausa, velocità, fullscreen, schermo orizzontale, salvataggio locale
- Rapporti iniziali: Regni, Villaggi, Economia, Commercio, Militari, Tecnologia, Spie, Classifica e Notizie

**Non funzionanti ancora e da NON presentare come sviluppati:** guerra, combattimenti, assedi, AI completa, movimento con vero pathfinding, commercio fisico con carovane, spionaggio, propaganda complessa, diplomazia multilaterale, ricchezza e prezzi per merci individuali, variazioni dei 7 popoli, mostri Fryhtan, magia, dei, campagna, rete multiplayer, sequenze degli eventi originali, salvataggi compatibili con 7KAA e grafica originale.

**La grafica ora è una ricostruzione provvisoria disegnata in Canvas.** Il motore JS non legge ancora gli archivi SPRITE/RESOURCE del 7kaa originale; il layout 800×600 serve da punto di aggancio per portarli in seguito.

## Prossimo ordine di conversione

1. **Modello dati originale e asset.** Importare le definizioni di regni/culture, unità, villaggi, edifici, risorse e animazioni dal sorgente e dai dati GPL, con converter degli archivi in immagini WebP/PNG e JSON utilizzabili dal browser.
2. **Villaggi e controllo della popolazione.** Fedeltà per etnia, resistenze, collegamento ai forti e controllo delle fazioni. Calcoli calibrati sui sorgenti 7kaa, non numeri arbitrari come nella fase 1.
3. **Edifici e ciclo di merci.** Lavoratori, produzione, magazzini dei mercati e trasporto via carovane reali.
4. **Militari e conflitti.** Reclute e addestramento con ufficiali, attacco/ritirata, movimento/pathfinding, assedi, catture e difesa.
5. **Diplomazia, spionaggio, indipendenti e intelligenza artificiale** con comportamenti originali.
6. **Interfaccia pixel-perfect**, scenari, salvataggi/versioni e test paritari confrontati con Seven Kingdoms originale.

Il primo obiettivo di accettazione **non** è «sembra un RTS». È che, su uno scenario semplice, una partita in questo engine produca gli stessi effetti di Seven Kingdoms nelle azioni essenziali.

## Interazione

- Telefono **orizzontale**: un tocco seleziona, un altro tocco sul terreno impartisce l'ordine all'unità selezionata. Trascina la mappa; pizzica per zoomare. Tocca minimappa per spostare la visuale. Il tasto ⛶ tenta schermo intero e orientamento orizzontale.
- PC: clic seleziona; tasto destro dà ordini; trascinamento muove la visuale. F1–F9: rapporti; 0/Spazio: pausa; 1–5: velocità; S: salva; Esc: annulla costruzione.
- Le nuove partite ripartono da uno scenario dimostrativo; non vengono toccati i salvataggi del gioco originale né quelli di Ver Sacrum.

## Licenza e provenienza

I file della ricostruzione sono pubblicati sotto **GNU GPL versione 2**. Si riconoscono autori e titolari del progetto Seven Kingdoms/7kfans e del marchio; questa non è una release ufficiale. Non sono stati incorporati musica o contenuti non coperti da licenze adatte. Il testo completo della licenza è in `COPYING.txt`.
