# SMN-264 — Comparaison et actualisation des données du rapport

## Implémentation initiale
- Route GET de comparaison, fondée sur `prepareSprintReport` et les quatre indicateurs existants.
- Route POST volontaire avec autorisation d'écriture admin : verrou SQL sur le document ciblé ; la transaction remplace uniquement `metrics` et `dataSource`.
- Les clés `userNotes`, `analyses`, `blocks`, `sections`, `templateSnapshot` et autres contenus du document sont préservées.
- Panneau de fraîcheur avec anciennes/nouvelles valeurs, unités, messages d'absence et confirmation explicite.
- Les archives PDF et les autres documents ne font l'objet d'aucune requête UPDATE.
- Libellés FR/EN ; tests purs ajoutés mais non exécutés.

## Limites à résoudre
- La comparaison est fondée sur quatre indicateurs seulement ; provenance détaillée et mesures tickets supplémentaires non encore intégrées.
- La source peut évoluer entre l'affichage GET et la confirmation POST ; la transaction recalcule alors les chiffres, mais ne compare pas de jeton de référence d'aperçu.
- La sauvegarde automatique du Studio est un composant client distinct du panneau : risque d'écraser le résultat d'une actualisation si une écriture du Studio était déjà en vol. Avant merge, coordonner les états de sauvegarde/actualisation (ou désactiver le POST durant la saisie), puis recette concurrence.
- Un commentaire potentiellement devenu incohérent n'est pas analysé automatiquement ; aucun avertissement non fiable n'est inventé.
- Tests, typecheck, build, droits, PostgreSQL et non-régression archives non exécutés.
- Dépend des PR #146 à #155 ; aucune fusion dans main et aucune clôture Jira.

**Statut : partiel, non validé.**
