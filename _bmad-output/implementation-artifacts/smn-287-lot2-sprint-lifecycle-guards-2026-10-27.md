# Lot 2 — Protection des cycles de vie de Sprint historiques

Les routes historiques `POST/DELETE /api/admin/sprints/delete` et `POST/PATCH /api/admin/sprints/reschedule` exécutent maintenant leurs opérations de prévisualisation et confirmation dans `withLegacyTeamApi`, interdisant les chemins non contextualisés pour les installations v28 et v29. `closure` et `states` disposaient déjà de cette protection.

Ces opérations restent compatibles avec le schéma historique monoéquipe ; les remplacements multiéquipes devront vérifier acteur, équipe et appartenance du Sprint avant tout accès. Aucun test, build, migration ou déverrouillage exécuté.
