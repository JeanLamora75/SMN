# SMN — Refonte UX des Registres

**Validation fonctionnelle :** 21 décisions UX-REG approuvées le 25 octobre 2026. **Epic Jira :** [SMN-228 — Refonte UX](https://lmn24.atlassian.net/browse/SMN-228). **Stories créées :** [SMN-239](https://lmn24.atlassian.net/browse/SMN-239) à [SMN-253](https://lmn24.atlassian.net/browse/SMN-253).

## Lecture prescrite à Sally, Amelia et aux agents BMAD
1. [SYNTHESE-UX-REGISTRES.md](SYNTHESE-UX-REGISTRES.md) — 21 décisions explicitement approuvées.
2. [DESIGN.md](DESIGN.md) — présentation et composition.
3. [EXPERIENCE.md](EXPERIENCE.md) — parcours, interactions, états et exceptions.
4. [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) — lots R1 à R15 et impacts techniques.
5. [RECETTE-UX.md](RECETTE-UX.md) — scénarios REG-T01..REG-T34 non testés.
6. [PROMPT-AMELIA.md](PROMPT-AMELIA.md) — consigne prête à copier pour commencer SMN-239.
7. [Référentiel transversal](../../../../docs/UX-REFERENTIEL-BMAD.md) — invariants SMN, fiche Sprint et Dashboard.

**Important :** cette refonte concerne le **registre global** ; les routes/modales et snapshots historiques de l'onglet Registres de la fiche Sprint (SMN-234) restent propriétaires de leur contrat dédié. Les règles métier des six types et les autorisations Epic 5 ne sont pas redéfinies.

**Quatre points non arbitrés :** classification `highlight.recorded` pour suivi, seuils de vigilance supplémentaires, droit user sur historique détaillé, suppression générale des fiches (hors périmètre jusqu'à arbitrage).

**Méthode :** skills BMAD GitHub bmad-agent-ux-designer et bmad-ux consultés. Production manuelle via connecteurs, sans exécution des scripts `uv`, `memlog`, validateurs de workflow ou tests applicatifs. Documentation validée ≠ application développée ou testée.
