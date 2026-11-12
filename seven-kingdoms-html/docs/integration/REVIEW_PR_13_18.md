# Revisione congiunta delle sei PR — 4 novembre 2026

**Riferimento:** [PARALLEL_WORK.md](../../PARALLEL_WORK.md), [PIANO_DI_SVILUPPO.md](../../PIANO_DI_SVILUPPO.md), [WORKSTREAMS.json](../../WORKSTREAMS.json).

**Stato verificato al controllo:** sei PR aperte verso `main`, nessuna fusa, tutte con ultimo workflow **Seven Kingdoms HTML - JS tests and stream scope** verde. Il superamento CI certifica test statici e di regressione inclusi nelle PR: NON certifica la fedeltà all'eseguibile Seven Kingdoms, la qualità visiva degli sprite o il corretto funzionamento integrato nel browser Android.

| Stream | PR | Draft | Ultima CI osservata | Consegna effettiva | Gate per merge e/o integrazione |
|---|---|---:|---|---|---|
| SKH-101 Asset | [#13](https://github.com/CzekUns/Rtsmobile/pull/13) | Sì | [Verde](https://github.com/CzekUns/Rtsmobile/actions/runs/41734197062) | Parser RES/DBF, metadati SPRITE, manifest, test sintetici | **G1 BLOCCATO**: PNG/atlas da dati autentici, palette, 8 orientamenti, town e confronto visuale non consegnati. Non collegare al renderer. |
| SKH-102 Towns | [#15](https://github.com/CzekUns/Rtsmobile/pull/15) | Sì | [Verde](https://github.com/CzekUns/Rtsmobile/actions/runs/41734466638) | Modello multi-etnico e funzioni pure parzialmente portate da C++ con test | **G4 NON COMPLETO**: migrazione dal modello `pop/loyalty/resistance` scalare, recruiting/spie/campi/ribellioni e confronto con build C++ ancora necessari. |
| SKH-103 UI | [#16](https://github.com/CzekUns/Rtsmobile/pull/16) | Sì | [Verde](https://github.com/CzekUns/Rtsmobile/actions/runs/41734481008) | Componente HUD Canvas isolato, modello comandi e diagramma geometrico | **G2 NON COMPLETO**: proporzioni soltanto stimate, assenti screenshot originali comparati e test Android. Non installare indiscriminatamente un overlay che copra mappa e touch. |
| SKH-104 Core | [#14](https://github.com/CzekUns/Rtsmobile/pull/14) | No | [Verde](https://github.com/CzekUns/Rtsmobile/actions/runs/41734424082) | Clock a tick, PRNG seed, queue eventi, allocator ID, salvataggi v2 con unit test | **Revisione funzionale possibile** come modulo isolato. Prima di wiring: adattatore versione demo, mapping vecchi t/f/u IDs, tick/die e RNG C++ da confrontare. |
| SKH-105 Movimento | [#17](https://github.com/CzekUns/Rtsmobile/pull/17) | No | [Verde](https://github.com/CzekUns/Rtsmobile/actions/runs/41734566629) | Griglia collisioni, A* deterministico e occupazione per tile con test | **Revisione funzionale possibile** come modulo isolato. Prima di wiring: conversione posizione float → tile, policy unità di area e passabilità, limiti pathfinding originale. |
| SKH-106 Integration | [#18](https://github.com/CzekUns/Rtsmobile/pull/18) | Sì | [Verde](https://github.com/CzekUns/Rtsmobile/actions/runs/41734616771) | Contratti di adattamento, smoke test e audit iniziale | **PREPARAZIONE**: non ha cablato i cinque moduli, non attesta esperienza in-game integrata e non è pronta per release. |

## Risultato della review

- **Consegna documentale/codice:** sei agenti hanno prodotto codice, test e/o contratti nei loro scope. Gli ultimi test CI passano.
- **Consegna prodotto:** **non completata**. Nessuna PR è stata mergiata su `main`. `https://czekuns.github.io/Rtsmobile/seven-kingdoms-html/` usa ancora la prima demo, non il lavoro dei sei agenti.
- **Differenza fondamentale:** i moduli Core e Movement sono indipendenti e candidati a review e merge *come librerie*, non ancora sostituti verificati del motore originale.
- **Gate di fedeltà 7KAA:** nessun G1–G4 può essere marcato completato a seguito delle PR attuali. Per assets, UI e villaggi la segnalazione **draft** è appropriata, non un fallimento.

## Ordine operativo suggerito, senza merge automatici

1. Review puntuale di #14 Core (clock, RNG, ID persistence, salvataggi) e #17 Movement (A*, collisioni). Se vengono approvati, unire un PR alla volta e ricontrollare CI. Non modificano file centrali, quindi sono integrabili come librerie.
2. Sul branch di integrazione preparare **adattatore e migrazione non distruttiva** del salvataggio `seven-kingdoms-html-native-v1` al core; non sovrascrivere gli storage key precedenti senza conversione/backup verificata.
3. Collegare pathfinding al movimento solo con occupancy completa di terreno, edifici, unità e policy di destinazione; nessuna unità può sovrapporsi o attraversare un edificio.
4. Per #15: concordare ViewModel multi-etnico e mapping con `SevenGame`; testare scenari C++ di tassa, ricompensa, reclutamento e fedeltà prima di sostituire la logica demo. Si può unire il codice puro quando verificato senza dichiarare G4.
5. Per #13: servono **veri asset originali convertiti e controllati**, con verifica licenze separate; il parser sperimentale non va collegato come se fosse un renderer finito.
6. Per #16: misurare una schermata originale 800×600, screenshot side-by-side, regole di input Android e prevenzione dell'overlay intercettante; poi collegare il nuovo HUD senza duplicare la barra.
7. Concludere con test delle PR integrative in browser desktop, Android orizzontale, fullscreen, save/load, 30 min soak e confronto visivo. Aggiornare `PIANO_DI_SVILUPPO.md` solo sulla base di prove.

## Decisioni richieste al maintainer

- Confermare l'integrazione progressiva e l'ordine dei merge; non è stato eseguito **alcun merge** con questa review.
- La branch protection `main` con required check deve essere attivata dal proprietario della repository se non ancora presente.
- Per sbloccare G1 ottenere accesso lecito agli asset grafici e una build/reference 7KAA precisa; per G2 screenshot originali e controllo visivo.

**Nota di affidabilità:** questa review si basa su PR, descrizioni, contratti e CI attuali. Non afferma test manuali su dispositivo o confronto pixel delle immagini, non ancora eseguiti.
