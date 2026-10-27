# Lot 2 — Index des cycles isolés par équipe

`GET /api/admin/team-cycles/list?teamId=...` exige un administrateur actif, vérifie le contexte via `resolveAdminTeam` et retourne les Sprints Scrum avec les filtres habituels ou les périodes Kanban de la seule équipe autorisée. Le lecteur Scrum `readSprintIndex` accepte un contexte d'équipe vérifié ; l'ancienne API `/api/sprints/index` est bloquée sur les schémas 28 et 29. La lecture ne crée ni table ni cycle.

À vérifier : tests de pagination et d'isolation entre équipes, erreurs des schémas historiques, UI Cockpit Agile, accès aux cycles et états archivés. Aucun build ni test effectué. Aucune migration, activation ou fusion.
