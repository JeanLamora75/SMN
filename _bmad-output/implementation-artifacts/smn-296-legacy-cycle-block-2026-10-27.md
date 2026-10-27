# SMN-296 — Interdiction explicite des créations de cycles historiques

Date : 27 octobre 2026. Statut : code publié, non testé.

Les points de création historiques monoéquipe suivants vérifient désormais `assertLegacyTeamApi(db)` avant leur accès aux données ou leur DDL :
- `src/server/sprints/batch-confirm.ts` : émission, confirmation et lecture d'historique du lot.
- `src/server/sprints/historical-create.ts` : création historique.
- `src/server/kanban/batch-create.ts` : création en lot.
- `src/server/kanban/periods.ts` : préparation et création unitaire.

Ce contrôle échoue volontairement dès la version 28. Les routes doivent rester inaccessibles en v28/v29 jusqu'au remplacement des recherches monoéquipe par un contexte admin/équipe correctement autorisé. Cela évite de convertir hâtivement une route construite autour du mode global `smn_installation.mode` en accès multiéquipes.

**Ce lot n'ajoute PAS la création multiéquipes des cycles.** Des services transactionnels dédiés avec paramètres d'équipe explicites devront être développés avant d'activer l'usage v29 ; la vérification du mode et de l'équipe archivée doit rester transactionnelle. SMN-296 reste en cours, aucune base modifiée, aucun test lancé.
