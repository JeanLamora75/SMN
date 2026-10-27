# Lot 2 — Contexte de cycles par équipe (lecture seule)

Le nouvel endpoint `GET /api/admin/team-cycles` renvoie le nom, le mode Agile et la révision de cadence de l'équipe active autorisée. Le paramètre facultatif `teamId` est revalidé par `resolveAdminTeam` contre l'administrateur connecté et son installation. Les paramètres imprévus ou répétés sont refusés.

`canCreate` demeure faux tant que le verrou logiciel `MULTI_TEAM_CONTEXT_READY` et le drapeau de déploiement ne sont pas activés. La route POST reste indépendante et fermée. Aucun choix de mode ou de révision venant du client n'est utilisé pour cette lecture.

Intégration aux composants et recette interéquipes à poursuivre. Aucun test, build, migration ou activation exécuté.
