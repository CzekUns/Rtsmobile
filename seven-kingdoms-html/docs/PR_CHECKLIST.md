# Modello di Pull Request — Seven Kingdoms HTML Edition

**Titolo:** \`[SKH-10N] <obiettivo specifico>\` · **Base:** \`main\` · **Head:** \`agent/skh-<stream>/<task>\`

## Consegna
- Issue: \`#...\` / stream: \`...\`
- Scope: solo path in \`WORKSTREAMS.json\`? [ ]
- Sorgenti originali consultati: versione/commit/percorso \`...\`
- File nuovi o cambiati: \`...\`
- API / contratti consegnati: \`docs/<stream>/CONTRACT.md\`
- Limitazioni / differenze da 7KAA: \`...\`
- I file \`game.js\`, \`rules.js\`, \`view.js\`, \`index.html\`, \`style.css\` restano invariati nei branch diversi da integration: [ ]

## Prove
- [ ] \`npm --prefix seven-kingdoms-html test\`
- [ ] \`node --check\` sui JS modificati
- [ ] Test di parità specifici, screenshot o GIF di confronto (dove applicabili)
- [ ] Nessuna modifica a Ver Sacrum o \`CzekUns/sevenkindomsmobile\`
- [ ] Licenze e provenienza di qualsiasi asset verificate
- [ ] CI "JS tests & stream scope" verde

## Handoff a SKH-106
- Nuovi import/export: \`...\`
- Dove devono essere collegati: \`...\`
- Dati/fixture necessari: \`...\`
- Dipendenze e rischi: \`...\`
- Nessuna attività "in background" promessa: l'issue rappresenta lavoro ancora da fare finché non esiste PR approvata.

**Non fare merge prima della review**. Il merge dello stream non comporta automaticamente l'integrazione della funzione nel gioco.
