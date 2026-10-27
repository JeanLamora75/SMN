# SMN-297 — Revue technique transversale du lot 3

Deux défauts ont été détectés et corrigés sur la branche de PR #204 :

1. `calendar-meeting-detail.ts` contenait des séquences `\\n` littérales dans la requête SQL contextualisée, empêchant son interprétation PostgreSQL. Remplacement par de vrais retours de ligne.
2. `meeting-change.ts` utilisait les positions de paramètres SQL de Scrum également pour Kanban, alors que la colonne de durée n'y est pas modifiée. Les positions 5/6 sont désormais employées pour Kanban, 6/7 pour Scrum, avec une liste d'arguments adaptée.

Le test `tests/smn-297-lot3-review-sql-regressions.test.ts` protège les deux contrats par inspection statique. À vérifier sur le PC de développement : compilation, tests, flux de création/modification Kanban/Scrum et isolation interéquipes. Aucun test exécuté ici, aucune migration, aucune activation du verrou et aucune fusion.
