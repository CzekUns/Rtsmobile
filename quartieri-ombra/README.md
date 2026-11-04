# Quartieri d'Ombra — RTS di controllo territoriale

**Titolo provvisorio.** Piccolo RTS HTML5 originale in una città industriale ottocentesca immaginaria. Estetica finale vincolante: strategico isometrico 2D, cupo, 1998–2003.

## Gioco
Avvio diretto da `index.html` senza compilazione o dipendenze esterne. Scegli difficoltà, controlla il clan con un edificio residenziale e un gendarme. Le case producono reclute spontanee se fedeli; i produttivi accumulano oro da riscuotere con esattori; i mercenari sono acquistabili. Gendarmi fermi influenzano edifici vicini, con efficacia legata al livello e distanza; gli assalti sono una via alternativa.

## Controlli di visualizzazione
- **Smartphone:** ruota il dispositivo in orizzontale prima di iniziare; in verticale compare una schermata che blocca la partita.
- **Schermo intero:** tocca il pulsante `⛶` nella barra in alto. Il blocco hardware in orizzontale è richiesto quando consentito dal browser; su alcuni dispositivi non è disponibile.
- **Mappa:** trascina direttamente il campo di gioco per spostare la visuale, usa due dita per zoom. Il resto della UI (comandi, punteggio, minimappa) non deve più seguire il trascinamento.
- **Fisso nel display:** il gioco evita lo scorrimento del documento; la mappa occupa lo spazio che rimane tra barra alta e pannello comandi.
- **In attesa di collaudo:** compatibilità fullscreen/orientamento e overflow responsive su dispositivi Android reali.

## Pubblicazione prevista
https://czekuns.github.io/Rtsmobile/quartieri-ombra/

Il repository pubblica la root `main` tramite GitHub Pages. La URL è il percorso previsto, **non ancora verificato in browser** al primo upload.

## Stato
Build tecnica iniziale presente, non ancora collaudata né con asset definitivi. La grafica Canvas attuale è un placeholder programmato: **non equivale** al mockup isometrico anni 90/2000 approvato. La corrispondenza estetica resta un obiettivo prioritario di ROADMAP.md.

## Worker
Task orario separato: `6aeae2b713b0819184a4bc340c5a0ae6`; esecuzione ogni ora fino alla Definition of Done. Ogni sessione deve produrre lavoro reale verificato e annotato.

## Lavori isolati
**Unico path consentito:** `quartieri-ombra/`. Non alterare i giochi pubblicati alla root, in `ver-sacrum-7k/`, `seven-kingdoms-html/` né i workflow globali.

## Documenti
- `AGENTS.md` — regole obbligatorie per agenti/worker
- `SPEC.md` — meccaniche e direzione grafica approvate
- `ROADMAP.md` — milestone e criteri di conclusione
- `WORKLOG.md` — registro delle iterazioni
