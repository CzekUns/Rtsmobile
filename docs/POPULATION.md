# T05 — Popolazione, alloggi e consumi (BUILD 36)

Parametri provvisori del prototipo in `population.js`, `TERRA_POPULATION`:
- Casa comune: 5 posti; ogni Distretto vivo e completato: altri 5.
- Una razione di cibo/pane per persona viva ogni 30 giorni di gioco.
- Accoglienza: almeno 2 residenti nel Distretto, un posto locale e globale libero,
  150 giorni favorevoli consecutivi e 18 razioni, più la riserva per la prossima
  razione di tutte le persone compreso il nuovo arrivato.

La nuova persona nasce come record unico già residente: non viene duplicata o
fatta comparire sulla mappa dentro un edificio. La mancanza di un requisito azzera
il progresso. La distruzione degli alloggi riduce la capienza ma non cancella le
persone. Il pannello Comunità mostra posti, sovraffollamento, consumo e requisiti.

Il cibo si preleva soltanto dall'inventario della Casa comune, prima pane e poi
cibo, escludendo le prenotazioni dei trasporti. Farina/grano, scorte di altri edifici
e carichi in viaggio non sono razioni spendibili. La razione incompleta consuma
solo ciò che è disponibile e segnala la carenza; per questo bilanciamento provvisorio
la carenza blocca l'accoglienza, senza morte automatica né debito alimentare.
Non è una simulazione demografica biologica: si tratta di accoglienza condizionata.

Il calendario persistente determina le scadenze; ricaricare non consuma di nuovo
una razione. Nessun avanzamento offline. Il campo additivo `populationRules: 1`
nel formato v5 identifica la nuova progressione. I vecchi timer dei Distretti vengono
azzerati in memoria al caricamento di uno snapshot senza il campo, senza modificare
il salvataggio originale durante la lettura; identità e merci restano invariate.

Verifica: nove casi `node tests/population.cjs`, più tutte le suite precedenti,
in Node VM/DOM simulato. Browser reale e dispositivo restano da collaudare.
