# Atlante visuale e cartografico — Five Points 1853–1860

**Stato:** ricerca iniziale documentata; NON è una ricostruzione storicamente verificata e non costituisce approvazione del renderer. Aggiornamento 2026-11-04.

## Gerarchia delle fonti
1. **Pianta di William Perris (1853), volume 3, tavola 25:** riferimento prioritario per allineamento dei fronti strada e dimensioni relative degli isolati. Versione: https://commons.wikimedia.org/wiki/File:Perris_Manhattan_V._3_Plate_25_publ._1853.jpg . Scheda NYPL Digital Collections indicata come ID 1270020. Fonte cartografica storica, NON fondo statico da inserire nel gioco.
2. **Piante di confronto:** cartografia del Sesto Ward del 1831: https://commons.wikimedia.org/wiki/File:1831-map-new-york-five-points.jpg . Serve a verificare cambi di nomi/allineamenti nel tempo, NON a miscelare epoche senza controllo.
3. **Iconografia d'epoca locale:** Library of Congress, *The Five Points in 1859, view taken from Worth & Little Water St.* (litografia pubblicata intorno al 1860, non fotografia): https://www.loc.gov/item/2006677419/ . Estrarre dettagli visuali *come descrizione* e disegnare asset originali.
4. **Ricerca topografia e contesto:** NYC Landmarks Preservation Commission, studio archeologico Phase 1A (2018), https://s-media.nyc.gov/agencies/lpc/arch_reports/1817.pdf . Documenta il sito e i lotti di Five Points, anche se non una pianta diretta per il renderer.
5. **OSM moderno:** https://www.openstreetmap.org/#map=17/40.7148/-73.9983 . Serve solo a riconoscere ubicazione attuale, riferimenti Centre/Bowery/Canal/Park Row e trasformazioni moderne. **Non usare la rete OSM moderna come strade dell'anno 1853**; se si usano dati OSM, mantenere attribuzione OpenStreetMap contributors e rispettare ODbL.
6. **Film, atmosfera e staging:** scheda e clip ufficiali di *Gangs of New York* https://www.miramax.com/movie/gangs-of-new-york/ e trailer Miramax https://www.youtube.com/watch?v=1bjh979vVG0 . Solo analisi atmosfera, densità, silhouette, fotografia, NON copia di frame, set, personaggi o geometria scenografica.

## I tre screenshot utente: note di osservazione
Tre schermate inviate nella conversazione ChatGPT il 2026-11-04, provenienti da una ricerca di Google Immagini «new york 1860». **Non sono asset e non sono stati caricati nel repository.** Le schede Google non dimostrano data, posizione o licenza delle immagini sottostanti.

- **Schermata risultati 1:** quartieri fitti, trasporti a cavallo, file di facciate alte 3–5 piani, differenziazione di tetti e cornicioni. La copertina di un libro, i risultati con video etichettati AI e gli inserti moderni non sono testimonianze fotografiche.
- **Schermata risultati 2:** forti linee prospettiche, tram/carrozze, commercio di strada e tende sulla pavimentazione. Sono esempi generici di Manhattan, NON prove che Five Points fosse largo/ordinato come Broadway. Numerose immagini panoramiche o di Broadway NON rappresentano automaticamente Five Points.
- **Schermata singola History101.NYC:** ispirazione per archetipi originali: botteghe al piano strada, marcapiani, finestre alte e ripetute, numeri di piani diversi, serrande e pubblicità dipinte. Il watermark, l'origine precisa e la datazione non sono verificati. **Non ritagliare né replicare l'immagine**.

## Vocabolario architettonico traducibile in asset originali
- **Alloggi popolari:** lotti stretti, 2–5 piani variabili, mattoni di 2–4 tonalità scure, intonaco rotto, cornicioni consumati, porte strette, finestre ripetute ma non perfettamente uniformi, scale/accessi secondari.
- **Botteghe e taverne:** piano terra più aperto, insegna originale in legno, tende sporche con piccoli strappi, vetrine piccole, cavalletti e barili; NON insegne riprodotte da foto/film.
- **Magazzini/produttivi:** muratura robusta, grandi portoni, imposte, pulegge, piccole ciminiere solo dove plausibili; non trasformare ogni edificio in enorme fabbrica.
- **Densità:** edifici quasi aderenti ai fronti strada, profondità variabile, corti inaccessibili, passaggi e rear tenements. Nessuna distanza uniforme tipo 5×3; alternare basamenti e altezze.
- **Strade:** sezione non omogenea, fanghiglia, rotte di carri, pietra consumata, acqua stagnante, pendenze e scorci storti; carreggiate commerciali più ampie solo dove storicamente plausibili.
- **Presenze urbane:** carrozze e cavalli piccoli, bottegai, passanti, casse, ceste, barili, fanali, fumo. Questi sono **decorazione**, non nuove meccaniche di gioco.
- **Rendering:** autentica isometria 2:1 coerente con piedi/footprint; raster low-res/nearest-neighbor, 2D prerender/pixel, unità molto più piccole degli edifici; luci ambrate discrete e palette carbone/marrone/ocra.

## Separazione fra certezza, interpretazione e costruzione ludica
| Elemento | Evidenza | Uso consentito |
| --- | --- | --- |
| Cinque angoli irregolari dell'incrocio storico | Studio archeologico NYC / Perris | Struttura urbanistica di riferimento |
| Tracciati di Cross/Orange/Anthony/Little Water e area Mulberry Bend | Mappe d'epoca da confrontare | Ridisegno **verificato**, non numeri inventati come coordinate reali |
| File di negozi e carrozze nelle foto fornite | Screenshot generici con data/luogo non confermati | Ispirazione tipologica |
| Scala e stile alla Age of Empires/Seven Kingdoms 1998–2003 | Golden reference approvata dall'utente | Requisito estetico |
| Posizioni attuali dei 15 edifici in game.js | Prima interpretazione gameplay | Placeholder artistico, non ricostruzione |
| Fonti cinematografiche | Film protetto da copyright | Solo descrizione del mood, non sprite/screenshots |

## Processo vincolante per la prossima ricostruzione
1. Creare una *traccia cartografica lavorabile* con metadati: per ogni strada indicare punti, fonte, data, qualità, certezza e semplificazioni RTS. Mantenere coordinate locali separatamente da gameplay.
2. Iniziare dall'incrocio di Five Points e dagli orientamenti stradali storici, aggiungere lotti dai fronti corretti e accessi pedonali ai palazzi. Curare soprattutto il rapporto fra strada e facciata.
3. Ogni edificio del gameplay deve avere almeno una porta sul passaggio percorribile. Distinguere footprint collisione, area artistica (spiovenze, tende, tetti), punto d'ancoraggio selezione e origine sprite.
4. Creare varianti ORIGINALI per residenziale, bottega e produttivo, tutte con le stesse proporzioni isometriche. Nel primo passaggio almeno 2 modelli architettonici e dettaglio fronti/sfondi; verificare la visuale.
5. Eseguire prove su PC e Android landscape in fullscreen: screenshot reali della mappa piena; confrontare con golden reference originale (attualmente NON in repo) e con sorgenti storiche.
6. Valutare storiografia e diritti **per ciascun file** prima dell'eventuale conservazione delle immagini storiche in repo. Le immagini di risultati Google e frame Miramax NON devono essere impacchettati nel gioco.

**Licenze:** immagini/cartografia storiche qui solo linkate. La scheda Commons di Perris segnala pubblico dominio USA, ma non garantisce automaticamente lo stesso regime in ogni paese; valutare caso per caso. Codice e grafica nuovi prodotti internamente sono originali, non derivati per copia pixel-per-pixel.
