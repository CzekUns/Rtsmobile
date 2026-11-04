# Diario avanzamento

## 2026-11-04 — Importazione asset v1
- Generato un nuovo concept sheet con ulteriori edifici (taverna, mercato, magazzino, distilleria, abitazioni), terreni e UI in stile RTS 2000.
- Creato pacchetto locale di asset derivati: 4 edifici, 2 sprite-sheet personaggio, 12 varianti terreno, foglio HUD, concept sheet; pacchetto ZIP offerto in conversazione.
- CARICATI REALMENTE IN REPO: 3 WebP raster low-res (residenza, gendarme idle, mercenario idle); 4 tile isometrici SVG (mud, cobble, puddle, debris); 5 props SVG (barrel, crate, street lamp, wooden fence, lantern).
- Creati assets/manifest.json, assets/README.md e assets/index.html per catalogo e anteprime.
- Integrato game.js con caricamento delle 3 immagini raster e fallback procedurale. I fogli non caricati sono indicati come DA IMPORTARE, non dichiarati presenti.
- Test attualmente disponibili: upload e tracciamento GitHub verificati; non è stato effettuato collaudo browser della resa visuale. La transizione a isometria completa resta pendente.


## 2026-11-04 — Inizializzazione + prima implementazione
- Scelta repository: `CzekUns/Rtsmobile` (GitHub Pages distribuisce la root di main).
- Scelta path riservato: `quartieri-ombra/`, inizialmente inesistente e verificato libero.
- Creazione di README.md, SPEC.md, AGENTS.md e ROADMAP.md con criteri di completamento e istruzioni di isolamento.
- Prima implementazione: `index.html`, `style.css`, `game.js` indipendenti, avvio per 3 difficoltà, disegno tattico su Canvas, mappa con 15 edifici, fedeltà, influenza, selezione, ordini, pathfinding a griglia, esazione, reclutamento casuale, mercenari, IA, combattimento, HUD inferiore e minimappa.
- Controllo statico con parser JS: sintassi di `game.js` valida; riferimenti relativi a CSS/JS verificati.
- Attivata automazione oraria `Worker orario Quartieri d'Ombra`, ID `6aeae2b713b0819184a4bc340c5a0ae6`, dalle 09:00 Europe/Rome con ricorrenza ogni ora.
- NON ancora verificato: deployment effettivo della nuova sottopagina Pages, smoke browser, mobile/touch e correttezza dinamica completa. Non considerare gameplay completo né asset approvati.
- Attività della prima esecuzione worker: verificare link Pages e render in browser, bugfix critici, comandi e loop; scrivere test meccanici ripetibili.

## 2026-11-04 09:00 — Worker 1
- Esaminati integralmente AGENTS.md, SPEC.md, ART_DIRECTION.md, ROADMAP.md, WORKLOG.md e README.md.
- Commit `aebf2beb830aab029c3c473fd09aba8925f53e41`: aggiunti trascinamento mappa via pointer, zoom con pinch su touch e rotella mouse, coordinate input trasformate correttamente e cornice viewport nella minimappa.
- Corretto accumulo esperienza gendarmi: in precedenza veniva sommato una volta per ogni edificio nel raggio (livellamento erroneamente accelerato); ora una volta per unità e secondo ruolo.
- Selezione e movimento bloccati durante pausa; feedback esplicito quando la destinazione non è raggiungibile.
- Verifica eseguita: parsing sintattico JavaScript tramite `new Function` riuscito prima del commit.
- Non eseguiti: smoke test browser desktop/mobile, test di bilanciamento, test visivi; non dichiarare questi elementi verificati.
- Gli asset ImageGen prodotti nella conversazione non sono ancora stati integrati come sprite runtime; richiedono preparazione con trasparenza, normalizzazione e caricamento binario in repository. La grafica attuale resta provvisoria.
- Prossima iterazione: test browser reali, bugfix del pathfinding e prima integrazione degli asset grafici approvati con caricamento/fallback.
