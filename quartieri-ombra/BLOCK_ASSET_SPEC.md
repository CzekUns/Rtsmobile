# Sistema modulare di isolati — contratto grafico e tecnico (2026-11-05)

## Decisione: non più figurine isolate

L’utente ha osservato che gli edifici raster singoli sembrano “appiccicati come figurine”, senza continuità urbana. La soluzione non è generare ancora case isolate casuali, ma **un sistema di isolati modulari** che tiene conto di fronte strada, azimut, profondità, vicini, muri comuni e raccordi con il suolo.

Stato: **prima integrazione in codice eseguita**, ancora da verificare visivamente su screenshot desktop/Android. Le immagini originali approvate restano il riferimento vincolante ([BOARD_MASTER.md](BOARD_MASTER.md)). Non toccare logiche NPC/IA/combattimento.

## Sistema esistente, implementato

- `board-world.js`: 454 lotti con poligoni isometrici, coordinate 2D, `roadId`, `door`, `z`; questi dati **non vanno perduti** sostituendo il rendering.
- `block-continuity.js`: calcola una scheda per ciascun lotto, angolo fronte strada, compatibilità sprite A/B, front verso/contro camera, giunzioni fra terminali dei lotti dello stesso lato strada; solo vicino coerente, mai attraversare una strada.
- `board-preview.js`: fondazioni continue, basamento comune su strada, raccordi `shared` (muretto di frontespizio + tetto corto) e `passage` (passaggio di servizio non sigillato), anchor sprite sul fronte anziché sul centro di bounding box; fallback vettoriale temporaneo per un angolo raster incompatibile.
- Test `tests/block-continuity.test.cjs`: continuità, giunzioni, orientamenti, import delle due anteprime.
- Le 10 sorgenti ImageGen originali sono conservate su Google Drive e la cartella sorgenti già integrata in GitHub resta **immutata**; eventuali WebP rifiniti vanno in nuova cartella `assets/runtime/`, non sovrascrivere `assets/source/`.

## Coordinate e angolazioni reali della plancia

Proiezione attuale: `screenX=(worldX-worldY)*0.76`, `screenY=(worldX+worldY)*0.38`. Rapporto 2:1, senza prospettiva a fuga. Le facciate sono definite dai vertici `poly[0]` → `poly[1]` (fronte affacciato sulla strada) e l'ancora a livello terra `door`. Tutti gli asset devono rispettare la verticale schermo, non “ruotare” il PNG in 2D per simulare una nuova vista: ruoterebbe anche i muri.

| Classe iniziale | Angolo della linea di facciata sullo schermo, modulo 180° | Asset sorgente | Regola |
|---|---:|---|---|
| A — fronte lungo direzione X | 26,565° ±22° | `building_tenement_front_a.png` e fronti A | ammesso se la porta è rivolta alla camera |
| B — fronte lungo direzione Y | 153,435° ±22° | `building_tenement_front_b.png` | solo residenza/tenement B disponibile |
| Non coperto | altri angoli / retro rivolto alla camera | vettoriale isometrico temporaneo | **non** stirare, inclinare o specchiare asset A/B |

I fronti X/Y sono una **prima copertura parziale**, non otto direzioni complete. È normale che parte della città rimanga vettoriale: è preferibile a una figura con geometria falsa. Il piano asset deve colmare questi angoli prima di considerare il restyling finito.

## Nuova libreria da produrre: asset originali separati, PNG/WebP con alpha reale

Per ciascun orientamento necessario, preparare **moduli compatibili per altezza del piano, profondità e attacco del tetto**, non edifici interi generici: `left_end`, `middle_a`, `middle_b`, `right_end`, `corner_outer`, `corner_inner`, `rear_court`, `service_alley`. Set primario: residenziale 2–5 piani. Set secondario: bottega/taverna 2–4 piani; set terziario: produttivo basso, magazzini e scuderie. I moduli devono avere margini trasparenti puliti, **punto d'ancoraggio misurabile** sulla soglia della porta e footprint dichiarato.

### Specifica per ImageGen di ogni singolo asset
- **Un solo modulo per immagine**, transparent background RGBA, nessun pavimento generico opaco, nessuna cornice o titolo/testo; camera ortografica isometrica 2:1, vista alta, verticali parallele, luce calda a sinistra e ombra fangosa, altezza tipica coerente con reference.
- Prompt derivato da un *modulo del settore reale*, con orientamento frontale e laterale esplicito e confronto alla golden; riportare nel metadata `orientation_deg`, `visible_front`, `module_role`, `story_count`, `footprint_world`, `source_approved_ref`, `pivot_bottom_ground`.
- Non usare mirror/rotazione 2D del PNG quando cambia l'orientamento: **generare un'altra vista** della stessa famiglia e verificare proporzioni con screenshot prima di inserirla.
- Al momento i PNG sono opere ImageGen autonome: dopo il passaggio in WebP ottimizzato, dichiarare larghezza/altezza e trim alpha nel manifest. Non simulare completamento copiando o stirando le stesse tre case.
- Moduli di raccordo: spezzoni di tetto, muri comuni, gronde, corti, portoni, nicchie, recinzioni, ombre d'occlusione e fascia bassa di pietra/fango. Sottofondo terreno comune alle file.

## Ordine prioritario per il worker

1. **Verificare la nuova continuità su browser**, screenshot prima/dopo centro Five Points e una strada lunga: nessun PNG sospeso, muri condivisi non coprono finestre, vicoli rimangono accessibili.
2. Produrre e integrare primi moduli trasparenti **di fila** per un solo tratto, meglio 5–8 lotti consecutivi sullo stesso lato strada, seguendo l'angolo reale. Non fare un intero quartiere con asset incoerenti.
3. Migliorare tessitura del terreno/cordoli e raccordi sul fronte comune. Preferire asset di cucitura in profondità come pezzi riutilizzabili.
4. Estendere per gruppi stradali e orientamenti mancanti; controllare memory budget e FPS Android landscape. Conservare sprite individualmente editabili.
5. Solo quando l'intera città non presenta più parti figurina/vettoriali fuori stile, lavorare su HUD completo e refinements; **NPC restano congelati**.

## Criteri di qualità osservabile

- Gli edifici adiacenti formano isolati, con basamenti e falde collegati, senza bordi trasparenti evidenti.
- La proiezione, i pivot e il footprint gameplay sono coerenti.
- La strada mantiene un unico materiale continuo sotto/attorno agli edifici; non compaiono “tappetini” fotografici per singolo PNG.
- Il personaggio (in futuro) può usare il sistema di pathfinding invariato: la cucitura è **grafica**, non un ostacolo collidente nuovo.
- Il settore pilota è leggibile su Android landscape in fullscreen e screenshot di gioco è confrontato con reference.
- Il restyling è una migrazione visiva misurabile, non una semplice lista di immagini generate.
