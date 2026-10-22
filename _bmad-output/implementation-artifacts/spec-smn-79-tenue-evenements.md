# SMN-79 — Constater, annuler et corriger la tenue des événements

Jira : https://lmn24.atlassian.net/browse/SMN-79

## Développement initial
- Prise en charge des cérémonies standards, occurrences issues de modèles et réunions exceptionnelles.
- Réconciliation opportuniste de `scheduled` vers `held` lorsque `ends_at <= now()`, si aucune décision explicite n'a été enregistrée. Idempotente via la condition de statut.
- Qualification manuelle `cancelled` à tout moment, `not_held` ou `held` seulement après la fin du créneau.
- Historique de correction explicitement saisie (ancien statut, nouveau statut, acteur, date, motif facultatif).
- API de consultation et modification sous autorisation, interface FR/EN.
- Aucun mécanisme ne modifie les PDF historiques.

## Réserves importantes
- La réconciliation est effectuée lors d'une lecture de l'API, **pas** par un planificateur de fond autonome.
- L'historique des transitions de statut automatiques n'est pas écrit à chaque passage présumé `held` ; l'état est traçable en base, mais pas l'instant individuel d'exécution.
- L'intégration aux calendriers centraux et rapports/PDF reste à vérifier.
- Aucun test TypeScript, Prisma ou PostgreSQL exécuté ; GitHub Actions indisponible. Recette de statuts passés/futurs, correction, annulation et gestion des droits à effectuer.

**État : implémentation initiale, non validée, PR brouillon.**
