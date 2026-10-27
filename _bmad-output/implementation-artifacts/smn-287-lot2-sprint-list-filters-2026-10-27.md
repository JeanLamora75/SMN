# Lot 2 — Filtres et pagination de la liste de cycles

Le composant TeamCycleList affiche maintenant, en mode Scrum, la recherche par nom, le filtre de statut, le tri et la pagination par 25 résultats. L'identifiant de l'équipe demeure transmis avec chaque requête, et la réponse est vérifiée contre le contexte attendu. Le changement d'un filtre remet la pagination à la première page. En mode Kanban, le composant conserve la liste en lecture seule sans paramètres de filtre non pris en charge par son API.

La route `/api/admin/team-cycles/list` et ses garde-fous n'ont pas été modifiés. Aucun build, test ni migration exécuté. À poursuivre : validation des scénarios interéquipes, pagination Kanban au-delà de 200 périodes, synchronisation de la sélection d'équipe avec le Cockpit Agile.
