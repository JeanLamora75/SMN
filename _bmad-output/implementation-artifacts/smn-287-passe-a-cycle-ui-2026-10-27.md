# Lot 1 — Passe A : formulaire de création de cycles multiéquipes

27/10/2026 — PR #204.

Le composant `team-cycle-create-form.tsx` fournit un formulaire unifié Scrum/Kanban et envoie `mode`, `teamId`, `cadenceRevision`, `startOn` et le nom facultatif à `POST /api/admin/team-cycles`.

Une page dédiée `/app/admin/team-cycles` résout le contexte admin/équipe côté serveur, lit la révision de la cadence spécifique à l'équipe, et affiche le formulaire. **Elle reste désactivée** tant que `MULTI_TEAM_CONTEXT_READY` est faux et que `SMN_MULTI_TEAM_WRITES_ENABLED` n'est pas actif. Les anciens assistants de création ne sont pas encore remplacés ; aucun lien de navigation nouveau n'est ajouté.

À finaliser : navigation du Cockpit Agile, génération/aperçu en lot, cohérence des permissions, tests TypeScript et intégration UI en conditions v29. Aucune compilation, aucun test ni migration exécuté.
