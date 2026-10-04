# T08 — Vista Skill separata (BUILD 39)

La vista Skill è distinta dal paperdoll Personaggio, ma legge lo stesso record
persistente dell'abitante selezionato. Mostra tutte le abilità, livello, XP corrente
e progresso verso il livello successivo; funziona anche per residenti non presenti
fisicamente sulla mappa.

Il progresso nasce soltanto dall'uso già simulato: raccolta, agricoltura,
costruzione, domesticazione e combattimento. Il passaggio di livello conserva
l'XP eccedente e può attraversare più livelli in una sola assegnazione.

Soglia (livello × 20 XP), livello massimo 20 e assenza di lock sono parametri
provvisori configurabili in `TERRA_SKILLS`, non decisioni approvate sul
bilanciamento finale. Le conoscenze edilizie restano fuori da questa vista e
saranno un dominio separato in T09.
