# Quartieri d'Ombra — Asset Library

**Direzione vincolante:** [ART_DIRECTION.md](../ART_DIRECTION.md). Il layout approvato dall'utente è IN-GAME, low-res, isometrico PC 1998–2003, non key art cinematografico.

## Sorgenti già integrate su GitHub
- Edificio residenziale: `buildings/residential_tenement_lowres.webp`, estratto da immagine generata (64x64 pixel, fondo trasparente)
- Due unità idle: `units/gendarme_idle_lowres.webp`, `units/mercenary_idle_lowres.webp` (sprite trasparenti; estratti dai fogli originali di 8 direzioni/animazioni)
- Quattro tile terreno SVG: `terrain/mud.svg`, `cobble.svg`, `puddle.svg`, `debris.svg`
- Cinque props SVG: `props/barrel.svg`, `crate.svg`, `street_lamp.svg`, `wooden_fence.svg`, `lantern.svg`

## Altri asset generati nello stesso lotto ma NON ancora caricati qui
- 2a residenza, fonderia, mulino industriale in PNG/WebP e altre varianti di texture.
- Fogli sprite completi di gendarme e mercenario; HUD composito; 12 terreni; concept sheet con taverna, mercato, magazzino, distilleria, altre case, props.
- Questi sono stati organizzati in un pacchetto locale nel turno ChatGPT; per la compilazione in repo vanno caricati individualmente. **Non dichiararli presenti nella repo.** Il worker deve verificare sempre la disponibilità del file prima di referenziarlo.

## Criteri di uso
## Integrazione grafica attuale
Dal commit `0efddc78c7a7d83332239493b2d6f6d55150cce2`, `game.js` usa realmente anche i cinque SVG in `assets/props/`: barili, casse, lampioni, recinzioni e lanterne. Sono disegnati con anchor alla base, sorting isometrico comune e fallback procedurale. Sono decorazioni **non collidenti**, per non alterare pathfinding/unità; un collaudo visivo sulla mappa reale è ancora necessario.


- Per Canvas: `new Image()`, path relativo `./assets/...`, draw solo dopo `onload`/ `complete && naturalWidth`; fallback se mancante.
- NON usare il mockup singolo come fondale: edifici, unità e terreno sono pezzi separati per simulazione e collisioni.
- Decidere pivot, zoom e footprint di ciascuno, mantenendo rapporto isometrico della camera.
- Le immagini dell'asset sheet composito hanno anche etichette testuali: **non** inserire direttamente come singoli sprite prima di estrazione e pulizia.
- Il worker aggiorni `manifest.json` con i nuovi file effettivamente caricati e collaudati.
