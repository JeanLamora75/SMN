# Lot 2 — Protection des API historiques d'indicateurs Scrum

Quatre routes ont été protégées par `withLegacyTeamApi` : `sprints/scores`, `sprints/story-points`, `sprints/goals` et `sprints/tickets`. Les lectures et écritures historiques par seul `sprintId` ne sont plus utilisables sur les schémas multiéquipes v28/v29 sans contrat d'autorisation par équipe.

La compatibilité historique v27 est conservée. Le développement d'API multiéquipes de remplacement et les tests croisés restent nécessaires. Aucune migration, aucun build ou test exécuté ; les verrous multiéquipes restent fermés.
