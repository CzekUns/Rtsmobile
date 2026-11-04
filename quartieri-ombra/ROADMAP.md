# Roadmap operativa — aggiornare ad ogni worker

Stato: IN SVILUPPO. Priorità: gameplay funzionante > art > polish > espansioni.

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
