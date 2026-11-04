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
