# Roadmap operativa — aggiornare ad ogni worker

Stato: IN SVILUPPO. Priorità: gameplay funzionante > art > polish > espansioni.

## PRIORITÀ IMMEDIATE — interfaccia mobile landscape e isometria integrale (richiesta utente 2026-11-04)

La grafica del gioco deve essere isometrica al 100% e coerente con il riferimento in-game RTS PC 1998–2003. Prima delle espansioni e del polish completare i seguenti task:

- [x] Impostazione smartphone in landscape-only con schermata di rotazione se portrait; simulazione sospesa in portrait per view mobile.
- [x] Pulsante fullscreen nell'HUD che usa Fullscreen API su gesto utente; tentativo di orientation.lock quando supportato, fallback rispettoso dei limiti browser.
- [x] Shell a dimensioni viewport con scroll di pagina bloccato e input touch riservato al Canvas; HUD non deve trascinarsi con pan/pinch.
- [x] Canvas con backing store in proporzione al contenitore e camera che usa scale cover uniforme senza stretch; vista minimappa derivata dalla dimensione effettivamente visibile.
- [ ] Test browser reale Android landscape: nessun movimento/scroll di barra, minimappa o HUD al trascinamento; pinch solo sulla mappa, bottoni operativi e fullscreen.
- [ ] Test desktop responsive su 16:9, 21:9 e viewport a bassa altezza: campo di gioco deve occupare tutto lo spazio restante, comandi mai tagliati, HUD leggibile, assenza overflow.
- [ ] Renderer isometrico 2D INTEGRALE: griglia, terreno/strade, posizionamento e collisioni edifici, profondità/sorting, unità e interazioni in stessa proiezione; non basta la texture pseudo-isometrica.
- [ ] Utilizzare sprite/props asset library con pivot e footprint appropriati, minimappa/indicatori selezione coerenti.
- [ ] Confronto screenshot desktop e landscape mobile con la golden reference approvata e correzione discrepanze.

Criterio di accettazione: durante una partita in smartphone orizzontale l'utente non può scorrere o spostare con il dito l'INTERA pagina/UI; soltanto la camera della mappa sotto l'HUD fisso. Fullscreen funziona quando consentito, senza promesse di blocco hardware negli altri browser.

## Fase 0 — Fondazioni
- [x] Percorso isolato in repository esistente; niente modifiche ad altri progetti.
- [x] Specifica, confini e roadmap persistente.
- [ ] Prima build web avviabile e raggiungibile su Pages.
- [ ] Test avvio e smoke desktop/mobile.

## Fase 1 — Gameplay completo
- [ ] Mappa isometrica, 15 edifici e movimento di camera.
- [ ] Tre difficoltà, proprietà iniziali corrette e condizioni di fine partita.
- [ ] Selezione e movimento unità tramite percorsi reali.
- [ ] Influenza territoriale basata su livello/distanza/stazionamento.
- [ ] Fedeltà e conquista pacifica con aggiornamento UI.
- [ ] Residenze: reclutamento spontaneo correlato a consenso.
- [ ] Produzione oro, deposito locale, esattore gendarme.
- [ ] Mercenari pagati in oro, combattimento e conquista violenta.
- [ ] IA simmetrica con attività di conquista, presidio, difesa, esazione, acquisto.

## Fase 2 — Gameplay bilanciato
- [ ] Nessuna risorsa/bonus segreti per IA.
- [ ] Test automatici deterministici per fedeltà, reclute, economia, acquisti, IA, vittoria/sconfitta.
- [ ] Partita facile e difficile terminabili; tuning durata/ritmo.
- [ ] Salvataggio/caricamento e versione dello stato.
- [ ] UI touch: pannello selezione, movimento, azioni, zoom e drag senza conflitti. (Pan e pinch implementati; smoke touch ancora da verificare.)

## Fase 3 — Grafica approvata
- [ ] Asset originali, individuali e sostituibili: tile terra, strade, resid, prod, gendarme, mercenario.
- [ ] Isometria 2D 1998–2003 leggibile e coerente con screenshot concept; palette sporca, case di mattoni, fango, luci ambra.
- [ ] UI classica con HUD inferiore, minimappa, pannello unità/edificio, icone e leggenda.
- [ ] Evidenziazione selezione, fedeltà, influenza e stati di combattimento non invasiva.
- [ ] Performance utilizzabile su Android di fascia media e PC.

## Fase 4 — Rifinitura
- [ ] Sonoro originale o di licenza adeguata, controlli audio.
- [ ] Tutorial breve / comandi accessibili.
- [ ] Errori console risolti, nessuna eccezione grave, fallback asset.
- [ ] Accessibilità minima: pulsanti leggibili, dimensioni touch, contrasto.
- [ ] Documentazione avvio, salvataggi, comandi, licenze dei contenuti.

## Definition of Done
- [ ] Tutti i punti di Fasi 1–4 verificati, niente task P0/P1.
- [ ] 2 cicli consecutivi di regressione superati su desktop e mobile/touch.
- [ ] Pubblicazione Pages raggiungibile senza alterare gli altri giochi.
- [ ] Licenze/autorialità degli asset verificabili.
- [ ] Report finale con link Pages e commit, stato `COMPLETATO`.

Non marcare completate azioni non eseguite. L'worker orario resta attivo fino a tutti i criteri sopra, salvo ordine esplicito dell'utente.

## Verifica 2026-11-04 10:00
- Corretto bug esazione: il gendarme ora ritira oro esclusivamente dal produttivo assegnato, non da ogni produttivo nel raggio. IA conserva incarico solo se il produttivo assegnato è ancora idoneo.
- Corretto addebito IA mercenari: il costo viene sottratto soltanto dopo spawn riuscito.
- Verifiche automatiche statiche su sorgente GitHub: 4/4 controlli di regressione puntuali superati. Nessun test browser/touch eseguito; nessuna casella DoD aggiuntiva marcata.

## Verifica 2026-11-04 11:00
- Corretto comando esazione: consentito soltanto a gendarme verso produttivo posseduto; respinto assalto contro edificio alleato.
- Ordine verso edificio irraggiungibile ora segnala esplicitamente il fallimento anziché cambiare selezione silenziosamente.
- Messaggio reclutamento spontaneo mostrato solo se lo spawn è effettivamente riuscito (limite unità).
- Commit codice `da99eaf15e127250a991cfbdbc5b61d77648754c`. Verifica parser JS V8 e 5 controlli sorgente mirati superati; browser e simulazioni dinamiche non eseguiti. Nessuna casella DoD completata.

## Verifica 2026-11-04 12:00
- Pathfinding: rifiuto esplicito di destinazioni con centro della cella occupato, anche quando il punto cliccato cade appena fuori dal perimetro; evita percorsi che terminano dentro gli edifici.
- Eseguiti 5 test dinamici del `route()` reale estratto dal sorgente in V8: percorso libero, punto dentro ostacolo, centro cella ostruito, deviazione attorno a ostacolo, destinazione coincidente (5/5 PASS). Parsing integrale `game.js` superato.
- Commit codice `9b658db08c3a51766454957b4c0a7084d200ea8b`. Non effettuato smoke browser né confronto grafico desktop/mobile: DoD invariata.

## Verifica 2026-11-04 13:00
- Corretto stato terminale: quando il giocatore non possiede edifici né unità, la sconfitta scatta anche con oro residuo, poiché non esiste un edificio da cui assoldare mercenari. Conservata possibilità di recupero con almeno un'unità o edificio.
- Aggiunto `tests/defeat.test.cjs` con 5 casi di regressione eseguibili tramite Node.js; verifica di sintassi del sorgente e 5 casi logici eseguiti in V8 del connettore (PASS). Non eseguito Node locale né browser/touch: nessun criterio DoD marcato.
- Commit codice `27be1bcb7acf8fb4f79610daeccc8ae3d9a1e8d9`; test `3e179cf59da90069c1eea4081014560a7b487793`.

## Verifica 2026-11-04 14:00
- Aggiunta suite persistente `tests/pathfinding.test.cjs` che estrae ed esegue `route()` reale da `game.js` in VM isolata: 7 scenari (corridoio, ostacoli, centro cella, aggiramento, destinazione identica, limiti mappa, secondo ostacolo).
- Commit test `b54525c6cb8ff262effbd3199da82259363055e3`. Quattro scenari dinamici della funzione effettiva eseguiti nel runtime V8 e superati. Esecuzione Node della suite persistente non verificata: container senza accesso DNS a raw.githubusercontent.com. Nessuna casella DoD marcata; mancano browser desktop/touch e screenshot.

## Verifica 2026-11-04 15:00 — prima passata terreno isometrico
- Implementato in `game.js` `drawIsometricGround()`: disegno a diamanti 2:1 di tile fangosi e lastricato, variazione cromatica deterministica e segni di usura; eliminato il precedente fondale a strade ortogonali rettangolari.
- Aggiunto `tests/isometric-ground.test.cjs`: controlla rapporto 2:1, densità dei tile e determinismo. Esecuzione V8 diretta della funzione reale: 462 riempimenti, 459 contorni, vettore primo spigolo (+48,+24), PASS. Sintassi `game.js` PASS.
- **Parziale, non completato:** edifici, collisioni, unità, selezione e minimappa mantengono coordinate cartesiane: non è ancora isometria 100%. Occorre introdurre una proiezione unificata con inversa per hit-test, pathfinding e camera, e profondità sprite; non marcare Fase 1/3 completata.
- Non effettuati browser smoke, Android fullscreen/landscape, confronto screenshot reference. Nessun altro file fuori `quartieri-ombra/` toccato.


## Priorità cartografica storica — Five Points, circa 1853
- [ ] Ricostruire il tracciato stradale reale da William Perris, *Maps of the City of New-York*, vol. 3, tavola 25 (1853), integrando la cartografia 1831 e viste d'epoca. OSM moderno soltanto come orientamento, non come sorgente della topografia ottocentesca.
- [ ] Sostituire i 15 edifici in scacchiera con lotti irregolari lungo fronti strada, corti e vicoli, senza perdere giocabilità, collisioni e raggiungibilità.
- [ ] Introdurre dati geometrici separati (polilinee stradali, lotti, footprint, punti di accesso) e documentare scala/semplificazioni rispetto alla mappa storica.
- [ ] Confrontare il risultato con la fonte storica e verificare condizioni di licenza per ciascuna immagine di riferimento; NON importare scansioni come sprite di gioco.

Fonte primaria: https://commons.wikimedia.org/wiki/File:Perris_Manhattan_V._3_Plate_25_publ._1853.jpg (William Perris, 1853, dominio pubblico USA); fonte iconografica: https://www.loc.gov/item/2006677419/ (incisione della zona, 1859).
Nota: la proiezione isometrica non deve essere confusa con la regolarità urbanistica. Il renderer può avere una griglia tecnica invisibile, ma la città non deve essere una scacchiera.

## Verifica 2026-11-04 16:00
- Proiezione ortografica 2:1 unica per terreno, footprint edifici, sprite unità, selezione e profondità. Mappatura inversa touch e zoom nello stesso sistema; pathfinding e influenza restano in coordinate logiche invarianti.
- Commit codice `75326e8`; test di proiezione `1aabeba`. Parsing JS verificato prima del commit. Test Node persistente creato, non eseguito in browser reale. Layout e collocazione storica ancora da rifinire.
- La casella renderer INTEGRALE rimane aperta finché collaudo mobile, asset e screenshot golden reference non sono verificati.

## Verifica 2026-11-04 17:00 — primo layout Five Points irregolare
- Sostituiti i 15 edifici in griglia con 15 lotti a coordinate irregolari, con distanze di sicurezza fra collisioni. Creati cinque tracciati stradali spezzati proiettati isometricamente; eliminata la ripetizione di strade ortogonali ogni N tile. Commit `d06ca32973a169ae181f84bf890aff2ae028838a`.
- Test persistente `tests/irregular-map.test.cjs` (commit `6e0f5f67db81454eb8ad02332852026a98b6f33f`) per numero lotti, assenza sovrapposizioni, irregolarità e tracciati. Eseguiti controllo sintattico V8 e verifica geometrica diretta (PASS). Test Node/browser non ancora eseguiti.
- ATTENZIONE: interpretazione ludica PRELIMINARE, non ricostruzione cartografica verificata. Necessaria georeferenziazione della pianta Perris 1853 e confronto con mappe/immagini originali prima di dichiarare fedeltà storica. I nomi stradali sono riferimenti storici, non attribuzioni di coordinate esatte.
- Restano: percorso navigabile lungo le vie, allineamento dei fronti edificio, asset e test smartphone reali. Nessuna casella DoD completata.

## Verifica 2026-11-04 18:00 — corridoi stradali sgombri
- Corrette le interferenze fra strade ed edifici del primo layout irregolare: ricollocati 8 dei 15 lotti mantenendo cinque polilinee stradali, tutti i tipi e gli ID degli edifici, collisioni A* e logica di proprietà.
- Aggiunto test persistente `tests/road-clearance.test.cjs`: distanza geometrica campionata ogni 2 unità fra ciascun segmento stradale e tutti i 15 footprint, comprensiva di metà larghezza strada e margine collisioni 10 unità. Eseguito lo stesso controllo dinamico V8 sulla geometria letta dalla main: **255 combinazioni strada/lotto PASS, zero interferenze, minimo margine residuo 0,66 unità**; 105 coppie di edifici senza sovrapposizioni; parsing JS PASS.
- Commit codice `9c803021`, test `a0fc23ae`. Test Node persistente non eseguito nell'ambiente, né smoke browser desktop/Android o screenshot comparativo; nessuna casella DoD chiusa.
- **Nota storica:** layout ancora artistico, non rilievo catastale verificato. Prossimo passo: percorribilità reale, maggiore separazione fisica nei punti stretti, allineamento dei fronti strada e confronto con Perris 1853.


## Verifica 2026-11-04 19:00 — spawn navigabili su lotti irregolari
- Corretto `spawn()`: ora controlla confini mappa, collisione puntuale e centro cella A* per tutti e quattro gli accessi esterni, scegliendo soltanto un ingresso libero. Se nessun accesso è disponibile lo spawn fallisce senza aggiungere unità e senza consumare ID.
- Commit codice `0c87aed`; test permanente `tests/spawn-access.test.cjs` commit `57550f5`.
- Verifica V8 dinamica della funzione originale estratta da `game.js`: 15 edifici × 4 rotazioni di accesso = **60/60 spawn validi** con rotta locale percorribile; parsing JavaScript PASS. La suite Node persistente non è stata eseguita; mancano ancora browser desktop/Android, test completo di connettività stradale e confronto con mappa Perris.
- Nessun criterio Definition of Done aggiuntivo marcato: la geometria storica resta una reinterpretazione, e la scala/camera isometrica va verificata in browser reale.
