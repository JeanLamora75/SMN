# Lot 1 — Passe A : premier raccordement des routes de création de cycles

Date : 27 octobre 2026. PR #204, branche dédiée.

## Réalisé
- `GET/POST /api/admin/sprints` historique passent désormais par `withLegacyTeamApi`, bloquant les schémas v28/v29 AVANT l'ancienne création monoéquipe.
- Nouveau `POST /api/admin/team-cycles` unique, branche Scrum ou Kanban sur les services déjà préparés, avec authentification d'administrateur, validation du mode et entrée du service de création contextualisée.
- **Verrouillage inchangé :** `MULTI_TEAM_CONTEXT_READY=false` et `SMN_MULTI_TEAM_WRITES_ENABLED` doivent tous deux être autorisés pour utiliser cette route. Aucun déverrouillage décidé ni effectué.

## Prochain travail de passe A
- Corriger les éventuelles erreurs TypeScript/build ; vérifier les contrats réels de cadence et audit.
- Faire correspondre l'UI de création de cycles aux paramètres `teamId`, `mode` et `cadenceRevision`.
- Recenser les autres routes historiques sans garde et définir leurs remplacements ; préparer des tests d'autorisation et d'isolation.
- Laisser migration v29 et bascule de verrou en attente de recette.

**Aucun build ni test exécuté, aucune migration réalisée.** La PR n'est pas prête pour fusion.
