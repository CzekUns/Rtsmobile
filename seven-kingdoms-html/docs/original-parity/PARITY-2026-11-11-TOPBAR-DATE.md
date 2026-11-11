# PARITY-2026-11-11-TOPBAR-DATE

- **Componente:** barra superiore, conservazione delle informazioni su smartphone landscape.
- **Fonte HTML:** `index.html` (`#date`, `#gameSpeed`, pulsanti report e menu); `style.css` (breakpoint 850px).
- **Differenza oggettiva:** la versione HTML nascondeva completamente data e velocità sotto 850px, pur continuando a mostrare rapporti e pulsanti. La nuova regola conserva data/velocità e rende più compatta la disposizione sotto 620px.
- **Fonte originale:** geometria/texture/icone dell'HUD originale **non ancora confrontate** con screenshot verificati o risorse licenziate. Nessuna rivendicazione di parità grafica originale.
- **Modifica:** CSS responsive senza cambiare DOM, asset o controlli touch; test statici Node.
- **Verifica:** eseguire `npm --prefix seven-kingdoms-html test`; confrontare 1×/2× in Chromium su 568×320, 800×600 e desktop, verificando leggibilità e overflow. Non certificato visivamente.
- **Stato:** DA CORREGGERE (parità originale e browser non verificati).
- **Dipendenza successiva:** asset barra superiore con provenienza/licenza verificata dalla corsia Assets #13; non modificare quella pipeline.

## Aggiornamento: navigazione dei nove rapporti (2026-11-11)

- **Differenza HTML:** la barra dei rapporti è orizzontalmente scorrevole nei viewport stretti, ma non prevedeva allineamento degli elementi durante lo scorrimento né un'indicazione più evidente quando il focus da tastiera entra nella striscia.
- **Modifica:** `scroll-snap-type:x proximity`, `scroll-snap-align:start` sui pulsanti, scrollbar visibile con `:focus-within`, supporto touch inerziale WebKit e rispetto di `prefers-reduced-motion`. Nessun asset o misura originale introdotti.
- **Commit:** `859d6cf` (CSS), `72b25a1` (test); PR #105.
- **Test:** aggiunta verifica Node statica. Esecuzione della suite completa e browser 1×/2× non attestati in questa esecuzione; CI del nuovo HEAD da controllare.
- **Fonte originale:** non attestata per queste migliorie di accessibilità; parità grafica originale ancora BLOCCATA da confronto screenshot e asset autorizzati.
- **Stato:** DA CORREGGERE, fino a test runtime e confronto grafico.

## Aggiornamento: safe area asimmetrica landscape (2026-11-11)

- **ID:** SKH-106-TOPBAR-SAFEAREA.
- **Fonte HTML:** `style.css`, regola fullscreen `.topbar` con `env(safe-area-inset-*)`; `index.html` dichiara `viewport-fit=cover`.
- **Differenza oggettiva:** i padding sinistro e destro usavano gli inset del lato opposto. Su telefoni landscape con notch asimmetrico la protezione del contenuto era applicata al bordo sbagliato.
- **Implementazione:** allineati `padding-left` a `safe-area-inset-left` e `padding-right` a `safe-area-inset-right`, senza modificare dimensioni originali, asset, ORDINI, COMANDI, MOD o selezione multipla.
- **Commit:** `56e6fcd` (CSS), `8a9baf4` (test); PR #105.
- **Test:** controllo statico dei sorgenti pubblicati PASS; test Node aggiunto ma suite completa/CI e prova Android landscape con notch a destra e sinistra ancora da verificare. Nessun deploy attestato.
- **Originale:** questa è una MOD di adattamento smartphone, non una caratteristica rivendicata dell'HUD 7KAA; texture e cornici originali restano in attesa di asset con licenza/provenienza verificata.
- **Stato:** DA CORREGGERE (test dispositivo e confronto originale mancanti).
