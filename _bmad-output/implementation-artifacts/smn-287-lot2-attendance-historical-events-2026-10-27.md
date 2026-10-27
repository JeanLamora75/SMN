# Lot 2 — Sécurisation des accès historiques aux événements Scrum

Les routes `sprints/attendance` (lecture, historique et qualification), `sprints/historical-events` (création) et `sprints/meeting-conflicts` (lecture) sont désormais protégées par `withLegacyTeamApi`, empêchant l'utilisation des parcours monoéquipe sur les schémas multiéquipes v28/v29. Les routes `sprints/templates` et `sprints/template-occurrences` disposaient déjà du même verrou.

À faire : API contextualisées pour les événements et la présence, tests de non-régression historiques et d'isolation, audit exhaustif de toutes les routes restantes, validation TypeScript et compilation. Aucun test, build, migration ou déverrouillage exécuté.
