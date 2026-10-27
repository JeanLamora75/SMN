# Lot 3 — Calendrier : écriture d'absence contextualisée

`team-calendar-view.tsx` transmet `initialTeamId` au composant `MemberAbsenceEditor`. Le formulaire envoie alors les modifications vers `POST /api/admin/members/[id]/team-absence` avec `{teamId,change}` ; en monoéquipe, il conserve l'ancienne API. Cette nouvelle route vérifie déjà le rôle admin, l'affectation d'équipe et le verrou `MULTI_TEAM_CONTEXT_READY`.

**Limite bloquante :** le GET de l'éditeur utilise encore `/api/admin/members/[id]/absences`, protégé par `withLegacyMemberApi` ; l'éditeur ne peut donc pas encore charger les données sur les schémas multiéquipes. Il faut développer une lecture contextualisée avant d'ouvrir la fonctionnalité. L'édition des réunions reste également à raccorder.

Test statique : `tests/smn-297-calendar-absence-write-wiring.test.ts`. Aucun test, build ni migration exécuté.
