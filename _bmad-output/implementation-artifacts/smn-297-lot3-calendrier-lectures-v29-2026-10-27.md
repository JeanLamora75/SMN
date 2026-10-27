# Lot 3 — Calendrier : lectures contextualisées v29

Les routes `GET /api/team-calendar`, `/api/team-calendar/periods` et `/api/team-calendar/meetings` acceptent désormais la version 29, en conservant la résolution explicite d'équipe via `resolveAdminTeam` pour les administrateurs. Les lectures de versions monoéquipe historiques continuent dans leur branche dédiée. Les modifications de détails et de comptes rendus des réunions restent bloquées via `withLegacyTeamApi` en v28/v29 ; leur remplacement reste à développer. Aucun déverrouillage fonctionnel, aucune migration.

Test de contrôle source préparé : `tests/smn-297-calendar-v29-context.test.ts`. Les tests et la compilation n'ont pas été exécutés. Le périmètre des absences et mutations du calendrier nécessite encore une revue distincte.
