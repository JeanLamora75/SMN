# Lot 3 — Création de réunions du Calendrier contextualisée

La vue `team-calendar-view.tsx` utilise maintenant `POST /api/admin/team-meetings` lorsque `initialTeamId` est présent. Le payload transporte explicitement `teamId`, `kind` Scrum/Kanban et `cycleId` sélectionné ; le service valide la cohérence de l'équipe et du cycle. Sans contexte multiéquipes, le formulaire conserve le chemin historique monoéquipe. Le verrou `MULTI_TEAM_CONTEXT_READY=false` continue de refuser les écritures contextualisées, qui restent indisponibles tant que la recette n'est pas terminée.

Le test `tests/smn-297-calendar-scoped-meeting-create.test.ts` vérifie le contrat de requête et le refus d'identifiants invalides. Les modifications de réunions et le formulaire d'absence restent à intégrer aux API contextualisées et à tester. Aucun test ni migration exécuté.
