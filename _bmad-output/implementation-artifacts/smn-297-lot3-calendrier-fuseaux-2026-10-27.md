# SMN-297 — Lot 3 : fuseaux horaires du Calendrier par équipe

La route `GET /api/team-calendar/time-zones` ne prend plus arbitrairement une équipe lorsque le schéma est multiéquipes v28/v29. Elle valide la requête et résout le `teamId` via `resolveAdminTeam`, lequel revalide en base les droits administrateur et refuse les équipes archivées en v29. Le composant Calendrier transmet le `teamId` dans l'appel à cette route, comme il le fait déjà pour les périodes et réunions. Le comportement monoéquipe v1–v27 est conservé avec refus d'un `teamId` externe.

Test statique ajouté dans `tests/smn-297-calendar-time-zones-isolation.test.ts`. Les autres lectures et mutations du Calendrier restent à qualifier avant activation. Aucun test exécuté, aucun changement de schéma ou activation.
