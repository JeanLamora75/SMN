# Lot 3 — Modification des réunions contextualisée

Le Calendrier affiche désormais un éditeur propre aux réunions manuelles Scrum (`exceptional`) et Kanban pour lesquelles le `teamId` est connu. Les opérations de replanification et annulation utilisent `PATCH /api/admin/team-meetings/change` avec équipe, mode, ID, horaires attendus et nouveaux horaires, permettant le contrôle d'appartenance et de concurrence dans `changeTeamMeeting`. Le fonctionnement historique monoéquipe est préservé. Les cérémonies générées et leurs comptes rendus multiéquipes ne sont pas encore éditables par cet écran : ne pas les faire passer par une API non contextualisée.

Test statique ajouté, non exécuté : `tests/smn-297-scoped-meeting-editor.test.ts`. Limite : vérifier les fuseaux horaires et les données de détails lors de la recette. Aucun déverrouillage, migration ou fusion.
