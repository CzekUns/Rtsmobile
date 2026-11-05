# Soglia minima visiva e funzionale — richiesta utente 2026-11-04

## Cambiamento di priorità e accettazione plancia (2026-11-04)

Da ora la soglia immediata è **PLANCIA ALPHA** come da [BOARD_MASTER.md](BOARD_MASTER.md), non la finitura del gameplay. L'ultima immagine ImageGen approvata («esattamente quello che volevo») prevale come GOLDEN REFERENCE per la mappa; estendere il quartiere almeno 2×2, preferenza 3×3 settori. Non migliorare AI/pathfinding/NPC fino ad approvazione esplicita della plancia. Test di gameplay restano requisiti della DoD finale e saranno eseguiti più avanti. La plancia potrà essere valutata separatamente tramite preview con camera e HUD senza NPC.


Stato: **NON RAGGIUNTA**. Questo documento definisce un livello `ALPHA VISIVAMENTE ACCETTABILE`, NON equivale alla Definition of Done finale: l'automazione continua fino alla DoD completa.

## Priorità P0: una città credibile, non un prototipo Canvas

**Consegna obbligatoria per ogni worker:** preferire modifiche visibili e provabili del rendering, della cartografia o degli asset; accompagnarle con test di regressione. Le sole nuove suite di test, senza nessuna modifica visiva, NON avanzano la soglia estetica, salvo correzione di un blocco reale.

### Checklist “alpha visivamente accettabile”
- [ ] L'intero campo di gioco e ogni edificio/unità sono rappresentati da una coerente proiezione ortografica isometrica 2:1; architettura e asset si allineano con collisioni, selezione, profondità e strade.
- [ ] Abbandonata la disposizione artificiale regolare: incrocio irregolare a cinque punte, tracciati e isolati reinterpretati da **Perris 1853** con motivazione e provenienza per ogni strada. **OSM moderno** è solo layer di posizione comparativa e va attribuito; non sostituisce topografia storica.
- [ ] La mappa include 15 edifici funzionali ma appare costruita in epoche/lotti reali: facciate su fronti strada, profondità e altezze differenti, pochi vicoli, cortili e retro-case; differenze evidenti fra strada commerciale e vicolo popolare.
- [ ] Il rendering include almeno **4 silhouette architettoniche originali distinte** (es. alloggio, caseggiato, bottega/taverna, magazzino/officina) e più varianti cromatiche; **niente** immagine unica come finto sfondo.
- [ ] Dettagli low-res chiaramente visibili: finestre, porte, tende/insegne originali, camini dove plausibili, tegole, mattoni usurati, fango/lastricato, lampade e 2–3 tipi di props separati. Tutti allineati al terreno in isometria.
- [ ] Unità molto più piccole delle case, distinguibili gendarmi/mercenari e controllo clan leggibile; UI scura classica con minimappa e barra azioni come gold reference in-game 1998–2003.
- [ ] Mappa orizzontale a schermo pieno: HUD ancorato immobile, nessuno scroll della UI toccando o trascinando, pan e pinch solo sull'area mappa, avviso di rotazione in portrait.
- [ ] Acquisite due **schermate della build reale** (desktop + Android landscape o test browser emulato dichiarato come tale). Confronto esplicito con golden reference; annotate differenze e correzioni.
- [ ] Verificata giocabilità essenziale dopo il rinnovamento visivo: selezione, cammino senza teletrasporto, 15 accessi agli edifici, esazione, mercenari, conquista, fine partita; nessuna regressione nella suite disponibile.
- [ ] Elenco puntuale origine/licenza degli asset realmente distribuiti e niente riproduzione di screenshot film, immagini da Google o foto senza diritti.

## Piano delle prossime esecuzioni (ordine)
1. **Geometria concreta** — leggere il riferimento Perris ad alta risoluzione; annotare strade rilevanti per Five Points e disegnare un layout comparato con OSM moderno. Evitare geometrie inventate descritte come fedeli.
2. **Sostituire il fondale procedurale generico** — pavimentazione irregolare, fasce stradali e dettagli che seguono il grafo urbano; integrare almeno parte degli asset terreno/props esistenti.
3. **Edifici differenziati** — rinforzare le facciate già codificate con silhouette e tetti originali differenziati e ingressi sul fronte strada; preservare 15 edifici e accessibilità A*.
4. **Composizione/scala/camera** — quartiere denso a riempire la viewport landscape, diminuzione spazi vuoti, unità piccole ma visibili, HUD leggibile e fisso.
5. **Test visuali reali** — screenshot e verifica Android landscape/desktop, confronto golden reference e ripetizione dei fix. Prima di dichiarare alpha accettabile occorre prova, non una previsione.

## Regola antireport
Ogni esecuzione, anche quando si sviluppano test, deve indicare la **modifica visiva percepibile** con link/commit ed esito delle prove. Se non c'è stata implementazione grafica, scrivere apertamente che la soglia grafica non è avanzata e spiegare il blocco.

## Ambito e licenze
La produzione resta in `quartieri-ombra/` su `CzekUns/Rtsmobile` senza toccare altre pubblicazioni. Mantenere gli asset esistenti. I materiali dei Five Points 1853/1859 sono riferimenti storici; film e screenshot dell'utente rimangono reference di atmosfera, NON materiale da ritagliare/copiarne pixel. Le riproduzioni storico-documentarie richiedono verifica della licenza nei paesi di distribuzione.

## Distinzione fra livello accettabile e gioco finito
**ALPHA VISIVAMENTE ACCETTABILE** soltanto quando tutte le caselle sopra sono spuntate con evidenza; **COMPLETATO** soltanto dopo tutti i criteri della ROADMAP/Definition of Done, comprese due regressioni complete desktop/mobile, gameplay integro e salvataggio.
