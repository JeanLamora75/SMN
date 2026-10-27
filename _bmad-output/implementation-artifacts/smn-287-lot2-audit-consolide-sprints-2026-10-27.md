# SMN-287 — Lot 2 : audit consolidé des API historiques de Sprint

## Résultat vérifié dans la branche de travail

Quatorze routes historiques ont été modifiées pour appeler `withLegacyTeamApi` à la place de `withAuthDb` : `actual-duration`, `batch`, `exceptional-capacity-impact`, `historical-partial`, `historical`, `lunch`, `names`, `preview`, `review-analysis`, `review-capacity`, `trends`, `work-slots`, `wizard/confirm`, `wizard/preview`.

Cela empêche ces parcours non contextualisés de fonctionner sur les schémas multiéquipes v28/v29 et conserve leur exécution dans l'environnement monoéquipe historique.

## Limites et suite

- L'audit est ciblé sur les routes de Sprint examinées, et n'est pas une preuve d'exhaustivité sur toutes les API SMN.
- La route `qualitative-versions` utilise `withSprintIndexDb` et nécessite un contrôle spécifique de son garde de schéma.
- Les routes `[id]`, événements historiques individuels et modules hors Sprint restent à examiner.
- Construire les API de remplacement contextualisées et exécuter tests croisés équipe A/B et tests de non-régression v27.
- Aucun test, build, migration ou activation exécuté ; `MULTI_TEAM_CONTEXT_READY` reste faux et la PR reste en brouillon.
