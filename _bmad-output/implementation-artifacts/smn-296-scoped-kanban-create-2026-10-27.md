# SMN-296 — Création Kanban multiéquipes, service isolé — 27/10/2026

## Code publié
- `src/server/kanban/scoped-create.ts` : nouvelle entrée `createScopedKanbanPeriod` acceptant un `teamId` explicite et une révision de cadence ; vérification admin/installation et mode d'équipe via `resolveAdminTeam` ; verrou de ligne équipe `FOR UPDATE`, refus archive, cadence propre à l'équipe, contrôle de chevauchement et audit dans une transaction unique.
- `tests/smn-296-scoped-kanban-create.test.ts` : validation du contrat, refus équipe archivée, scénario d'écriture et audit.

## Limites importantes
- Aucune route HTTP raccordée et aucune fonctionnalité utilisateur activée.
- Le service exige le schéma 29 ; la structure Kanban/cadence doit être préalablement disponible. Il ne crée pas de tables à chaud.
- La protection concurrence avec un archivage futur exige que l'archivage prenne les mêmes verrous transactionnels.
- La migration 29 n'a pas été exécutée, et ni tests, ni compilation n'ont été réalisés.
- Le service de création de Sprint multiéquipes reste à développer.
- Aucun mécanisme de droits `user` en V1 : admin uniquement.
