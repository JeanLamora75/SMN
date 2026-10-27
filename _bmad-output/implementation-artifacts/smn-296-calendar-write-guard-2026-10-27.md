# SMN-296 — Gardes serveur des modifications calendrier / cérémonies (27/10/2026)

## Publication
- `src/server/sprints/calendar-meeting-reschedule.ts` : blocage explicite des mises à jour calendrier legacy sur les schémas v28/v29 avant DDL et début de transaction.
- `src/server/sprints/ceremony-edits.ts` : même verrou d'accès sur la modification legacy des cérémonies, avant DDL.
- `tests/smn-296-legacy-calendar-write-guard.test.ts` : deux scénarios préparatoires de refus des écritures v29.

Ces modifications protègent les services eux-mêmes en cas d'appel hors des routes HTTP déjà verrouillées par `withLegacyTeamApi`. Il ne s'agit pas encore de la réécriture multiéquipes des éditions : celle-ci devra exiger un contexte admin/équipe, un contrôle de propriété de l'événement, et un verrou transactionnel sur l'équipe active.

Tests non exécutés. Aucun déploiement ni migration. Garder les écritures multiéquipes désactivées.
