# Lot 2 — Verrouillage des écritures de capacité historiques

Les routes `POST /api/admin/capacity-actual/close`, `PUT /api/admin/sprints/capacity-kpis`, `POST /api/admin/sprints/historical-capacity` et `POST /api/admin/sprints/historical-actual-capacity` empruntent désormais `withLegacyTeamApi` pour empêcher l'exécution du chemin d'écriture monoéquipe sur les schémas multiéquipes (>=28). Les routes d'ouverture de capacité et d'historique général utilisaient déjà ce garde-fou. L'édition de capacité réelle possède sa propre route contextualisée, toujours verrouillée.

À poursuivre : vérification exhaustive des autres écritures, tests d'API en v27/v29, compilation et scénarios de clôture. Aucun test, build, migration ou activation exécuté.
