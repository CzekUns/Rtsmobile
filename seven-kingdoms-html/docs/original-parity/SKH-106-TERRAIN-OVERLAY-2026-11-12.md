# SKH-106-TERRAIN-OVERLAY-2026-11-12

**Componente:** composizione dei tile originali e decorazioni procedurali della mappa.

**Fonte originale / licenza:** anteprima dell'atlante originale 7KAA `I_TERN1.RES` già descritta in `playtest/original-terrain.js` (32 tessere pure, 32×32, GPL-2.0-only dichiarata dal progetto); sorgente di riferimento `the3dfxdude/7kaa`. Non sono stati introdotti o copiati nuovi asset. Le texture, le coste e la generazione del mondo non sono ancora in parità con 7KAA.

**HTML prima:** `view.js:WorldView.tileDraw` disegnava la tessera dall'atlante e poi vi sovrapponeva alberi triangolari, colline geometriche, linee d'acqua o erba della demo, alterando il contenuto pittorico della risorsa originale.

**Correzione:** quando `OriginalTerrainPreview.drawTile` restituisce `true`, interrompe il rendering del tile prima di aggiungere le decorazioni procedurali. Se la risorsa non è disponibile, rimane intatto il fallback disegnato in Canvas, anche alle scale piccole. Nessun intervento alla pipeline Asset #13, ai controlli touch o alle regole.

**Test:** `node --test tests/integration/terrain-overlay-parity.test.js`; quattro casi che eseguono il vero `WorldView.tileDraw` con Canvas simulato. Verifica automatica GitHub Actions richiesta; confronto Chromium 1×/2×, Android e screenshot originale ancora da eseguire.

**Commit:** `19e5946` (renderer), `25517b0` (test). **Stato: DA CORREGGERE / DA VERIFICARE VISIVAMENTE.** La rimozione delle decorazioni sovrapposte è verificabile nel codice; la parità complessiva della mappa non è certificata.

**Dipendenza successiva precisa:** confronto delle transizioni coste/terreno e delle bitmap originali con screenshot 7KAA, coordinato con la corsia Asset senza modificarne gli archivi o i manifest.

## Estensione: recupero del renderer atlas (12 novembre 2026)

**Differenza HTML verificata nel codice:** `OriginalTerrainPreview.drawTile` chiamava `ctx.save()` e `ctx.drawImage()` senza un `finally`. Se un'immagine apparentemente caricata falliva durante il disegno, il contesto Canvas non veniva ripristinato e il rendering del mondo poteva interrompersi senza fallback. Questa è una correzione di robustezza del renderer, non una nuova pretesa di parità pittorica con 7KAA.

**Implementazione:** `playtest/original-terrain.js` usa `try/catch/finally`: su successo ritorna `true`; su errore ritorna `false` affinché `WorldView.tileDraw` disegni il terreno alternativo; in entrambi i casi ripristina il Canvas. Nessun nuovo asset, palette o dimensione inventata.

**Test aggiunti:** `tests/integration/terrain-atlas-recovery.test.js` verifica il rendering normale, l'eccezione simulata nel vero percorso `WorldView.tileDraw` e le immagini incomplete/con dimensioni scorrette. Commit `33a36d85`, `06e144c9`. **Stato: DA VERIFICARE in CI e visivamente**; la suite locale e il browser non sono disponibili nel runtime di questa esecuzione per l'assenza di checkout GitHub via DNS.

## Estensione: collegamenti simbolici demo (12 novembre 2026)

**Differenza HTML:** `WorldView.draw` sovrapponeva linee tratteggiate rettilinee fra forte/edificio e villaggio collegato anche durante l'anteprima delle tessere originali. Sono indicatori inventati della demo, non risorse grafiche 7KAA; non rappresentano le strade originali.

**Modifica:** estratto `WorldView.drawDemoLinks`. In modalità anteprima terreno originale, i collegamenti simbolici non vengono dipinti. Nella demo procedurale rimangono disponibili per indicare i collegamenti. Nessun cambiamento alle regole `linked`, ai salvataggi, alla minimappa o alla pipeline Asset #13.

**Commit:** `133a704a` (renderer), `2490dfbd` (3 test Node in `tests/integration/terrain-demo-links.test.js`). **Stato: DA VERIFICARE** in CI e Chromium 1×/2×; nessuna certificazione pixel-perfect. Prossima dipendenza: ottenere transizioni coste e vere strade dal catalogo Asset verificato, quindi confrontare screenshot originali e HTML.

## Estensione: fallback completo durante caricamento atlante (12 novembre 2026)

**ID:** SKH-106-TERRAIN-ATLAS-READINESS-04. **Fonte HTML:** `playtest/original-terrain.js:OriginalTerrainPreview.drawTile` e `view.js:WorldView.drawDemoLinks`; **fonte originale:** atlante `I_TERN1.RES` (nessun nuovo asset importato). **Differenza oggettiva:** la presenza dell'oggetto `OriginalTerrainPreview` disattivava i collegamenti simbolici anche quando la bitmap originale era incompleta o aveva dimensioni errate: la demo perdeva simultaneamente terreno autentico e indicazioni visive dei collegamenti. **Implementazione:** `OriginalTerrainPreview.isReady()` verifica decodifica e dimensioni dell'atlante già documentate; `drawTile` usa lo stesso controllo; `drawDemoLinks` conserva i collegamenti solo finché l'atlante non è pronto. Il contenuto originale pronto resta libero dalle linee inventate. Nessuna modifica a Asset #13, salvataggi o comandi mobile.

**Commit:** `3e58bb7`, `a0ea3b6`, `b259e8f`, `d7a3706`. **Test aggiunti:** readiness e due casi di fallback, oltre ai test precedenti. **Stato: DA VERIFICARE** — commit pubblicati, esecuzione Node/Chromium 1×/2× e CI da controllare; nessun confronto pixel con il gioco originale certificato. **Prossima dipendenza:** verificare screenshot originali delle coste e atlante completo prima di implementare transizioni autentiche.
