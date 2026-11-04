# Specifica — Quartieri d'Ombra (titolo provvisorio)

## Visione
RTS semplice di influenza e conquista territoriale in un quartiere industriale americano ottocentesco immaginario. Toni cupi, sporchi, scenografia urbana claustrofobica. Le reference cinematografiche guidano il mood, NON si riproducono ambientazioni protette, personaggi, marchi o fotogrammi.

## Direzione artistica VINCOLANTE
Schermata IN-GAME, non key art illustrativa. RTS classico 1998–2003: grafica 2D isometrica circa 2:1, edifici prerenderizzati a bassa/media risoluzione con silhouette riconoscibili, sprite pixel-based o prerender con rendering low-res, terreno fangoso, mattoni scuri, illuminazione ambra, nebbia/fumo discreti, HUD scuro in metallo e pergamena consumata con minimappa e pannello selezione inferiori. Evitare UI moderna lucida, sfocature decorative, miniature 3D fotorealistiche e truppe sproporzionate. Colori clan leggibili ma non saturi; evidenziare confini senza colorare intere costruzioni.

## Partita
- Due clan, giocatore e IA, più edifici neutrali. Una mappa iniziale singola con circa 15 edifici.
- Il giocatore parte con 1 residenziale e 1 gendarme. IA: facile 1 edificio, normale 2, difficile 4. Le differenze di difficoltà sono soprattutto di setup, non trucchi economici.
- Edifici fissi sul terreno: `residenziale` o `produttivo`, tutti conquistabili senza costruzione iniziale.
- A partire da un centro del clan, si conquistano edifici per influenza o assalto.
- Vittoria: conquista tutti gli edifici. Sconfitta: perdita di edifici e possibilità realistica di ripresa (es. nessun gendarme, nessuna casa e oro insufficiente), con schermata chiara. Bilanciamento da testare.

## Fedeltà
- Ogni edificio ha fedeltà firmata fra -100 e +100; valori positivi favoriscono il giocatore e negativi l'IA. `+35` controllo giocatore; `-35` controllo IA; zona fra le soglie neutrale.
- Gendarme fermo fisicamente all'esterno irradia influenza su edifici vicini; livello più alto = influenza maggiore; distanza riduce efficacia. La pressione contrapposta agisce nel tempo.
- L'influenza aumenta fedeltà agli edifici del proprio clan e riduce quella degli avversari; gli angoli del territorio richiedono presidio; l'IA adotta identica logica.
- Assenza di presidio: tendenza lenta alla stabilizzazione/neutralità; non perdere edifici all'istante.

## Unità
- Gendarme gratuito: recluta casuale che appare solo dalle case residenziali controllate, frequenza condizionata da fedeltà e reputazione/consenso del clan. NON acquistabile direttamente. Presidia, influenza, riscuote imposte, può aggredire; cresce di esperienza e livello.
- Mercenario a pagamento: acquistato con oro da un edificio posseduto; combatte meglio e può condurre assalti, ma non irradia influenza politica. Nessuna economia parallela nell'MVP.
- Entrambe camminano realmente con collisioni e pathfinding intorno agli edifici, non si teletrasportano. Selezione, movimento, presidio, esazione, assalto, combattimento, HP e morte.
- Input mouse + touch, camera trascinabile, zoom, selezione evidente.

## Economia
- Una sola risorsa base: oro. Edifici produttivi controllati generano oro in deposito locale.
- Serve un gendarme assegnato come esattore vicino all'edificio per trasferire oro al tesoro; possibile costo locale di consenso. Esazione è un ruolo del gendarme, non un'unità terza.
- Oro speso per mercenari. In futuro possibili altre risorse solo tramite espansioni isolate.

## IA
- Esattamente stesse regole di influsso, fedeltà, reclute e denaro del giocatore.
- Comportamenti: difendere case instabili, presidiare confini, influenzare neutrali, esigere oro, assoldare mercenari, assaltare difese deboli.
- Non usare teletrasporto, spawn gratuiti segreti né modifiche di fedeltà arbitrarie non disponibili al giocatore.

## Viewport, orientamento e input (vincolanti, 2026-11-04)
- Il gameplay mobile è SOLO ORIZZONTALE. In portrait su smartphone compare un overlay che richiede la rotazione; nessuna interazione con la partita e simulazione sospesa. I browser potrebbero non concedere il blocco hardware dell'orientamento: prevedere fallback visibile.
- Pulsante sempre disponibile nell'HUD per attivare/disattivare fullscreen sul gesto dell'utente via Fullscreen API; richiesta facoltativa a `screen.orientation.lock("landscape")` soltanto se supportata e consentita.
- Schermata occupata per intero da header compatto + campo di gioco ridimensionabile + HUD basso fisso. **Nessun pan/scroll/overscroll dell'intera pagina** attraverso touch; pinch/pan solo sulla MAPPA e senza trascinare HUD o pulsanti.
- Il Canvas deve ridimensionare anche il backing store secondo i pixel effettivi della viewport; applicare scala uniforme, mai distorcere proporzioni sprite/isometria. La camera e il mapping touch devono seguire lo stesso fattore del rendering.
- In landscape tutti i pulsanti comandi e le informazioni fondamentali devono restare accessibili, anche con display bassi/allungati (16:9, 19.5:9, 21:9); evitare che le barre sottraggano quasi tutto lo spazio al campo di gioco.
- Test d'accettazione su smartphone reale e desktop responsive: nessuno spostamento della UI quando si trascina con un dito, minimappa fissa, pinch camera, fullscreen on/off, portrait gate, rotazione senza teletrasporto o distorsioni.

## Tecnica
- HTML5 + JavaScript senza server, deploy GitHub Pages in sottocartella.
- Nessuna modifica a file esterni al progetto. Preferire moduli locali e asset leggeri.
- Modalità offline solo dopo disponibilità stabile, salvataggio locale/versionato, nessun tracciamento necessario.
- Fonte grafica: asset 2D ORIGINALI separati per edificio/unità/terreno/interfaccia per riuso. Mockup della chat come riferimento compositivo, non sprite atlas finale.

## Espansioni: DOPO base completa
Nuovi edifici, reputazione/paura, boss dei clan, mercenari specializzati, eventi quartiere, missioni, economia aggiuntiva e campagne. Non introdurle prima che il gioco principale sia verificato.
