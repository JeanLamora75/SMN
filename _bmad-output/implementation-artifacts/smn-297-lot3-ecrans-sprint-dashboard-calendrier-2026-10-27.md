# Lot 3 — Isolation des écrans Tableau de bord, Sprints et Calendrier

Audit ciblé des pages `src/app/app/page.tsx`, `src/app/app/admin/sprints/page.tsx`, `src/app/app/team-calendar/page.tsx` et des vues clientes. Le tableau de bord vérifie déjà la présence du `cycleId` dans la liste de l'équipe active et refuse les cycles étrangers. L'index Sprint historique se fondait uniquement sur le mode de l'installation : le garde exige maintenant `schema_version <= 27` pour éviter d'afficher la vue monoéquipe lorsque le schéma est multiéquipes.

Tests statiques ajoutés : `tests/smn-297-legacy-screen-team-isolation.test.ts`. L'écran Calendrier reste à contextualiser intégralement (lecture/écriture, `teamId`, `cycleId`) avant ouverture des parcours multiéquipes ; ne pas activer le verrou. Ces tests n'ont pas été exécutés. Aucun changement PostgreSQL, migration, activation ou fusion.
