# Epic 4 — P0-05 : sécurisation du calcul de capacité réelle

## Changements
- La lecture de capacité réelle et sa clôture activent un contrôle supplémentaire sur les réunions exceptionnelles marquées `impacts_capacity`.
- Si une telle réunion non annulée existe, la référence de capacité réelle est indiquée non calculable tant que les participants ne sont pas attribués. Aucun JH fictif n'est soustrait.
- La capacité initiale n'est pas affectée par cette règle.
- Les qualifications de tenue d'événements refusent désormais les modifications sur un Sprint clôturé ; la réconciliation automatique des présences l'exclut.
- L'initialisation des occurrences modèles est appelée avant les accès de présence.

## Points encore ouverts — NO-GO
- Il manque une modélisation des participants à chaque réunion, des disponibilités réelles et des éventuels chevauchements entre événements : aucun calcul de déduction JH exact ne peut être produit sans ces données.
- Le signalement conservateur rend non calculables certaines périodes réelles plutôt que d'inventer des chiffres. C'est une protection temporaire, pas l'acceptation complète de SMN-81.
- Les calculs standards des autres sources ne sont pas validés.
- P0-03 et P0-04 restent à compléter selon le suivi P0 précédent.
- TypeScript, Prisma, PostgreSQL et tests fonctionnels non exécutés. GitHub Actions indisponible.

Aucune fusion main, aucun changement Jira.
